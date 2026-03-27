import { onMessage, sendMessage } from "@/utils/messaging";
import { Work, Usecase } from "@/utils/types";

const BACKEND_API_KEY = import.meta.env.WXT_BACKEND_API_KEY;
const BACKEND_URL = import.meta.env.WXT_BACKEND_URL;

if (typeof BACKEND_API_KEY !== "string" || BACKEND_API_KEY.length === 0) {
  throw new Error("Missing required environment variable: BACKEND_API_KEY");
}
if (typeof BACKEND_URL !== "string" || BACKEND_URL.length === 0) {
  throw new Error("Missing required environment variable: BACKEND_URL");
}

let isStreaming = false;

export default defineBackground(main);

function main(): void {
  onMessage("work:extracted", handleWorkExtracted);
}

async function handleWorkExtracted(message: { data: Work }): Promise<void> {
  const work: Work = message.data;
  const payload: string = JSON.stringify({
    work: work,
  });
  try {
    await generateComment("work", payload);
  } catch (err) {
    console.error("Error generating comment:", err);
  }
}

async function generateComment(
  usecase: Usecase,
  payload: string,
): Promise<void> {
  try {
    JSON.parse(payload);
  } catch (err) {
    console.error("payload is not valid JSON:", err);
    return;
  }

  const body: string = JSON.stringify({
    usecase: usecase,
    payload: payload,
  });

  if (isStreaming) {
    /* ストリーミングの重複防止 キューを実装するかは要検討 */
    console.log("Streaming already in progress; skipping new request.");
    return;
  }

  isStreaming = true;

  try {
    const response = await fetch(BACKEND_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": BACKEND_API_KEY,
      },
      body: body,
    });

    if (!response.ok) {
      throw new Error(
        `Response status: ${response.status} ${response.statusText}`,
      );
    }

    if (response.body === null) {
      throw new Error(
        `Response body is null: ${response.status} ${response.statusText}`,
      );
    }

    const stream = response.body.pipeThrough(new TextDecoderStream());

    await sendMessage("comment:stream-start");

    for await (const chunk of stream) {
      await sendMessage("comment:stream-chunk", chunk);
    }
  } catch (err) {
    if (err instanceof Error) {
      console.error(err.message);
    } else {
      console.error(String(err));
    }
  } finally {
    isStreaming = false;
  }
}
