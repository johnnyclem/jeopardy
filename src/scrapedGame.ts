import { Game } from "./typesForGame";

export const SCRAPED_GAME: Game = {
    J_ARCHIVE_GAME_ID: 0,
    SHOW_NUMBER: 0,
    AIRDATE: "Saturday, January 1, 2000",
    ROUNDS: [
        {
            TYPE: "single",
            CATEGORIES: Array.from({ length: 6 }, (_, i) => ({ NAME: `Category ${i + 1}` })),
            CLUES: Array.from({ length: 5 }, (_, row) =>
                Array.from({ length: 6 }, (_, col) => ({
                    REVEALED_ON_TV_SHOW: true,
                    QUESTION: `Question ${row + 1}-${col + 1}`,
                    ANSWER: `Answer ${row + 1}-${col + 1}`,
                    VALUE: (row + 1) * 200,
                    CATEGORY_NAME: `Category ${col + 1}`,
                    ROW_INDEX: row,
                    COLUMN_INDEX: col,
                }))
            ),
        },
        {
            TYPE: "double",
            CATEGORIES: Array.from({ length: 6 }, (_, i) => ({ NAME: `Double Category ${i + 1}` })),
            CLUES: Array.from({ length: 5 }, (_, row) =>
                Array.from({ length: 6 }, (_, col) => ({
                    REVEALED_ON_TV_SHOW: true,
                    QUESTION: `Double Question ${row + 1}-${col + 1}`,
                    ANSWER: `Double Answer ${row + 1}-${col + 1}`,
                    VALUE: (row + 1) * 400,
                    CATEGORY_NAME: `Double Category ${col + 1}`,
                    ROW_INDEX: row,
                    COLUMN_INDEX: col,
                }))
            ),
        },
    ],
    FINAL_JEOPARDY: {
        CATEGORY: "Final",
        QUESTION: "Final question",
        ANSWER: "Final answer",
    },
};
