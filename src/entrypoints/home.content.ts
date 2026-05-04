export default defineContentScript({
  matches: [
    "https://www.dlsite.com/home/",
    "https://www.dlsite.com/soft/",
    "https://www.dlsite.com/app/",
    "https://www.dlsite.com/ai/",
    "https://www.dlsite.com/maniax/",
    "https://www.dlsite.com/pro/",
    "https://www.dlsite.com/books/",
    "https://www.dlsite.com/appx/",
    "https://www.dlsite.com/aix/",
    "https://www.dlsite.com/garumani/voice",
    "https://www.dlsite.com/girls/",
    "https://www.dlsite.com/girls-pro/",
    "https://www.dlsite.com/girls-drama/",
    "https://www.dlsite.com/bl/",
    "https://www.dlsite.com/bl-pro/",
    "https://www.dlsite.com/bl-drama/",
    "https://www.dlsite.com/home/tool",
    "https://www.dlsite.com/maniax/tool",
  ],
  main,
});

function main(): void {
  const floor: string = getFloor(new URL(window.location.href));

  if (floor !== "") {
    sendMessage("home:hello", floor).catch((err) => {
      console.error("Failed to send 'home:hello':", err);
    });
  }
}

function getFloor(url: URL): string {
  switch (url.pathname) {
    case "/home/":
      return "DLsite 同人フロア（全年齢）";
    case "/soft/":
      return "DLsite PCソフトフロア（全年齢）";
    case "/app/":
      return "DLsite スマホゲームフロア（全年齢）";
    case "/ai/":
      return "DLsite AI生成フロア（全年齢）";
    case "/maniax/":
      return "DLsite 同人フロア（R18）";
    case "/pro/":
      return "DLsite 美少女ゲームフロア";
    case "/books/":
      return "DLsite 成年コミックフロア";
    case "/appx/":
      return "DLsite スマホゲームフロア（R18）";
    case "/aix/":
      return "DLsite AI生成フロア（R18）";
    case "/garumani/voice":
      return "がるまに 乙女向け/TL・BLボイス・ASMRフロア（全年齢）";
    case "/girls/":
      return "DLsite がるまに 乙女向け同人フロア";
    case "/girls-pro/":
      return "DLsite がるまに TLコミック・ティーンズラブフロア";
    case "/girls-drama/":
      return "DLsite がるまに 乙女向けドラマCDフロア";
    case "/bl/":
      return "DLsite がるまに BL同人フロア";
    case "/bl-pro/":
      return "DLsite がるまに BLコミックフロア";
    case "/bl-drama/":
      return "DLsite がるまに BLドラマCDフロア";
    case "/home/tool":
      return "DLsite 制作ソフト・素材フロア（全年齢）";
    case "/maniax/tool":
      return "DLsite 制作ソフト・素材フロア（R18）";
    default:
      return "";
  }
}
