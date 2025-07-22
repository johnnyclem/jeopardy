import * as nock from 'nock';
import fetch, { Headers, Request, Response } from 'node-fetch';

// Replace global fetch before importing jservice
(global as any).fetch = fetch;
(global as any).Headers = Headers;
(global as any).Request = Request;
(global as any).Response = Response;

import { fetchRandomGame } from '../src/jservice';
import { LOCAL_GAMES } from '../src/localGames';


describe('fetchRandomGame', () => {
  afterEach(() => {
    nock.cleanAll();
  });

  it('fetches data from jservice when available', async () => {
    const categories = [
      { id: 1, title: 'cat1', clues_count: 10 },
      { id: 2, title: 'cat2', clues_count: 10 },
      { id: 3, title: 'cat3', clues_count: 10 },
      { id: 4, title: 'cat4', clues_count: 10 },
      { id: 5, title: 'cat5', clues_count: 10 },
      { id: 6, title: 'cat6', clues_count: 10 },
    ];

    const clues = Array.from({ length: 5 }, (_, i) => ({
      id: i,
      answer: `a${i}`,
      question: `q${i}`,
      value: (i + 1) * 200,
      airdate: '',
      created_at: '',
      updated_at: '',
      category_id: 1,
      game_id: 1,
      invalid_count: null,
      category: { id: 1, title: 'cat1' },
    }));

    nock('https://jservice.io')
      .get('/api/categories')
      .query(true)
      .times(2)
      .reply(200, categories);

    for (let round = 0; round < 2; round++) {
      categories.forEach(cat => {
        nock('https://jservice.io')
          .get('/api/clues')
          .query(q => q.category == String(cat.id))
          .reply(200, clues);
      });
    }

    nock('https://jservice.io')
      .get('/api/random')
      .reply(200, [clues[0]]);

    const game = await fetchRandomGame();
    expect(game.ROUNDS[0].CATEGORIES[0].NAME).toBe('cat1');
  });

  it('falls back to local games on error', async () => {
    nock('https://jservice.io')
      .get(/.*/)
      .replyWithError('fail');

    const game = await fetchRandomGame();
    expect(LOCAL_GAMES).toContainEqual(game);
  });
});
