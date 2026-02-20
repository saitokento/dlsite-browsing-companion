import { onMessage, sendMessage } from "@/utils/messaging";
import { WorkInfo } from "@/utils/types";

const BACKEND_API_KEY = import.meta.env.WXT_BACKEND_API_KEY as string;
const BACKEND_URL = import.meta.env.WXT_BACKEND_URL as string;

let isGenerating = false;

export default defineBackground(main);

function main() {
  onMessage("work:info-extracted", handleWorkInfoExtracted);
}

async function handleWorkInfoExtracted(message: { data: WorkInfo }) {
  try {
    const workInfo: WorkInfo = message.data;
    const body = JSON.stringify({
      workInfo: workInfo,
    });
    await generateComment(body);
  } catch (err) {
    console.error("Error generating comment:", err);
  }
}

async function generateComment(body: string): Promise<void> {
  try {
    JSON.parse(body);
  } catch (err) {
    console.error("Error parsing body", err);
    return;
  }

  if (isGenerating) {
    /* ストリーミングの重複防止 キューを実装するかは要検討 */
    console.log("既にストリーミング処理中のためスキップ");
    return;
  }

  isGenerating = true;

  const response = await fetch(`${BACKEND_URL}/ask`, {
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
    isGenerating = false;
  }
}
