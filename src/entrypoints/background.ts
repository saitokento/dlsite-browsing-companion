import { onMessage, sendMessage } from "@/utils/messaging";
import { WorkInfo } from "@/utils/types";

const BACKEND_API_KEY = import.meta.env.WXT_BACKEND_API_KEY as string;
const BACKEND_URL = import.meta.env.WXT_BACKEND_URL as string;

let isGenerating = false;

export default defineBackground(() => {
  onMessage("sendWorkInfo", async (message) => {
    try {
      const workInfo: WorkInfo = message.data;
      await generateComment(workInfo);
    } catch (err) {
      console.error("Error generating comment:", err);
    }
  });
});

/**
 * 指定したプロンプトを外部APIに送信し、生成されたコメントをストリーミングで送信する。
 *
 * バックエンド（https://github.com/saitokento/dlsite-browsing-companion-backend）
 * のAPIへPOSTリクエストを行い、レスポンスのReadableStreamを逐次読み取りながら
 * sendMessageで"newComment"（開始通知）と"sendComment"（受信したチャンク）を送信する。
 *
 * @param request - コメント生成に使用するプロンプト文字列
 * @throws APIリクエストが失敗した場合にErrorを投げる（非OKレスポンス）
 * @throws ReadableStreamが利用できない場合にErrorを投げる
 */
async function generateComment(workInfo: WorkInfo): Promise<void> {
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
    body: JSON.stringify({
      workInfo: workInfo,
      // api: "xai",
    }),
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

  await sendMessage("newComment");

  try {
    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        break;
      }

      const chunk = decoder.decode(value, { stream: true });
      await sendMessage("sendComment", chunk);
    }
    const tail = decoder.decode();
    if (tail) {
      await sendMessage("sendComment", tail);
    }
  } finally {
    reader.releaseLock();
    isGenerating = false;
  }
}
