import { useEffect, useState } from "react";
import { onMessage } from "@/utils/messaging";
import "./App.css";

/**
 * コメントの履歴を管理して縦並びで表示するコンポーネント。
 *
 * コンポーネントは内部で `commentHistory` を保持し、`newComment` と `sendComment` の
 * メッセージを購読して履歴を更新する。`newComment` 受信時は履歴が空か最後の要素が空文字で
 * なければ空文字を末尾に追加し、`sendComment` 受信時は受信データを最後の要素に追記するか
 * 履歴が空の場合は新しい要素として追加する。アンマウント時に両購読を解除する。
 *
 * @returns 現在のコメント履歴を縦のリストとして表示する React 要素
 */

function App() {
  const [commentHistory, setCommentHistory] = useState<string[]>([]);

  useEffect(() => {
    const unsubscribeNew = onMessage("newComment", () => {
      setCommentHistory((prev) => {
        if (prev.length < 1 || prev[prev.length - 1] !== "") {
          return [...prev, ""];
        }
        return prev;
      });
    });

    const unsubscribeSend = onMessage("sendComment", (message) => {
      const chunk = message.data;
      setCommentHistory((prev) => {
        const updated = [...prev];
        if (updated.length > 0) {
          updated[updated.length - 1] += chunk;
        } else {
          updated.push(chunk);
        }
        return updated;
      });
    });

    return () => {
      unsubscribeNew();
      unsubscribeSend();
    };
  }, []);

  return (
    <div className="comment-list">
      {commentHistory.map((item, index) => (
        <div key={index} className="comment-item">
          <p className="comment-text">{item}</p>
        </div>
      ))}
    </div>
  );
}

export default App;
