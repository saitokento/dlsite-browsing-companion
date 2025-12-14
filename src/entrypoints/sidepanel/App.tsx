import { useEffect, useState } from "react";
import "./App.css";

interface SendCommentMessage {
  type: "sendComment";
  data: string;
}

function App() {
  const [commentHistory, setCommentHistory] = useState<string[]>([]);

  useEffect(() => {
    const handleMessage = (message: SendCommentMessage) => {
      if (message.type === "sendComment") {
        setCommentHistory((prev) => [...prev, message.data]);
      }
    };

    browser.runtime.onMessage.addListener(handleMessage);

    return () => {
      browser.runtime.onMessage.removeListener(handleMessage);
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
