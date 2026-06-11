import { z } from "zod";

// -----------------------------------------------
// Score schema
// -----------------------------------------------

export const scoreSchema = z.object({
  id: z.string(),
  judgeId: z.string(),
  participationId: z.string(),
  score: z.number().min(1).max(10),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Score = z.TypeOf<typeof scoreSchema>;

// -----------------------------------------------
// Submit score schema
// -----------------------------------------------

export const submitScoreSchema = z.object({
  participationId: z.string(),
  score: z.number().min(1, "Score must be at least 1").max(10, "Score must be at most 10"),
});

export type SubmitScore = z.TypeOf<typeof submitScoreSchema>;

// -----------------------------------------------
// Ranking query schema
// -----------------------------------------------

export const rankingQuerySchema = z.object({
  hackathonId: z.string(),
});

export type RankingQuery = z.TypeOf<typeof rankingQuerySchema>;

// -----------------------------------------------
// Update minimum judges schema
// -----------------------------------------------

export const updateMinJudgesSchema = z.object({
  hackathonId: z.string(),
  minJudges: z.number().min(1, "Minimum judges must be at least 1").max(10, "Maximum judges limit is 10"),
});

export type UpdateMinJudges = z.TypeOf<typeof updateMinJudgesSchema>;

// -----------------------------------------------
// Leaderboard entry schema (for validation)
// -----------------------------------------------

export const leaderboardEntrySchema = z.object({
  id: z.string(),
  rank: z.number().positive(),
  title: z.string(),
  description: z.string(),
  project_url: z.string().url(),
  creatorName: z.string(),
  averageScore: z.number().min(0).max(10),
  totalJudges: z.number().nonnegative(),
  isWinner: z.boolean(),
  isPodium: z.boolean(),
  scores: z.array(z.object({
    id: z.string(),
    score: z.number().min(1).max(10),
    judge: z.object({
      user: z.object({
        name: z.string().nullable(),
        username: z.string().nullable(),
      }),
    }),
  })),
});

export type LeaderboardEntry = z.TypeOf<typeof leaderboardEntrySchema>;

// -----------------------------------------------
// Judge scoring progress schema
// -----------------------------------------------

export const judgeScoringProgressSchema = z.object({
  completed: z.number().nonnegative(),
  remaining: z.number().nonnegative(),
  percentage: z.number().min(0).max(100),
});

export type JudgeScoringProgress = z.TypeOf<typeof judgeScoringProgressSchema>;