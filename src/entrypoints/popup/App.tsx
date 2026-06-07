import { useEffect, useState } from "react";
import {
  AUTO_COMMENT_ENABLED_KEY,
  loadAutoCommentEnabled,
  loadEnabledHomePaths,
} from "@/utils/exports";
import "./App.css";

type FirefoxBrowser = typeof browser & {
  sidebarAction?: {
    open(): Promise<void>;
  };
};

const COMMENT_ENABLED_URL_PATTERNS = [
  /^https:\/\/www\.dlsite\.com\/[^/]+\/cart(?:[/?#].*)?$/,
  /^https:\/\/www\.dlsite\.com\/[^/]+\/circle\/profile\/=\/maker_id\/[^/]+\.html(?:[?#].*)?$/,
  /^https:\/\/www\.dlsite\.com\/[^/]+\/download(?:[/?#].*)?$/,
  /^https:\/\/www\.dlsite\.com\/[^/]+\/mypage\/userbuy(?:[/?#].*)?$/,
  /^https:\/\/www\.dlsite\.com\/[^/]+\/work\/=\/product_id\/[^/]+\.html(?:[?#].*)?$/,
];

function App() {
  const [enabledHomePaths, setEnabledHomePaths] = useState<string[]>([]);
  const [autoCommentEnabled, setAutoCommentEnabled] = useState(true);
  const { activeTab } = useActiveTab();

  useEffect(() => {
    loadEnabledHomePaths(setEnabledHomePaths);
    void loadAutoCommentEnabled().then(setAutoCommentEnabled);
  }, []);

  const isCommentButtonDisabled =
    !isCommentEnabledUrl(activeTab?.url) || activeTab?.status !== "complete";

  async function handleAutoCommentChange(
    event: React.ChangeEvent<HTMLInputElement>,
  ) {
    const enabled = event.currentTarget.checked;

    setAutoCommentEnabled(enabled);
    await saveAutoCommentEnabled(enabled);
  }

  return (
    <>
      <button
        type="button"
        onClick={handleCommentTriggerClick}
        disabled={isCommentButtonDisabled}
      >
        コメント
      </button>
      <label>
        <input
          type="checkbox"
          checked={autoCommentEnabled}
          onChange={handleAutoCommentChange}
        />
        自動コメント
      </label>

      <div className="home-buttons">
        {homes
          .filter((home) => enabledHomePaths.includes(home.path))
          .map((home) => (
            <button
              key={home.path}
              type="button"
              onClick={() => handleOpenDLsiteClick(home)}
            >
              {home.name}
            </button>
          ))}
      </div>

      <button type="button" onClick={handleUserbuyTriggerClick}>
        購入履歴にコメントしてもらう
      </button>
    </>
  );
}

function useActiveTab() {
  const [activeTab, setActiveTab] = useState<Browser.tabs.Tab | undefined>();

  useEffect(() => {
    return setupActiveTabWatcher(setActiveTab);
  }, []);

  return { activeTab };
}

export async function saveAutoCommentEnabled(enabled: boolean): Promise<void> {
  await storage.setItem(AUTO_COMMENT_ENABLED_KEY, enabled);
}

async function handleCommentTriggerClick() {
  const sidePanelPromise = openSidePanel().catch(console.error);

  const [activeTab] = await browser.tabs.query({
    active: true,
    lastFocusedWindow: true,
  });

  if (!activeTab) {
    console.error("No active tab found.");
    return;
  }

  await sendMessage("popup:comment-triggered", undefined, activeTab.id).catch(
    (err) => {
      console.error("Failed to send 'popup:comment-triggered':", err);
    },
  );

  await sidePanelPromise;
}

function setupActiveTabWatcher(
  setActiveTab: React.Dispatch<
    React.SetStateAction<Browser.tabs.Tab | undefined>
  >,
) {
  const updateActiveTab = async () => {
    const [tab] = await browser.tabs.query({
      active: true,
      lastFocusedWindow: true,
    });

    setActiveTab(tab);
  };

  void updateActiveTab();

  const handleActivated = () => {
    void updateActiveTab();
  };

  const handleUpdated = (
    _tabId: number,
    _changeInfo: Browser.tabs.OnUpdatedInfo,
    tab: Browser.tabs.Tab,
  ) => {
    if (tab.active) {
      void updateActiveTab();
    }
  };

  browser.tabs.onActivated.addListener(handleActivated);
  browser.tabs.onUpdated.addListener(handleUpdated);

  return () => {
    browser.tabs.onActivated.removeListener(handleActivated);
    browser.tabs.onUpdated.removeListener(handleUpdated);
  };
}

function isCommentEnabledUrl(url?: string): boolean {
  if (!url) {
    return false;
  }

  return COMMENT_ENABLED_URL_PATTERNS.some((pattern) => pattern.test(url));
}

async function handleOpenDLsiteClick(home: Home) {
  const sidePanelPromise = openSidePanel().catch(console.error);

  await sendMessage("home:open", home).catch((err) => {
    console.error("Failed to send 'home:open':", err);
  });

  await sidePanelPromise;
}

async function handleUserbuyTriggerClick() {
  const sidePanelPromise = openSidePanel().catch(console.error);

  await sendMessage("userbuy:open").catch((err) => {
    console.error("Failed to send 'userbuy:open':", err);
  });

  await sidePanelPromise;
}

async function openSidePanel() {
  try {
    const browserSidebarAction = (browser as FirefoxBrowser).sidebarAction;

    if (browserSidebarAction?.open) {
      await browserSidebarAction.open();
      return;
    }

    const win = await browser.windows.getCurrent();

    if (win.id === undefined) {
      return;
    }

    await browser.sidePanel.open({ windowId: win.id });
  } catch (err) {
    console.error(err);
  }
}

export default App;
