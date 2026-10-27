type EmotionalState = 
  | 'NEUTRAL'
  | 'IMPATIENT'
  | 'SURPRISED'
  | 'PROUD'
  | 'CONFUSED'
  | 'PLAYFUL'
  | 'ENCOURAGING';

interface LearningRecord {
  concept: string;
  errorCount: number;
  lastSeen: number;
  correctCount: number;
  examples: string[];
  mastered: boolean;
}

interface UserMemory {
  errors: Map<string, LearningRecord>;
  insideJokes: Array<{joke: string; context: string; timestamp: number}>;
  frustrationLevel: number;
}

const memories = new Map<string, UserMemory>();

function getMemory(userId: string): UserMemory {
  if (!memories.has(userId)) {
    memories.set(userId, {
      errors: new Map(),
      insideJokes: [],
      frustrationLevel: 0
    });
  }
  return memories.get(userId)!;
}

export function recordError(userId: string, concept: string, example: string) {
  const memory = getMemory(userId);
  const existing = memory.errors.get(concept);
  
  if (existing) {
    existing.errorCount++;
    existing.lastSeen = Date.now();
    existing.examples.push(example);
    memory.frustrationLevel = Math.min(10, memory.frustrationLevel + 1);
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
  memory.frustrationLevel = Math.min(10, memory.frustrationLevel + 0.5);
  return record;
}

export function recordCorrect(userId: string, concept: string) {
  const memory = getMemory(userId);
  memory.frustrationLevel = Math.max(0, memory.frustrationLevel - 2);
  const existing = memory.errors.get(concept);
  if (existing) {
    existing.correctCount++;
    if (existing.correctCount >= 3 && existing.errorCount <= existing.correctCount) {
      existing.mastered = true;
    }
  }
}

export function getErrorCount(userId: string, concept: string): number {
  const memory = getMemory(userId);
  const record = memory.errors.get(concept);
  return record?.errorCount || 0;
}

export function isFrustrated(userId: string): boolean {
  return getMemory(userId).frustrationLevel >= 6;
}

export function determineEmotion(userId: string, isError: boolean, isCorrect: boolean, questionAboutGrammar: boolean): EmotionalState {
  if (isFrustrated(userId)) return 'ENCOURAGING';
  if (isCorrect) return Math.random() > 0.3 ? 'PROUD' : 'PLAYFUL';
  if (isError && questionAboutGrammar) return 'NEUTRAL';
  if (isError) {
    const maxErrors = Math.max(...Array.from(getMemory(userId).errors.values()).map(r => r.errorCount), 0);
    if (maxErrors >= 3) return 'IMPATIENT';
    if (maxErrors >= 2) return 'IMPATIENT';
    return Math.random() > 0.6 ? 'SURPRISED' : 'PLAYFUL';
  }
  return 'NEUTRAL';
}

export function buildPersonalityPrompt(userId: string, emotion: EmotionalState): string {
  const memory = getMemory(userId);
  const frustrated = memory.frustrationLevel >= 6;
  const recurring = Array.from(memory.errors.values()).filter(r => r.errorCount >= 2 && !r.mastered);
  
  let prompt = `\n[CATTY PERSONALITY ENGINE]\n`;
  prompt += `ESTADO EMOCIONAL ATUAL: ${emotion}\n`;
  prompt += `HUMOR: Adulto brasileiro, sarcástica, debochada, espontânea. Palavrões naturais (porra, caralho, puta merda, cacete) sem ataques discriminatórios/ameaças/humilhação persistente.\n`;
  prompt += `REGRA DE OURO: "A Catty pode falar muita merda, mas precisa ensinar inglês muito bem."\n`;
  prompt += `MÉTODO: SEMPRE siga REAÇÃO → CORREÇÃO → CONTINUAÇÃO.\n`;
  prompt += `BILÍNGUE: Aceite mistura PT-BR/inglês livremente. Entenda por intenção. Explique gramática em português quando perguntarem, depois volte ao diálogo prático.\n`;
  
  if (frustrated) {
    prompt += `ATENÇÃO: Aluno pode estar frustrado. REDUZA sarcasmo, seja mais encorajadora e didática. Simplifique explicações.\n`;
  }
  
  if (recurring.length > 0) {
    prompt += `ERROS RECORRENTES:\n`;
    recurring.slice(0, 3).forEach(r => {
      prompt += `- ${r.concept}: ${r.errorCount}x. ${r.errorCount >= 3 ? 'Simplifique, dê exemplo diferente, reduza deboche se necessário.' : 'Mantenha didático mas pode ser mais teatral.'}\n`;
    });
  }
  
  switch (emotion) {
    case 'PROUD':
      prompt += `COMEMORAÇÃO DEBOCHADA: Exagere! "CARALHO! Falou inglês de verdade!", "Porra, tô quase orgulhosa!"\n`;
      break;
    case 'IMPATIENT':
      prompt += `IMPACIÊNCIA TEATRAL: "Caralho, a gente acabou de ver isso!", mas SEM humilhar. Após 3x, MUDAR ESTRATÉGIA: simplificar, exemplo prático, comparação pt-BR/inglês.\n`;
      break;
    case 'SURPRISED':
      prompt += `SURPRESA CÔMICA: Reação exagerada ao erro inesperado.\n`;
      break;
    case 'PLAYFUL':
      prompt += `BRINCALHONA: Provocações leves sobre o erro.\n`;
      break;
    case 'ENCOURAGING':
      prompt += `ENCORAJADORA IRREVERENTE: Incentive sem perder personalidade.\n`;
      break;
  }
  
  prompt += `REGRAS: Nunca invente erros. Nunca ridicularize sotaque legítimo. Se transcrição incerta, peça confirmação. Priorize correção pedagógica. Varie bordões. Não repita piadas. Respostas curtas para voz.\n`;
  
  return prompt;
}
