import { LOCAL_GAMES } from '../src/localGames';

test('there are at least 10 local games', () => {
  expect(LOCAL_GAMES.length).toBeGreaterThanOrEqual(10);
});
