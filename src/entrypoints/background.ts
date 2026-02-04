import { onMessage, sendMessage } from "@/utils/messaging";
import { WorkInfo } from "@/utils/types";

let isGenerating = false;

export default defineBackground(() => {
  onMessage("sendWorkInfo", async (message) => {
    if (isGenerating) {
      /* ストリーミングの重複防止 キューを実装するかは要検討 */
      console.log("既にストリーミング処理中のためスキップ");
      return;
    }

    try {
      const workInfo: WorkInfo = message.data;
      const prompt = createCommentPrompt(workInfo);
      isGenerating = true;
      await generateComment(prompt);
    } catch (err) {
      console.error("Error generating comment:", err);
    } finally {
      isGenerating = false;
    }
  });
});

/**
 * 作品に対するコメント生成用のプロンプトを構築する。
 *
 * @param work - プロンプトに使用するフィールドを含むWorkInfoオブジェクト
 * @returns AIに送信するフォーマット済みの日本語プロンプト文字列
 */
function createCommentPrompt(work: WorkInfo): string {
  return `以下の作品情報をもとに、作品に対して短いコメントをしてください。
出力はコメントの本文のみにしてください。

タイトル: ${work.name}
価格: ${work.pricePrefix}${work.price}${work.priceSuffix}（サークル設定価格: ${work.pricePrefix}${work.officialPrice}${work.priceSuffix}）
${work.couponPrice != null ? `クーポン価格: ${work.pricePrefix}${work.couponPrice}${work.priceSuffix}` : ""}
ジャンル: ${work.genres.join(", ")}
作品内容:
${work.description}`;
}

/**
 * 指定したプロンプトを外部APIに送信し、生成されたコメントをストリーミングで送信する。
 *
 * 外部APIへPOSTリクエストを行い、レスポンスのReadableStreamを逐次読み取りながら
 * sendMessageで"newComment"（開始通知）と"sendComment"（受信したチャンク）を送信します。
 *
 * @param request - コメント生成に使用するプロンプト文字列
 * @throws APIリクエストが失敗した場合にErrorを投げます（非OKレスポンス）
 * @throws ReadableStreamが利用できない場合にErrorを投げます
 */
async function generateComment(request: string): Promise<void> {
  const response = await fetch(
    "https://qbqd1c1ab0.execute-api.ap-northeast-1.amazonaws.com/Prod/ask",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        request: request,
        // instruction:
        //   "あなたはユーザーの友人で、ユーザーと一緒にDLsiteを見ています。",
        // api: "xai",
      }),
    },
  );

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

  sendMessage("newComment");

  try {
    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        break;
      }

      const chunk = decoder.decode(value, { stream: true });
      await sendMessage("sendComment", chunk);
    }
  } finally {
    reader.releaseLock();
  }
}