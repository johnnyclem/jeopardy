export interface JServiceClue {
    id: number;
    answer: string;
    question: string;
    value: number | null;
    airdate: string;
    created_at: string;
    updated_at: string;
    category_id: number;
    game_id: number;
    invalid_count: number | null;
    category: { id: number; title: string };
}

import { Game, GameRound, Category, RevealedClue, FinalJeopardy, RoundType } from "./typesForGame";

async function fetchJson(url: string): Promise<any> {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`HTTP ${response.status} fetching ${url}`);
    }
    return await response.json();
}

async function fetchCategories(count: number): Promise<{ id: number; title: string }[]> {
    const cats = await fetchJson(`https://jservice.io/api/categories?count=${count}`);
    return cats;
}

async function fetchCluesForCategory(catId: number): Promise<JServiceClue[]> {
    return await fetchJson(`https://jservice.io/api/clues?category=${catId}`);
}

function toCategory(obj: { title: string }): Category {
    return { NAME: obj.title };
}

function createGameRound(type: RoundType, categoriesData: { id: number; title: string }[], cluesPerCategory: JServiceClue[][]): GameRound {
    const categories: Category[] = categoriesData.map(toCategory);
    const cluesRows: RevealedClue[][] = Array.from({ length: 5 }, () => Array(categories.length));

    categoriesData.forEach((cat, col) => {
        const clues = cluesPerCategory[col];
        for (let row = 0; row < 5; row++) {
            const clue = clues[row];
            cluesRows[row][col] = {
                REVEALED_ON_TV_SHOW: true,
                QUESTION: clue.question,
                ANSWER: clue.answer,
                VALUE: clue.value ?? (row + 1) * 200 * (type === "double" ? 2 : 1),
                CATEGORY_NAME: cat.title,
                ROW_INDEX: row,
                COLUMN_INDEX: col,
            };
        }
    });

    return { TYPE: type, CATEGORIES: categories, CLUES: cluesRows };
}

export async function fetchRandomGame(): Promise<Game> {
    const roundTypes: RoundType[] = ["single", "double"];
    const rounds: GameRound[] = [];

    for (const type of roundTypes) {
        const categories = await fetchCategories(6);
        const cluesPerCategory: JServiceClue[][] = [];
        for (const cat of categories) {
            const clues = await fetchCluesForCategory(cat.id);
            cluesPerCategory.push(clues.slice(0, 5));
        }
        rounds.push(createGameRound(type, categories, cluesPerCategory));
    }

    const finalClueArr: JServiceClue[] = await fetchJson("https://jservice.io/api/random");
    const finalClue = finalClueArr[0];
    const final: FinalJeopardy = {
        CATEGORY: finalClue.category.title,
        QUESTION: finalClue.question,
        ANSWER: finalClue.answer,
    };

    return {
        J_ARCHIVE_GAME_ID: finalClue.game_id,
        SHOW_NUMBER: finalClue.game_id,
        AIRDATE: new Date().toDateString(),
        ROUNDS: rounds,
        FINAL_JEOPARDY: final,
    };
}
