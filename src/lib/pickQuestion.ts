import questionBank from './questions.json';
import type { Concept } from './types';

export type Question = {
  id: string;
  prompt: string;
  expected_understanding: string;
};

export function questionsFor(concept: Concept): Question[] {
  return (questionBank as Record<Concept, Question[]>)[concept] ?? [];
}

/** Picks the next question for a debt, avoiding the last one shown so repeat/review practice doesn't repeat itself. */
export function pickQuestion(concept: Concept, lastQuestionId?: string | null): Question | null {
  const questions = questionsFor(concept);
  if (questions.length === 0) return null;
  if (questions.length === 1 || !lastQuestionId) return questions[0];

  const pool = questions.filter((q) => q.id !== lastQuestionId);
  if (pool.length === 0) return questions[0];

  return pool[Math.floor(Math.random() * pool.length)];
}
