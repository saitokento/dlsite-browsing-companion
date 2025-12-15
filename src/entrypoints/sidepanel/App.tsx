import { useEffect, useState } from "react";
import { onMessage } from "@/utils/messaging";
import "./App.css";

interface SendCommentMessage {
  type: "sendComment";
  data: string;
}

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
