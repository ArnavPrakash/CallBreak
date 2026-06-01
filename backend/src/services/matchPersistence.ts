import type { RoundData } from '@callbreak/shared';
import { Match } from '../models/Match';

export async function saveMatch(
  players: string[],
  rounds: RoundData[],
  winner: string
): Promise<void> {
  await Match.create({ players, rounds, winner });
}
