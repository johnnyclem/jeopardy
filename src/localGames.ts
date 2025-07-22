import { Game, GameRound, Category, RevealedClue, FinalJeopardy } from "./typesForGame";

const BASE_CATEGORIES = [
  "History", "Science", "Geography", "Literature", "Sports", "Movies",
  "Music", "Technology", "Art", "Animals", "Food", "Politics",
  "Culture", "Nature", "Mythology", "Language", "Business", "Computers",
  "Math", "Chemistry", "Physics", "Biology", "Astronomy", "Pop Culture",
  "Television", "Video Games", "Economics", "Medicine", "Philosophy", "Weather",
];

function createRound(type: "single" | "double", startIndex: number): GameRound {
  const categories: Category[] = [];
  const clues: RevealedClue[][] = Array.from({ length: 5 }, () => Array(6));
  const multiplier = type === "double" ? 2 : 1;
  for (let col = 0; col < 6; col++) {
    const catName = BASE_CATEGORIES[startIndex + col] || `Category ${startIndex + col}`;
    categories.push({ NAME: catName });
    for (let row = 0; row < 5; row++) {
      const value = (row + 1) * 200 * multiplier;
      clues[row][col] = {
        REVEALED_ON_TV_SHOW: true,
        QUESTION: `Question ${startIndex}-${type}-${row + 1}-${col + 1}`,
        ANSWER: `Answer ${startIndex}-${type}-${row + 1}-${col + 1}`,
        VALUE: value,
        CATEGORY_NAME: catName,
        ROW_INDEX: row,
        COLUMN_INDEX: col,
      };
    }
  }
  return { TYPE: type, CATEGORIES: categories, CLUES: clues };
}

function createGame(id: number): Game {
  const singleRound = createRound("single", (id - 1) * 6 % BASE_CATEGORIES.length);
  const doubleRound = createRound("double", (id * 3) % BASE_CATEGORIES.length);
  const finalJeopardy: FinalJeopardy = {
    CATEGORY: `Final Category ${id}`,
    QUESTION: `Final question ${id}`,
    ANSWER: `Final answer ${id}`,
  };
  return {
    J_ARCHIVE_GAME_ID: id,
    SHOW_NUMBER: id,
    AIRDATE: new Date().toDateString(),
    ROUNDS: [singleRound, doubleRound],
    FINAL_JEOPARDY: finalJeopardy,
  };
}

export const LOCAL_GAMES: Game[] = Array.from({ length: 10 }, (_, i) => createGame(i + 1));
