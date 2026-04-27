import { onMessage, sendMessage } from "@/utils/messaging";
import { Work, PayloadByUsecase, Usecase, UserbuyWork } from "@/utils/types";

const BACKEND_API_KEY = import.meta.env.WXT_BACKEND_API_KEY;
const BACKEND_URL = import.meta.env.WXT_BACKEND_URL;

let isStreaming = false;

const characterId: CharacterId = "default";

export default defineBackground(main);

function main(): void {
  if (typeof BACKEND_API_KEY !== "string" || BACKEND_API_KEY.length === 0) {
    throw new Error("Missing required environment variable: BACKEND_API_KEY");
  }
  if (typeof BACKEND_URL !== "string" || BACKEND_URL.length === 0) {
    throw new Error("Missing required environment variable: BACKEND_URL");
  }

  onMessage("work:extracted", handleWorkExtracted);
  onMessage("home:hello", handleHomeHello);
  onMessage("circle:new", handleCircleNew);
  onMessage("userbuy:page1", handleUserbuyPage1);
}

async function handleWorkExtracted(message: { data: Work }): Promise<void> {
  const work: Work = message.data;
  try {
    await generateComment("work", { work });
  } catch (err) {
    console.error("Error generating comment:", err);
  }
}

async function handleHomeHello(): Promise<void> {
  try {
    await generateComment("home:hello", {});
  } catch (err) {
    console.error("Error generating comment:", err);
  }
}

async function handleCircleNew(message: { data: CircleWork[] }): Promise<void> {
  const circleWorkList: CircleWork[] = message.data;
  try {
    await generateComment("circle:new", { circleWorkList });
  } catch (err) {
    console.error("Error generating comment:", err);
  }
}

async function handleUserbuyPage1(message: {
  data: UserbuyWork[];
}): Promise<void> {
  const userbuyWorkList: UserbuyWork[] = message.data;
  try {
    await generateComment("userbuy:page1", { userbuyWorkList });
  } catch (err) {
    console.error("Error generating comment:", err);
  }
}

async function generateComment<U extends Usecase>(
  usecase: U,
  payload: PayloadByUsecase[U],
): Promise<void> {
  const body = JSON.stringify({
    characterId,
    usecase,
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
      body,
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
