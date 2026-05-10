import { waitDomReady } from "@/utils/exports";

const homeByPath = new Map(homes.map((home) => [home.path, home]));

export default defineContentScript({
  matches: homes.map((home) => home.match),
  main,
});

function main(): void {
  onMessage("home:triggered", handleHomeTriggered);
}

async function handleHomeTriggered(): Promise<void> {
  const url = new URL(window.location.href);
  const floor: string = homeByPath.get(url.pathname)?.name ?? "";

  if (floor !== "") {
    if (!(await waitDomReady(10_000))) return;
    sendMessage("home:hello", floor).catch((err) => {
      console.error("Failed to send 'home:hello':", err);
    });
  }
}
