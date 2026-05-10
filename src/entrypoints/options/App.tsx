import { useEffect, useState } from "react";
import "./App.css";
import { CharacterId } from "@/utils/types";
import {
  CHARACTER_ID_KEY,
  DEBUG_MODE_KEY,
  ENABLED_HOME_PATHS_KEY,
  loadEnabledHomePaths,
  isCharacterId,
} from "@/utils/exports";

function App() {
  const [selectedCharacter, setSelectedCharacter] =
    useState<CharacterId>("default");
  const [enabledHomePaths, setEnabledHomePaths] = useState<string[]>([]);
  const [debugMode, setDebugMode] = useState(false);

  useEffect(() => {
    loadSelectedCharacter(setSelectedCharacter);
    loadEnabledHomePaths(setEnabledHomePaths);
    loadDebugMode(setDebugMode);
  }, []);

  return (
    <>
      <h1>オプション</h1>

      <h2>キャラクター</h2>
      <select
        id="character"
        value={selectedCharacter}
        onChange={(event) => handleCharacterChange(event, setSelectedCharacter)}
      >
        {characters.map((character) => (
          <option key={character.id} value={character.id}>
            {character.name}
          </option>
        ))}
      </select>

      <h2>ボタンを表示するフロア</h2>
      <div className="home-checkbox-table">
        {homes.map((home) => (
          <label key={home.path} className="home-checkbox-row">
            <span className="home-checkbox-cell">
              <input
                type="checkbox"
                checked={enabledHomePaths.includes(home.path)}
                onChange={(event) =>
                  handleHomePathChange(
                    event,
                    home.path,
                    enabledHomePaths,
                    setEnabledHomePaths,
                  )
                }
              />
            </span>
            <span className="home-info-cell">
              <span className="home-name">{home.name}</span>
              <span className="home-url">
                {`（https://www.dlsite.com${home.path}）`}
              </span>
            </span>
          </label>
        ))}
      </div>

      <details>
        <summary>開発者用</summary>
        <label>
          <input
            type="checkbox"
            checked={debugMode}
            onChange={(event) => handleDebugModeChange(event, setDebugMode)}
          />
          デバッグモードを有効にする
        </label>
      </details>
    </>
  );
}

async function loadSelectedCharacter(
  setSelectedCharacter: (characterId: CharacterId) => void,
) {
  let savedCharacterId: CharacterId =
    (await storage.getItem<CharacterId>(CHARACTER_ID_KEY)) ?? "default";

  if (!isCharacterId(savedCharacterId)) {
    savedCharacterId = "default";
    console.error(
      "'local:characterId' in storage is not CharacterId. Falling back to 'default'",
    );
  }

  if (savedCharacterId) {
    setSelectedCharacter(savedCharacterId);
  }
}

async function handleCharacterChange(
  event: React.ChangeEvent<HTMLSelectElement>,
  setSelectedCharacter: (characterId: CharacterId) => void,
) {
  let characterId: CharacterId;

  const value = event.target.value;
  if (!isCharacterId(value)) {
    characterId = "default";
    console.error("Selected CharacterID is invaild. Falling back to 'default'");
  }
  characterId = value as CharacterId;

  setSelectedCharacter(characterId);
  await storage.setItem(CHARACTER_ID_KEY, characterId);
}

async function handleHomePathChange(
  event: React.ChangeEvent<HTMLInputElement>,
  homePath: string,
  enabledHomePaths: string[],
  setEnabledHomePaths: (enabledHomePaths: string[]) => void,
) {
  const nextEnabledHomePaths = event.target.checked
    ? [...enabledHomePaths, homePath]
    : enabledHomePaths.filter(
        (enabledHomePath) => enabledHomePath !== homePath,
      );

  setEnabledHomePaths(nextEnabledHomePaths);
  await storage.setItem(ENABLED_HOME_PATHS_KEY, nextEnabledHomePaths);
}

async function loadDebugMode(setDebugMode: (debugMode: boolean) => void) {
  const savedDebugMode = await storage.getItem<boolean>(DEBUG_MODE_KEY);

  setDebugMode(savedDebugMode ?? false);
}

async function handleDebugModeChange(
  event: React.ChangeEvent<HTMLInputElement>,
  setDebugMode: (debugMode: boolean) => void,
) {
  const checked = event.target.checked;

  if (checked) {
    const accepted = window.confirm(
      "デバッグモードを有効にすると、バックエンドサーバー上にプロンプトが出力されるようになり、その内容は開発者が確認することがあります。\nプロンプトには、DLsiteの閲覧履歴、購入履歴、カートの内容などの情報が含まれることがあります。\nよろしいですか？",
    );

    if (!accepted) {
      setDebugMode(false);
      return;
    }
  }

  setDebugMode(checked);
  await storage.setItem(DEBUG_MODE_KEY, checked);
}

export default App;
