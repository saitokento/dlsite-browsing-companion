import { useEffect, useState } from "react";
import { onMessage } from "@/utils/messaging";
import "./App.css";

function App() {
  const [commentList, setCommentList] = useState<string[]>([]);

  useEffect(() => {
    const removeStreamStartListener = onMessage("comment:stream-start", () => {
      setCommentList((prev) => {
        if (prev.length < 1 || prev[prev.length - 1] !== "") {
          return [...prev, ""];
        }
        return prev;
      });
    });

    const removeStreamChunkListener = onMessage(
      "comment:stream-chunk",
      (message) => {
        const chunk = message.data;
        setCommentList((prev) => {
          const updated = [...prev];
          if (updated.length > 0) {
            updated[updated.length - 1] += chunk;
          } else {
            updated.push(chunk);
          }
          return updated;
        });
      },
    );

    return () => {
      removeStreamStartListener();
      removeStreamChunkListener();
    };
  }, []);

  return (
    <div className="comment-list">
      {commentList.map((item, index) => (
        <div key={index} className="comment-item">
          <p className="comment-text">{item}</p>
        </div>
      ))}
    </div>
  );
}

export default App;
