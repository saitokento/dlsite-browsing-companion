export async function waitDomReady(timeoutMs: number): Promise<void> {
  const isDomReady = await sendMessage("content:wait-dom-ready", {
    timeoutMs,
  });

  if (!isDomReady) {
    console.warn("DOM was not ready before timeout.");
  }
}
