import { useEffect, useState } from "react";
import { CharacterId, CommentHistoryItem } from "@/utils/types.ts";
import {
  CHARACTER_ID_KEY,
  isCharacterId,
  pruneExpiredCommentHistory,
} from "@/utils/exports";
import "./App.css";

function App() {
  const [commentList, setCommentList] = useState<CommentHistoryItem[]>([]);

  useEffect(() => {
    let active = true;

    loadCommentHistory()
      .then((commentHistory) => {
        if (active) {
          setCommentList(commentHistory);
        }
      })
      .catch((err) => {
        console.error("Failed to load comment history:", err);
      });

    const removeStreamStartListener = onMessage("comment:stream-start", () => {
      setCommentList(startNewComment);
    });

    const removeStreamChunkListener = onMessage(
      "comment:stream-chunk",
      (message) => {
        setCommentList((prev) => appendChunkToLastComment(prev, message.data));
      },
    );

    return () => {
      active = false;
      removeStreamStartListener();
      removeStreamChunkListener();
    };
  }, []);

  return (
    <div className="comment-list">
      {commentList.map((item, index) => (
        <div key={`${item.createdAt}-${index}`} className="comment-item">
          <p className="comment-text">{item.text}</p>
        </div>
      ))}
    </div>
  );
}

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

function appendChunkToLastComment(
  prev: CommentHistoryItem[],
  chunk: string,
): CommentHistoryItem[] {
  const updated = [...prev];

  if (updated.length === 0) {
    console.warn(
      "'comment:stream-chunk' received before 'comment:stream-start'.",
    );

    updated.push({
      text: "",
      createdAt: new Date().toISOString(),
    });
  }

  const lastIndex = updated.length - 1;
  const lastItem = updated[lastIndex];

  updated[lastIndex] = {
    ...lastItem,
    text: lastItem.text + chunk,
  };

  return updated;
}

async function loadCommentHistory(): Promise<CommentHistoryItem[]> {
  let characterId =
    (await storage.getItem<CharacterId>(CHARACTER_ID_KEY)) ?? "default";

  if (!isCharacterId(characterId)) {
    characterId = "default";
  }

  const commentHistoryKey: `local:${string}` = `local:commentHistory:${characterId}`;

  const commentHistory =
    (await storage.getItem<CommentHistoryItem[]>(commentHistoryKey)) ?? [];
  const prunedCommentHistory = pruneExpiredCommentHistory(commentHistory);

  if (prunedCommentHistory.length !== commentHistory.length) {
    await storage.setItem(commentHistoryKey, prunedCommentHistory);
  }

  return prunedCommentHistory;
}

export default App;
