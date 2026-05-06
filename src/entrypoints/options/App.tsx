import { useEffect, useState } from "react";
import "./App.css";

const CHARACTER_ID_KEY = "local:characterId";
export const ENABLED_HOME_PATHS_KEY = "local:enabledHomePaths";

function App() {
  const [selectedCharacter, setSelectedCharacter] =
    useState<CharacterId>("default");
  const [enabledHomePaths, setEnabledHomePaths] = useState<string[]>([]);

  useEffect(() => {
    loadSelectedCharacter(setSelectedCharacter);
    loadEnabledHomePaths(setEnabledHomePaths);
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
    </>
  );
}

async function loadSelectedCharacter(
  setSelectedCharacter: (characterId: CharacterId) => void,
) {
  const savedCharacterId = await storage.getItem<CharacterId>(CHARACTER_ID_KEY);

  if (savedCharacterId) {
    setSelectedCharacter(savedCharacterId);
  }
}

async function handleCharacterChange(
  event: React.ChangeEvent<HTMLSelectElement>,
  setSelectedCharacter: (characterId: CharacterId) => void,
) {
  const characterId = event.target.value as CharacterId;

  setSelectedCharacter(characterId);
  await storage.setItem(CHARACTER_ID_KEY, characterId);
}

export async function loadEnabledHomePaths(
  setEnabledHomePaths: (enabledHomePaths: string[]) => void,
) {
  const savedEnabledHomePaths = await storage.getItem<string[]>(
    ENABLED_HOME_PATHS_KEY,
  );

  if (savedEnabledHomePaths !== null) {
    setEnabledHomePaths(savedEnabledHomePaths);
    return;
  }

  setEnabledHomePaths(["/home/", "/soft/", "/garumani/voice"]);
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

export default App;
