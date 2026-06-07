import { useEffect, useState } from "react";
import "./App.css";
import { CharacterId } from "@/utils/types";
import {
  CHARACTER_ID_KEY,
  ENABLED_HOME_PATHS_KEY,
  loadEnabledHomePaths,
  isCharacterId,
} from "@/utils/exports";

function App() {
  const [selectedCharacter, setSelectedCharacter] =
    useState<CharacterId>("default");
  const [enabledHomePaths, setEnabledHomePaths] = useState<string[]>([]);
  const [conversationClearMessage, setConversationClearMessage] = useState<
    string | null
  >(null);

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

      <h2>コメント履歴のリセット</h2>

      <div className="conversation-data-actions">
        <button
          type="button"
          onClick={() =>
            handleClearSelectedCharacterConversationData(
              selectedCharacter,
              setConversationClearMessage,
            )
          }
        >
          現在選択中のキャラクターのコメント履歴をリセット
        </button>

        <button
          type="button"
          onClick={() =>
            handleClearAllCharacterConversationData(setConversationClearMessage)
          }
        >
          全キャラクターの会話履歴のコメント履歴をリセット
        </button>
      </div>

      {conversationClearMessage !== null && (
        <p className="conversation-clear-message">{conversationClearMessage}</p>
      )}

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

/**
 * storageに保存されたキャラクター設定を読み込む
 * @param setSelectedCharacter 選択中のキャラクターを更新する関数
 */
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

/**
 * 選択されたキャラクターを保存し、コメント履歴を再読み込みする
 * @param event セレクト要素の変更イベント
 * @param setSelectedCharacter 選択中のキャラクターを更新する関数
 */
async function handleCharacterChange(
  event: React.ChangeEvent<HTMLSelectElement>,
  setSelectedCharacter: (characterId: CharacterId) => void,
) {
  const value = event.target.value;
  if (!isCharacterId(value)) {
    console.error("Selected CharacterID is invaild. Falling back to 'default'");
  }
  const characterId: CharacterId = isCharacterId(value) ? value : "default";

  setSelectedCharacter(characterId);
  await storage.setItem(CHARACTER_ID_KEY, characterId);

  await sendMessage("options:history-reset");
}

/**
 * 選択中のキャラクターのコメント履歴をリセットし、コメント履歴を再読み込みする
 * @param characterId 対象キャラクターのID
 * @param setConversationClearMessage 処理結果メッセージを更新する関数
 */
async function handleClearSelectedCharacterConversationData(
  characterId: CharacterId,
  setConversationClearMessage: (message: string | null) => void,
): Promise<void> {
  setConversationClearMessage(null);

  const character = characters.find((item) => item.id === characterId);
  const characterName = character?.name ?? characterId;

  const accepted = window.confirm(
    `「${characterName}」のコメント履歴をリセットします。\nよろしいですか？`,
  );

  if (!accepted) {
    return;
  }

  try {
    await clearCharacterConversationData(characterId);
    await sendMessage("options:history-reset");

    setConversationClearMessage(
      `「${characterName}」のコメント履歴をリセットしました。`,
    );
  } catch (error) {
    console.error("Failed to reset selected character conversation:", error);
    setConversationClearMessage(
      `「${characterName}」のコメント履歴リセットに失敗しました。`,
    );
  }
}

/**
 * 全キャラクターのコメント履歴をリセットし、コメント履歴を再読み込みする
 * @param setConversationClearMessage 処理結果メッセージを更新する関数
 */
async function handleClearAllCharacterConversationData(
  setConversationClearMessage: (message: string | null) => void,
): Promise<void> {
  setConversationClearMessage(null);

  const accepted = window.confirm(
    "全キャラクターのコメント履歴をリセットします。\nよろしいですか？",
  );

  if (!accepted) {
    return;
  }

  try {
    await Promise.all(
      characters.map((character) =>
        clearCharacterConversationData(character.id),
      ),
    );

    await sendMessage("options:history-reset");

    setConversationClearMessage(
      "全キャラクターのコメント履歴をリセットしました。",
    );
  } catch (error) {
    console.error("Failed to reset all character conversation data:", error);
    setConversationClearMessage(
      "全キャラクターのコメント履歴リセットに失敗しました。",
    );
  }
}

/**
 * Popupにボタンを表示するフロアを変更し、storageに保存する
 * @param event チェックボックスの変更イベント
 * @param homePath 対象フロアのパス
 * @param enabledHomePaths 現在有効なフロアのパス一覧
 * @param setEnabledHomePaths 有効なフロアのパス一覧を更新する関数
 */
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

/**
 * 指定キャラクターのコメント履歴をリセットする
 * @param characterId 対象キャラクターのID
 */
async function clearCharacterConversationData(
  characterId: CharacterId,
): Promise<void> {
  await Promise.all([
    storage.removeItem(`local:commentHistory:${characterId}`),
    storage.removeItem(`local:xaiPreviousResponseId:${characterId}`),
  ]);
}

export default App;
