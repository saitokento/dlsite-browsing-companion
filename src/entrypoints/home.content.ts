const homeByPath = new Map(homes.map((home) => [home.path, home]));

export default defineContentScript({
  matches: homes.map((home) => home.match),
  main,
});

function main(): void {
  const url = new URL(window.location.href);
  const floor: string = homeByPath.get(url.pathname)?.name ?? "";

  if (floor !== "") {
    sendMessage("home:hello", floor).catch((err) => {
      console.error("Failed to send 'home:hello':", err);
    });
  }
}
