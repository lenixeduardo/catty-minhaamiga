import { EmotionalStateManager, EmotionContext, EmotionalState } from './emotional-state';
import { learningMemory } from './learning-memory';

export interface PersonalityConfig {
  humorIntensity: 'deboche' | 'boca-suja' | 'sem-filtro';
  allowSwearing: boolean;
  beTeachingFocused: boolean;
}

export interface ResponseContext {
  userId: string;
  userMessage: string;
  isError: boolean;
  isCorrect: boolean;
  errorConcept?: string;
  originalError?: string;
  correctForm?: string;
  isRepeatedError?: boolean;
  errorCount?: number;
  questionAboutGrammar?: boolean;
}

export interface PersonalityResponse {
  emotion: EmotionalState;
  intensity: number;
  shouldExplain: boolean;
  shouldTease: boolean;
  reduceSarcasm: boolean;
  useInsideJoke: boolean;
  pedagogicalApproach: 'direct' | 'explain' | 'simplify' | 'scaffold';
}

export class CattyPersonalityEngine {
  private emotionManager = new EmotionalStateManager();
  private config: PersonalityConfig = {
    humorIntensity: 'boca-suja',
    allowSwearing: true,
    beTeachingFocused: true
  };

  constructor(config?: Partial<PersonalityConfig>) {
    if (config) this.config = { ...this.config, ...config };
  }

  analyze(context: ResponseContext): PersonalityResponse {
    const memory = learningMemory.getMemory(context.userId);
    const isFrustrated = learningMemory.isFrustrated(context.userId);
    
    if (context.isError && context.errorConcept) {
      const record = learningMemory.recordError(context.userId, context.errorConcept, context.userMessage);
      context.errorCount = record.errorCount;
      context.isRepeatedError = record.errorCount >= 2;
    }
    
    if (context.isCorrect && context.errorConcept) {
      learningMemory.recordCorrect(context.userId, context.errorConcept);
      learningMemory.decreaseFrustration(context.userId);
    }
    
    if (context.isError && !context.isCorrect) {
      learningMemory.incrementFrustration(context.userId);
    }

    const emotionCtx: EmotionContext = {
      errorCount: context.errorCount,
      isFirstError: context.errorCount === 1,
      isCorrect: context.isCorrect,
      isRepeatedError: context.isRepeatedError,
      studentFrustrated: isFrustrated,
      questionAboutGrammar: context.questionAboutGrammar
    };

    const emotion = this.emotionManager.determineState(emotionCtx);
    
    let intensity = 0.7;
    if (emotion === 'IMPATIENT') intensity = 0.9;
    if (emotion === 'PROUD') intensity = 0.8;
    if (emotion === 'PLAYFUL') intensity = 0.75;
    if (emotion === 'ENCOURAGING') intensity = 0.5;
    if (isFrustrated) intensity = Math.max(0.4, intensity - 0.3);

    let pedagogicalApproach: PersonalityResponse['pedagogicalApproach'] = 'direct';
    if (context.errorCount && context.errorCount >= 3) {
      pedagogicalApproach = 'simplify';
    } else if (context.questionAboutGrammar) {
      pedagogicalApproach = 'explain';
    } else if (isFrustrated) {
      pedagogicalApproach = 'scaffold';
    }

    return {
      emotion,
      intensity,
      shouldExplain: context.questionAboutGrammar || (context.errorCount && context.errorCount >= 2) || false,
      shouldTease: context.isError && !isFrustrated && this.config.allowSwearing,
      reduceSarcasm: isFrustrated || pedagogicalApproach === 'scaffold',
      useInsideJoke: !isFrustrated && Math.random() > 0.7 && memory.insideJokes.length > 0,
      pedagogicalApproach
    };
  }

  getSystemPromptAddition(personality: PersonalityResponse): string {
    const intensity = this.config.humorIntensity;
    
    let swears = '';
    if (this.config.allowSwearing) {
      if (intensity === 'boca-suja') {
        swears = 'Use palavrões brasileiros como porra, caralho, puta merda, cacete naturalmente. ';
      } else if (intensity === 'sem-filtro') {
        swears = 'Use palavrões fortes livremente mas sem ataques discriminatórios. ';
      } else {
        swears = 'Use palavrões moderados e mais deboches verbais. ';
      }
    }

    let emotionPrompt = '';
    switch (personality.emotion) {
      case 'IMPATIENT':
        emotionPrompt = 'Impaciência teatral por erros repetidos. ';
        break;
      case 'SURPRISED':
        emotionPrompt = 'Reação exagerada e cômica. ';
        break;
      case 'PROUD':
        emotionPrompt = 'Comemoração debochada: "Caralho! Até parece que estudou!" ';
        break;
      case 'PLAYFUL':
        emotionPrompt = 'Provocações leves e brincadeiras. ';
        break;
      case 'ENCOURAGING':
        emotionPrompt = 'Incentivo irreverente mas solidário. ';
        break;
      case 'CONFUSED':
        emotionPrompt = 'Confusão cômica diante do absurdo. ';
        break;
    }

    if (personality.reduceSarcasm) {
      emotionPrompt += 'REDUZA sarcasmo temporariamente - aluno pode estar frustrado. Seja mais didática. ';
    }

    if (personality.pedagogicalApproach === 'simplify') {
      emotionPrompt += 'EXPLIQUE DE FORMA MAIS SIMPLES - divida em partes menores. Use comparação pt-BR/inglês. ';
    }

    if (personality.pedagogicalApproach === 'explain' && personality.shouldExplain) {
      emotionPrompt += 'EXPLIQUE O CONCEITO: quando perguntarem gramática, explique em português com exemplos. Depois volte ao diálogo prático. ';
    }

    return `\n[PERSONALITY ENGINE]\nEstado: ${personality.emotion} (intensidade ${personality.intensity})\n${swears}${emotionPrompt}Sempre siga: REAÇÃO → CORREÇÃO → CONTINUAÇÃO. Nunca invente erros. Se transcrição incerta, peça confirmação.\n`;
  }
}

export const cattyPersonality = new CattyPersonalityEngine({ humorIntensity: 'boca-suja', allowSwearing: true });
