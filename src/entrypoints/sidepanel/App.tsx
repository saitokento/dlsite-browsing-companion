import { useEffect, useState } from "react";
import { onMessage } from "@/utils/messaging";
import "./App.css";

interface SendCommentMessage {
  type: "sendComment";
  data: string;
}

/**
 * Renders a comment list that updates when "sendComment" messages are received.
 *
 * The component maintains an internal history of comments and subscribes to the
 * "sendComment" message channel, appending incoming message data to the list.
 *
 * @returns A React element that displays the current comment history as a vertical list of items.
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