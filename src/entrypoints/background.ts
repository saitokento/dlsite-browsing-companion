import { onMessage, sendMessage } from "@/utils/messaging";
import { WorkInfo } from "@/utils/types";

export default defineBackground(() => {
  onMessage("sendWorkInfo", async (message) => {
    try {
      const workInfo: WorkInfo = message.data;
      const prompt = createCommentPrompt(workInfo);
      await generateComment(prompt);

      //await sendMessage("sendComment", comment);
    } catch (err) {
      console.error("Error generating comment:", err);
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
 * 作品情報を含むプロンプトからコメントを生成する。
 *
 * @param input - コメント生成に使用するプロンプト
 * @returns 生成されたコメント
 */
async function generateComment(input: string): Promise<void> {
  const response = await fetch(
    "https://dbsr1kudnk.execute-api.ap-northeast-1.amazonaws.com/Prod/comment",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        input: input,
        instruction:
          "あなたはユーザーの友人で、ユーザーと一緒にDLsiteを見ています。",
        api: "xai",
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

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }

      const chunk = decoder.decode(value, { stream: true });
      console.log(chunk);
    }
  } finally {
    reader.releaseLock();
  }
}
