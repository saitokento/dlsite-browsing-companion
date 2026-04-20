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
    "https://www.dlsite.com/garumani/voice/",
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
  sendMessage("home:hello").catch((err) => {
    console.error("Failed to send 'home:hello':", err);
  });
}
