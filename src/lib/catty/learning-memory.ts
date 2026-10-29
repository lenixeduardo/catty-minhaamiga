export interface LearningRecord {
  concept: string;
  errorCount: number;
  lastSeen: number;
  correctCount: number;
  examples: string[];
  mastered: boolean;
}

export interface UserMemory {
  userId: string;
  errors: Map<string, LearningRecord>;
  learnedWords: Set<string>;
  masteredConcepts: Set<string>;
  insideJokes: Array<{joke: string; context: string; timestamp: number}>;
  preferences: {
    humorIntensity: 'deboche' | 'boca-suja' | 'sem-filtro';
    wantsExplanations: boolean;
  };
  frustrationLevel: number;
  sessionCount: number;
}

export class LearningMemory {
  private memories = new Map<string, UserMemory>();

  getMemory(userId: string): UserMemory {
    if (!this.memories.has(userId)) {
      this.memories.set(userId, {
        userId,
        errors: new Map(),
        learnedWords: new Set(),
        masteredConcepts: new Set(),
        insideJokes: [],
        preferences: {
          humorIntensity: 'boca-suja',
          wantsExplanations: true
        },
        frustrationLevel: 0,
        sessionCount: 0
      });
    }
    return this.memories.get(userId)!;
  }

  recordError(userId: string, concept: string, example: string): LearningRecord {
    const memory = this.getMemory(userId);
    const existing = memory.errors.get(concept);
    
    if (existing) {
      existing.errorCount++;
      existing.lastSeen = Date.now();
      existing.examples.push(example);
      return existing;
    }
    
    const record: LearningRecord = {
      concept,
      errorCount: 1,
      lastSeen: Date.now(),
      correctCount: 0,
      examples: [example],
      mastered: false
    };
    memory.errors.set(concept, record);
    return record;
  }

  recordCorrect(userId: string, concept: string): void {
    const memory = this.getMemory(userId);
    const existing = memory.errors.get(concept);
    if (existing) {
      existing.correctCount++;
      if (existing.correctCount >= 3 && existing.errorCount <= existing.correctCount) {
        existing.mastered = true;
        memory.masteredConcepts.add(concept);
      }
    }
  }

  getRecurringErrors(userId: string): LearningRecord[] {
    const memory = this.getMemory(userId);
    return Array.from(memory.errors.values())
      .filter(r => r.errorCount >= 2 && !r.mastered)
      .sort((a, b) => b.errorCount - a.errorCount);
  }

  addInsideJoke(userId: string, joke: string, context: string): void {
    const memory = this.getMemory(userId);
    memory.insideJokes.push({ joke, context, timestamp: Date.now() });
  }

  getRelevantJoke(userId: string): string | null {
    const memory = this.getMemory(userId);
    if (memory.insideJokes.length === 0) return null;
    if (Math.random() > 0.3) return null;
    const joke = memory.insideJokes[memory.insideJokes.length - 1];
    return joke.joke;
  }

  incrementFrustration(userId: string): void {
    const memory = this.getMemory(userId);
    memory.frustrationLevel = Math.min(10, memory.frustrationLevel + 1);
  }

  decreaseFrustration(userId: string): void {
    const memory = this.getMemory(userId);
    memory.frustrationLevel = Math.max(0, memory.frustrationLevel - 2);
  }

  isFrustrated(userId: string): boolean {
    return this.getMemory(userId).frustrationLevel >= 6;
  }
}

export const learningMemory = new LearningMemory();
