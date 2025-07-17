import { GameRound, RevealedClue } from "./typesForGame";

export class TextToSpeechManager {
    private readonly apiKey: string;
    private readonly voiceId: string;
    private queue: { id: string; text: string }[] = [];
    private fetching = false;
    private abortController: AbortController | null = null;
    private activeTask: { id: string; text: string } | null = null;
    private readonly audioCache = new Map<string, HTMLAudioElement>();

    public constructor(apiKey: string, voiceId: string) {
        this.apiKey = apiKey;
        this.voiceId = voiceId;
    }

    public startRound(gameRound: GameRound, roundIndex: number): void {
        gameRound.CLUES.forEach(row => {
            row.forEach(clue => {
                if (clue.REVEALED_ON_TV_SHOW) {
                    this.queue.push({
                        id: this.getId(roundIndex, clue.ROW_INDEX, clue.COLUMN_INDEX),
                        text: clue.QUESTION
                    });
                }
            });
        });
        void this.processQueue();
    }

    public async playQuestion(roundIndex: number, clue: RevealedClue): Promise<void> {
        const id = this.getId(roundIndex, clue.ROW_INDEX, clue.COLUMN_INDEX);
        const cached = this.audioCache.get(id);
        if (cached) {
            cached.play();
            return;
        }
        const audio = await this.fetchImmediate(id, clue.QUESTION);
        audio.play();
    }

    private getId(round: number, row: number, col: number): string {
        return `${round}-${row}-${col}`;
    }

    private async fetchImmediate(id: string, text: string): Promise<HTMLAudioElement> {
        if (this.abortController) {
            this.abortController.abort();
            if (this.activeTask) {
                this.queue.unshift(this.activeTask);
            }
        }
        const audio = await this.fetchAudio(id, text);
        void this.processQueue();
        return audio;
    }

    private async fetchAudio(id: string, text: string): Promise<HTMLAudioElement> {
        this.abortController = new AbortController();
        this.activeTask = { id, text };
        const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${this.voiceId}`,
            {
                method: "POST",
                headers: {
                    "xi-api-key": this.apiKey,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ text }),
                signal: this.abortController.signal
            });
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        this.audioCache.set(id, audio);
        this.abortController = null;
        this.activeTask = null;
        return audio;
    }

    private async processQueue(): Promise<void> {
        if (this.fetching) {
            return;
        }
        this.fetching = true;
        while (this.queue.length > 0) {
            const task = this.queue.shift()!;
            try {
                await this.fetchAudio(task.id, task.text);
            } catch (er) {
                if ((er as Error).name !== "AbortError") {
                    console.error("TTS fetch error", er);
                }
            }
        }
        this.fetching = false;
    }
}
