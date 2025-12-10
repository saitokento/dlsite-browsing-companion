import OpenAI from "openai";
import { onMessage } from "@/utils/messaging";
import { WorkInfo } from "@/utils/types";

const OPENAI_API_KEY = import.meta.env.WXT_OPENAI_API_KEY as string;

if (!OPENAI_API_KEY) {
  throw new Error("WXT_OPENAI_API_KEY environment variable is not set");
}

const openai = new OpenAI({
  apiKey: OPENAI_API_KEY,
});

export default defineBackground(() => {
  onMessage("sendWorkInfo", async (message) => {
    try {
      const workInfo: WorkInfo = message.data;
      const prompt = createCommentPrompt(workInfo);
      const comment = await generateComment(prompt);
      console.log(comment);
    } catch (err) {
      console.error("Error generating comment:", err);
    }
  });
});

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

async function generateComment(input: string): Promise<string> {
  const response = await openai.responses.create({
    model: "gpt-5-nano",
    input,
    instructions:
      "あなたはユーザーの友人で、ユーザーと一緒にDLsiteを見ています。",
  });

  return response.output_text;
}
