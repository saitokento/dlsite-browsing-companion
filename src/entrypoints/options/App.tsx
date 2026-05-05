import { useEffect, useState } from "react";
import "./App.css";

const CHARACTER_ID_KEY = "local:characterId";

function App() {
  const [selectedCharacter, setSelectedCharacter] =
    useState<CharacterId>("default");

  useEffect(() => {
    loadSelectedCharacter(setSelectedCharacter);
  }, []);

  return (
    <>
      <h1>オプション</h1>

      <label htmlFor="character">キャラクター</label>
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

export default App;
