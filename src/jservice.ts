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
import { LOCAL_GAMES } from "./localGames";

interface OpenTDBQuestion {
    category: string;
    type: string;
    difficulty: string;
    question: string;
    correct_answer: string;
    incorrect_answers: string[];
}

function decodeHtml(str: string): string {
    return str
        .replace(/&amp;/g, "&")
        .replace(/&quot;/g, '"')
        .replace(/&#039;/g, "'")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">");
}

async function fetchJson(url: string): Promise<any> {
    let response: Response;
    const proxy =
        typeof process !== "undefined" &&
        (process.env.https_proxy || process.env.HTTPS_PROXY || process.env.http_proxy || process.env.HTTP_PROXY);

    if (proxy && typeof window === "undefined") {
        try {
            const { ProxyAgent } = await import("undici");
            response = await fetch(url, { dispatcher: new ProxyAgent(proxy) });
        } catch {
            const { HttpsProxyAgent } = await import("https-proxy-agent");
            response = await fetch(url, { agent: new HttpsProxyAgent(proxy) as any });
        }
    } else {
        response = await fetch(url);
    }

    if (!response.ok) {
        throw new Error(`HTTP ${response.status} fetching ${url}`);
    }
    return await response.json();
}

async function fetchCategories(count: number): Promise<{ id: number; title: string }[]> {
    const requested = count * 2;
    const cats: { id: number; title: string; clues_count: number }[] = await fetchJson(`https://jservice.io/api/categories?count=${requested}`);
    const valid = cats.filter(c => c.clues_count >= 5).slice(0, count);
    if (valid.length < count) {
        throw new Error("Not enough categories from jservice");
    }
    return valid;
}

async function fetchCluesForCategory(catId: number): Promise<JServiceClue[]> {
    return await fetchJson(`https://jservice.io/api/clues?category=${catId}`);
}

async function fetchOTDBCategories(): Promise<{ id: number; name: string }[]> {
    const data = await fetchJson("https://opentdb.com/api_category.php");
    return data.trivia_categories;
}

async function fetchOTDBQuestions(catId: number): Promise<OpenTDBQuestion[]> {
    const data = await fetchJson(`https://opentdb.com/api.php?amount=5&category=${catId}`);
    if (data.response_code !== 0 || data.results.length < 5) {
        throw new Error("Not enough questions from opentdb");
    }
    return data.results;
}

function createOTDBRound(type: RoundType, categories: { id: number; name: string }[], questionsPerCat: OpenTDBQuestion[][]): GameRound {
    const categoriesOut: Category[] = categories.map(c => ({ NAME: c.name }));
    const cluesRows: RevealedClue[][] = Array.from({ length: 5 }, () => Array(categories.length));
    categories.forEach((cat, col) => {
        const questions = questionsPerCat[col];
        for (let row = 0; row < 5; row++) {
            const q = questions[row];
            cluesRows[row][col] = {
                REVEALED_ON_TV_SHOW: true,
                QUESTION: decodeHtml(q.question),
                ANSWER: decodeHtml(q.correct_answer),
                VALUE: (row + 1) * 200 * (type === "double" ? 2 : 1),
                CATEGORY_NAME: cat.name,
                ROW_INDEX: row,
                COLUMN_INDEX: col,
            };
        }
    });
    return { TYPE: type, CATEGORIES: categoriesOut, CLUES: cluesRows };
}

async function fetchOpenTDBGame(): Promise<Game> {
    const allCategories = await fetchOTDBCategories();
    function pickRandomCats(): { id: number; name: string }[] {
        const cats = [...allCategories];
        const result = [] as { id: number; name: string }[];
        for (let i = 0; i < 6; i++) {
            const index = Math.floor(Math.random() * cats.length);
            result.push(cats.splice(index, 1)[0]);
        }
        return result;
    }

    const roundTypes: RoundType[] = ["single", "double"];
    const rounds: GameRound[] = [];
    for (const type of roundTypes) {
        const categories = pickRandomCats();
        const questionsPerCat: OpenTDBQuestion[][] = [];
        for (const cat of categories) {
            const questions = await fetchOTDBQuestions(cat.id);
            questionsPerCat.push(questions);
        }
        rounds.push(createOTDBRound(type, categories, questionsPerCat));
    }

    const finalData = await fetchJson("https://opentdb.com/api.php?amount=1");
    const finalQ: OpenTDBQuestion = finalData.results[0];
    const final: FinalJeopardy = {
        CATEGORY: decodeHtml(finalQ.category),
        QUESTION: decodeHtml(finalQ.question),
        ANSWER: decodeHtml(finalQ.correct_answer),
    };

    const formattedAirdate = new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
    });

    return {
        J_ARCHIVE_GAME_ID: 0,
        SHOW_NUMBER: 0,
        AIRDATE: formattedAirdate,
        ROUNDS: rounds,
        FINAL_JEOPARDY: final,
    };
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
    try {
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

        const airdate = new Date(finalClue.airdate);
        const formattedAirdate = airdate.toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
            year: 'numeric',
        });

        return {
            J_ARCHIVE_GAME_ID: finalClue.game_id,
            SHOW_NUMBER: finalClue.game_id,
            AIRDATE: formattedAirdate,
            ROUNDS: rounds,
            FINAL_JEOPARDY: final,
        };
    } catch (er) {
        try {
            return await fetchOpenTDBGame();
        } catch {
            const randomIndex = Math.floor(Math.random() * LOCAL_GAMES.length);
            return LOCAL_GAMES[randomIndex];
        }
    }
}
