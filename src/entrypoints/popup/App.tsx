import "./App.css";

let currentWindowId: number | undefined;

browser.windows.getCurrent().then((win) => {
  currentWindowId = win.id;
});

function App() {
  return (
    <>
      <button onClick={OpenDLsite}>DLsiteを開く</button>
    </>
  );
}

async function OpenDLsite() {
  if (!currentWindowId) return;

  browser.sidePanel.open({ windowId: currentWindowId }).catch(console.error);

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
    await browser.tabs.create({
      windowId: currentWindowId,
      url: dlsiteUrl,
      active: true,
    });
  }
}

export default App;
