import { useEffect, useState } from "react";
import "./App.css";

function App() {
  const [commentList, setCommentList] = useState<string[]>([]);

  useEffect(() => {
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

function startNewComment(prev: string[]): string[] {
  if (prev.length < 1 || prev[prev.length - 1] !== "") {
    return [...prev, ""];
  }
  return prev;
}

function appendChunkToLastComment(prev: string[], chunk: string): string[] {
  const updated = [...prev];
  if (updated.length === 0) {
    console.warn(
      "'comment:stream-chunk' received before 'comment:stream-start'.",
    );
    updated.push("");
  }
  updated[updated.length - 1] += chunk;
  return updated;
}

export default App;
