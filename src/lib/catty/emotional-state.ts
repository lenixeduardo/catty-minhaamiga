export type EmotionalState = 
  | 'NEUTRAL'
  | 'IMPATIENT'
  | 'SURPRISED'
  | 'PROUD'
  | 'CONFUSED'
  | 'PLAYFUL'
  | 'ENCOURAGING';

export interface EmotionContext {
  errorCount?: number;
  isFirstError?: boolean;
  isCorrect?: boolean;
  isRepeatedError?: boolean;
  studentFrustrated?: boolean;
  hasRecentMemory?: boolean;
  questionAboutGrammar?: boolean;
}

export class EmotionalStateManager {
  private currentState: EmotionalState = 'NEUTRAL';
  private history: EmotionalState[] = [];

  determineState(ctx: EmotionContext): EmotionalState {
    if (ctx.studentFrustrated) {
      this.currentState = 'ENCOURAGING';
      this.history.push(this.currentState);
      return this.currentState;
    }

    if (ctx.isCorrect) {
      if (Math.random() > 0.3) {
        this.currentState = 'PROUD';
      } else {
        this.currentState = 'PLAYFUL';
      }
      this.history.push(this.currentState);
      return this.currentState;
    }

    if (ctx.isRepeatedError && ctx.errorCount && ctx.errorCount >= 3) {
      this.currentState = 'IMPATIENT';
      this.history.push(this.currentState);
      return this.currentState;
    }

    if (ctx.isRepeatedError && ctx.errorCount && ctx.errorCount >= 2) {
      this.currentState = 'IMPATIENT';
      this.history.push(this.currentState);
      return this.currentState;
    }

    if (ctx.isFirstError) {
      if (Math.random() > 0.6) {
        this.currentState = 'SURPRISED';
      } else {
        this.currentState = 'PLAYFUL';
      }
      this.history.push(this.currentState);
      return this.currentState;
    }

    if (ctx.questionAboutGrammar) {
      this.currentState = 'NEUTRAL';
      this.history.push(this.currentState);
      return this.currentState;
    }

    this.currentState = 'NEUTRAL';
    this.history.push(this.currentState);
    return this.currentState;
  }

  getCurrentState(): EmotionalState {
    return this.currentState;
  }

  getHistory(): EmotionalState[] {
    return [...this.history];
  }

  reset(): void {
    this.currentState = 'NEUTRAL';
    this.history = [];
  }
}
