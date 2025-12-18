import { useEffect, useState } from "react";
import { onMessage } from "@/utils/messaging";
import "./App.css";

/**
 * "sendComment"メッセージを受信したときに更新されるコメントリストをレンダリングする。
 *
 * このコンポーネントはコメントの履歴を内部で管理し、"sendComment"メッセージチャンネルを
 * 購読して、受信したメッセージデータをリストに追加する。
 *
 * @returns 現在のコメント履歴を縦のリストとして表示するReact要素
 */

function App() {
  const [commentHistory, setCommentHistory] = useState<string[]>([]);

  useEffect(() => {
    return onMessage("sendComment", (message) => {
      setCommentHistory((prev) => [...prev, message.data]);
    });
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
