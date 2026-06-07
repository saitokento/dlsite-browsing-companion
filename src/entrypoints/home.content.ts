import { waitDomReady } from "@/utils/exports";

/** URLからフロア情報を取得するための対応表 */
const homeByPath = new Map(homes.map((home) => [home.path, home]));

export default defineContentScript({
  matches: homes.map((home) => home.match),
  main,
});

function main(): void {
  onMessage("home:triggered", handleHomeTriggered);

  sendMessage("home:ready").catch((err) => {
    console.error("Failed to send 'home:ready':", err);
  });
}

/** 現在のフロア名を特定し、挨拶コメント生成用のメッセージを送信する */
async function handleHomeTriggered(): Promise<void> {
  const url = new URL(window.location.href);
  const floor: string = homeByPath.get(url.pathname)?.name ?? "";

  if (floor === "") {
    return;
  }

  if (!(await waitDomReady(10_000))) {
    return;
  }

  await sendMessage("home:hello", floor).catch((err) => {
    console.error("Failed to send 'home:hello':", err);
  });
}
