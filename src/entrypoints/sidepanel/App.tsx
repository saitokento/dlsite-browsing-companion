import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { CharacterId, CommentHistoryItem } from "@/utils/types.ts";
import {
  CHARACTER_ID_KEY,
  isCharacterId,
  pruneExpiredCommentHistory,
} from "@/utils/exports";
import "./App.css";

function App() {
  const [commentList, setCommentList] = useState<CommentHistoryItem[]>([]);
  const hasStreamEntryRef = useRef(false);
  const commentListRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const commentListElement = commentListRef.current;

    if (!commentListElement) {
      return;
    }

    commentListElement.scrollTop = commentListElement.scrollHeight;
  }, [commentList]);

  useEffect(() => {
    let active = true;
    let historyLoadSeq = 0;

    const nextSeq = () => ++historyLoadSeq;
    const isLatest = (seq: number) => active && seq === historyLoadSeq;

    const initialSeq = nextSeq();
    loadCommentHistory()
      .then((commentHistory) => {
        if (isLatest(initialSeq)) {
          setCommentList((prev) =>
            prev.length === 0 ? commentHistory : [...commentHistory, ...prev],
          );
        }
      })
      .catch((err) => {
        console.error("Failed to load comment history:", err);
      });

    const removeStreamStartListener = onMessage("comment:stream-start", () => {
      hasStreamEntryRef.current = true;
      setCommentList(startNewComment);
    });

    const removeStreamChunkListener = onMessage(
      "comment:stream-chunk",
      (message) => {
        setCommentList((prev) => {
          const [next, created] = appendChunkToLastComment(
            prev,
            message.data,
            hasStreamEntryRef.current,
          );
          if (created) {
            hasStreamEntryRef.current = true;
          }
          return next;
        });
      },
    );

    const removeOptionsHistoryResetListener = onMessage(
      "options:history-reset",
      async () => {
        hasStreamEntryRef.current = false;
        const resetSeq = nextSeq();

        try {
          const commentHistory = await loadCommentHistory();
          if (isLatest(resetSeq)) {
            setCommentList(commentHistory);
          }
        } catch (err) {
          console.error("Failed to reload comment history after reset:", err);
          if (isLatest(resetSeq)) {
            setCommentList([]);
          }
        }
      },
    );

    return () => {
      active = false;
      removeStreamStartListener();
      removeStreamChunkListener();
      removeOptionsHistoryResetListener();
    };
  }, []);

  return (
    <div ref={commentListRef} className="comment-list">
      {commentList.map((item, index) => (
        <div key={`${item.createdAt}-${index}`} className="comment-item">
          <p className="comment-text">{item.text}</p>
        </div>
      ))}
    </div>
  );
}

/**
 * コメントリストの末尾に新しいコメント項目を追加する
 * @param prev 現在のコメントリスト
 * @returns 新しいコメント項目を追加したコメントリスト
 */
function startNewComment(prev: CommentHistoryItem[]): CommentHistoryItem[] {
  if (prev.length < 1 || prev[prev.length - 1].text !== "") {
    return [
      ...prev,
      {
        text: "",
        createdAt: new Date().toISOString(),
      },
    ];
  }

  return prev;
}

/**
 * 受信したストリームのチャンクをコメントリストの最後のコメント項目へ追加する
 * @param prev 現在のコメントリスト
 * @param chunk 追加するチャンク
 * @param hasStreamEntry ストリーム用のコメント項目がすでに存在するかどうか
 * @returns 更新後のコメントリストと、新規コメント項目を作成したかどうか
 */
function appendChunkToLastComment(
  prev: CommentHistoryItem[],
  chunk: string,
  hasStreamEntry: boolean,
): [CommentHistoryItem[], boolean] {
  const updated = [...prev];
  let created = false;

  if (!hasStreamEntry || updated.length === 0) {
    console.warn(
      "'comment:stream-chunk' received before 'comment:stream-start'.",
    );

    updated.push({
      text: "",
      createdAt: new Date().toISOString(),
    });
    created = true;
  }

  const lastIndex = updated.length - 1;
  const lastItem = updated[lastIndex];

  updated[lastIndex] = {
    ...lastItem,
    text: lastItem.text + chunk,
  };

  return [updated, created];
}

/**
 * 選択中のキャラクターのコメント履歴をstorageから読み込む
 * @returns 選択中のキャラクターのコメント履歴
 */
async function loadCommentHistory(): Promise<CommentHistoryItem[]> {
  let characterId =
    (await storage.getItem<CharacterId>(CHARACTER_ID_KEY)) ?? "default";

  if (!isCharacterId(characterId)) {
    characterId = "default";
  }

  const commentHistoryKey: `local:${string}` = `local:commentHistory:${characterId}`;

  const commentHistory =
    (await storage.getItem<CommentHistoryItem[]>(commentHistoryKey)) ?? [];

  return pruneExpiredCommentHistory(commentHistory);
}

export default App;
