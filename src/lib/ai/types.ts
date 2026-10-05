import type { AppLanguage, ConcernCategory } from '@prisma/client';

export type Intent =
  | 'GREETING'
  | 'SALARY_QUERY'
  | 'JOB_SECURITY_QUERY'
  | 'FURTHER_EDUCATION_QUERY'
  | 'SCHEME_QUERY'
  | 'CAREER_INFO'
  | 'COMPARISON_QUERY'
  | 'COMPLAINT'
  | 'ESCALATION_REQUEST'
  | 'FEEDBACK'
  | 'GENERAL_QUERY';

export type SentimentLabel = 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE' | 'MIXED';

export interface AnalysisResult {
  language: AppLanguage;
  intent: Intent;
  concern: ConcernCategory;
  concernConfidence: number;
  sentiment: SentimentLabel;
  sentimentScore: number;
  wantsHuman: boolean;
}

export interface RetrievedChunk {
  id: string;
  title: string;
  chunk: string;
  docType: string;
  language: AppLanguage;
  tags: string[];
  tradeId: string | null;
  score: number;
  source: {
    id: string;
    name: string;
    url: string | null;
    publisher: string | null;
    category: string;
    isSynthetic: boolean;
    verificationStatus: string;
  } | null;
}

export interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LLMChatResult {
  text: string;
  provider: string;
  model: string;
}

/** Provider abstraction — swap AI vendors without touching application code. */
export interface LLMProvider {
  readonly name: string;
  readonly model: string;
  readonly isDemo: boolean;
  chat(messages: LLMMessage[], options?: { temperature?: number; maxTokens?: number }): Promise<LLMChatResult>;
  embed?(texts: string[]): Promise<number[][]>;
}

export interface CounsellingContext {
  userMessage: string;
  language: AppLanguage;
  userRole: string;
  history: LLMMessage[];
  analysis: AnalysisResult;
  chunks: RetrievedChunk[];
}
