import "./App.css";

function App() {
  return (
    <>
      <button onClick={OpenDLsite}>DLsiteを開く</button>
    </>
  );
}

async function OpenDLsite() {
  const sidePanelPromise = browser.windows
    .getCurrent()
    .then((win) =>
      win.id !== undefined
        ? browser.sidePanel.open({ windowId: win.id })
        : undefined,
    )
    .catch(console.error);

  const [activeTab] = await browser.tabs.query({
    active: true,
    lastFocusedWindow: true,
  });

  const dlsiteUrl = "https://www.dlsite.com/home/";

  if (
    activeTab?.id &&
    (activeTab.url === "chrome://newtab/" || activeTab.url === "about:newtab")
  ) {
    await browser.tabs.update(activeTab.id, {
      url: dlsiteUrl,
      active: true,
    });
  } else {
    const win = await browser.windows.getCurrent();
    await browser.tabs.create({
      windowId: win.id,
      url: dlsiteUrl,
      active: true,
    });
  }
  await sidePanelPromise;
}

export default App;
