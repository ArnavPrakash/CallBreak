import mongoose, { Schema, Document } from 'mongoose';
import type { RoundData } from '@callbreak/shared';

export interface IMatch extends Document {
  players: string[];
  rounds: RoundData[];
  winner: string;
  createdAt: Date;
}

const roundSchema = new Schema(
  {
    roundNumber: { type: Number, required: true },
    bids: { type: [Number], required: true, validate: [(v: number[]) => v.length === 4, 'Must have 4 bids'] },
    scores: { type: [Number], required: true, validate: [(v: number[]) => v.length === 4, 'Must have 4 scores'] },
  },
  { _id: false }
);

const matchSchema = new Schema<IMatch>(
  {
    players: {
      type: [String],
      required: true,
      validate: [(v: string[]) => v.length === 4, 'Must have 4 players'],
    },
    rounds: { type: [roundSchema], required: true },
    winner: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { collection: 'matches' }
);

export const Match = mongoose.model<IMatch>('Match', matchSchema);
