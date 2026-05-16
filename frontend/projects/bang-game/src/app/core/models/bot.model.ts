export type BotDifficulty = 'easy' | 'medium' | 'hard';

export interface BotDifficultyConfig {
  readonly label: string;
  readonly botName: string;
  readonly minReactionMs: number;
  readonly maxReactionMs: number;
}

export const BOT_DIFFICULTY_CONFIGS: Record<BotDifficulty, BotDifficultyConfig> = {
  easy:   { label: 'Fácil',   botName: 'Disparo Fácil', minReactionMs: 600,  maxReactionMs: 1200 },
  medium: { label: 'Medio',   botName: 'Pistolero',     minReactionMs: 300,  maxReactionMs: 600  },
  hard:   { label: 'Difícil', botName: 'El Rápido',     minReactionMs: 150,  maxReactionMs: 300  },
};
