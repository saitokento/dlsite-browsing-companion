import { onMessage, sendMessage } from "@/utils/messaging";
import { Work } from "@/utils/types";

const BACKEND_API_KEY = import.meta.env.WXT_BACKEND_API_KEY;
const BACKEND_URL = import.meta.env.WXT_BACKEND_URL;

if (typeof BACKEND_API_KEY !== "string" || BACKEND_API_KEY.length === 0) {
  throw new Error("Missing required environment variable: WXT_BACKEND_API_KEY");
}
if (typeof BACKEND_URL !== "string" || BACKEND_URL.length === 0) {
  throw new Error("Missing required environment variable: WXT_BACKEND_URL");
}

let isStreaming = false;

export default defineBackground(main);

function main(): void {
  onMessage("work:extracted", handleWorkExtracted);
}

async function handleWorkExtracted(message: { data: Work }): Promise<void> {
  try {
    const work: Work = message.data;
    const body: string = JSON.stringify({
      work: work,
    });
    await generateComment(body, "ask");
  } catch (err) {
    console.error("Error generating comment:", err);
  }
}

async function generateComment(body: string, path: string): Promise<void> {
  try {
    JSON.parse(body);
  } catch (err) {
    console.error("Error parsing body", err);
    return;
  }

  if (isStreaming) {
    /* ストリーミングの重複防止 キューを実装するかは要検討 */
    console.log("既にストリーミング処理中のためスキップ");
    return;
  }

  isStreaming = true;

  const response = await fetch(`${BACKEND_URL}/${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": BACKEND_API_KEY,
    },
    body: body,
  });

  if (!response.ok) {
    throw new Error(
      `API request failed: ${response.status} ${response.statusText}`,
    );
  }

  const reader = response.body?.getReader();
  const decoder = new TextDecoder();

  if (!reader) {
    throw new Error("ReadableStream not supported");
  }

  await sendMessage("comment:stream-start");

  try {
    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        break;
      }

      const chunk = decoder.decode(value, { stream: true });
      await sendMessage("comment:stream-chunk", chunk);
    }
    const tail = decoder.decode();
    if (tail) {
      await sendMessage("comment:stream-chunk", tail);
    }
  } finally {
    reader.releaseLock();
    isStreaming = false;
  }
}
