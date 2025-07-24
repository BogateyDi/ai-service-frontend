

export enum DocumentType {
  // Student types
  COMPOSITION = 'Сочинение',
  SUMMARY = 'Изложение',
  ABSTRACT = 'Реферат',
  REPORT = 'Доклад',
  ESSAY = 'Эссе',
  REVIEW = 'Отзыв',
  CHARACTER_PROFILE = 'Характеристика героя',
  TEXT_ANALYSIS = 'Анализ текста',
  SCRIPT = 'Анализ',
  TUTOR = 'Репетитор',
  DO_HOMEWORK = 'Сделать ДЗ',
  SOLVE_CONTROL_WORK = 'Решать КР, ПР',

  // Advanced types
  SCIENTIFIC_RESEARCH = 'Изыскание',
  THESIS = 'Дипломная работа',
  TECH_IMPROVEMENT = 'Улучшение технологии',
  BOOK_WRITING = 'Написать книгу',
  ASTROLOGY = 'Астрология',
  PERSONAL_ANALYSIS = 'Личностный анализ',
  DOCUMENT_ANALYSIS = 'Доктор',
  CONSULTATION = 'Консультация',
  ACADEMIC_ARTICLE = 'Научная статья',
  GRANT_PROPOSAL = 'Грант',
  FORECASTING = 'Прогнозирование',

  // Business types
  SWOT_ANALYSIS = 'SWOT-анализ',
  COMMERCIAL_PROPOSAL = 'Коммерческое',
  BUSINESS_PLAN = 'Бизнес-план',
  MARKETING_COPY = 'Маркетинг',

  // Creative types
  TEXT_REWRITING = 'Переработка текста',
  AUDIO_SCRIPT = 'Аудио скрипт',
  
  // Code types
  CODE_GENERATION = 'Генерация кода',

  // Analysis types
  ANALYSIS_SHORT = 'Кратко по сути',
  ANALYSIS_VERIFY = 'Достоверность',
}

export interface FavoriteService {
  docType: DocumentType;
  age?: number;
}

export interface GenerationPackage {
  name: string;
  generations: number;
  price: string;
}

export enum AppView {
    GENERATOR,
    PRICING,
    ASSISTANT
}

export interface WebSource {
  uri: string;
  title: string;
}

export interface ChatMessage {
    role: 'user' | 'model';
    text: string;
    sources?: WebSource[];
    timestamp?: number;
    sharedGenerationId?: string;
}

export interface GenerationRecord {
  id: string;
  timestamp: number;
  docType: DocumentType;
  title: string;
  text: string;
}

export interface UserAccount {
  generations: number;
  referrerCode?: string;
  generationHistory?: GenerationRecord[];
  favoriteServices?: FavoriteService[];
  maxStorageSize?: number; // Allowed storage size in bytes
  // Mirra
  hasMirra: boolean;
  mirraChatHistory: ChatMessage[];
  mirraSettings: { internetEnabled: boolean; memoryEnabled: boolean; };
  // Dary
  hasDary: boolean;
  daryChatHistory: ChatMessage[];
  darySettings: { internetEnabled: boolean; memoryEnabled: boolean; };
}


export type AstrologyStep = 'none' | 'selection' | 'natal_form' | 'horoscope_form' | 'generating' | 'completed';
export type BookWritingStep = 'none' | 'form' | 'plan_review' | 'generating_chapters' | 'completed';
export type PersonalAnalysisStep = 'none' | 'form' | 'generating' | 'completed';
export type DocAnalysisStep = 'none' | 'upload_form' | 'generating' | 'completed';
export type ConsultationStep = 'none' | 'selection' | 'chatting';
export type TutorStep = 'none' | 'subject_selection' | 'chatting';
export type FileTaskStep = 'none' | 'upload_form' | 'generating' | 'completed';
export type BusinessStep = 'none' | 'swot_form' | 'proposal_form' | 'business_plan_form' | 'plan_review' | 'generating' | 'completed' | 'marketing_form';
export type CreativeStep = 'none' | 'rewriting_form' | 'script_upload_form' | 'audio_script_topic' | 'audio_script_config' | 'generating' | 'completed';
export type ScienceStep = 'none' | 'article_form' | 'plan_review' | 'generating' | 'completed';
export type ScienceFileStep = 'none' | 'upload_form' | 'generating' | 'completed';
export type CodeStep = 'none' | 'form' | 'review' | 'generating' | 'completed';
export type ThesisStep = 'none' | 'form' | 'generating' | 'completed';
export type AnalysisStep = 'none' | 'upload_form' | 'generating' | 'completed';
export type ForecastingStep = 'none' | 'form' | 'generating' | 'completed';


// --- Book Writing Types ---
export interface BookPlanRequest {
  genre: string;
  style: string;
  chaptersCount: number;
  userPrompt: string;
  readerAge: number;
}

export interface BookChapter {
  title: string;
  description: string;
  generationPrompt: string; // The detailed prompt for generating this specific chapter
}

export interface BookPlan {
  title: string;
  chapters: BookChapter[];
}

// --- Business Types ---
export interface SwotAnalysisRequest {
  description: string;
}

export interface CommercialProposalRequest {
  product: string;
  client: string;
  goals: string;
}

export interface BusinessPlanRequest {
  idea: string;
  industry: string;
  sectionsCount: number;
}

export interface BusinessPlanSection {
  title: string;
  description: string;
  generationPrompt: string;
}

export interface BusinessPlan {
  title: string;
  sections: BusinessPlanSection[];
}

export interface MarketingCopyRequest {
    copyType: string;
    product: string;
    audience: string;
    tone: string;
    details: string;
}


// --- Science Types ---
export interface AcademicArticleRequest {
  topic: string;
  hypothesis: string;
  field: string;
  sectionsCount: number;
}

export interface ArticleSection {
  title: string;
  description: string;
  generationPrompt: string;
}

export interface ArticlePlan {
  title: string;
  sections: ArticleSection[];
}

export interface ThesisSectionInput {
  id: string;
  title: string;
  contentType: 'generate' | 'text' | 'file' | 'skip';
  pagesToGenerate: number;
  content: string;
  file: File | null;
}


// --- Creative Types ---
export interface TextRewritingRequest {
    originalText: string;
    goal: string;
    style?: string;
    instructions?: string;
}

export interface VoiceProfile {
    id: string;
    label: string;
    description: string;
}

export interface AudioScriptRequest {
    topic: string;
    duration: number;
    format: 'dialogue' | 'monologue';
    type: string;
    voice1: string;
    voice2?: string;
}

// --- Code Types ---
export interface CodeGenerationRequest {
    language: string;
    taskDescription: string;
}

export interface CodeAnalysisResult {
    plan: string;
    complexity: string;
    cost: number;
}

// --- Life Types ---
export interface PersonalAnalysisRequest {
    gender: 'male' | 'female';
    userPrompt: string;
}

export interface Specialist {
    id: string;
    name: string;
    description: string;
    category: 'Медицина' | 'Другие сферы';
    systemInstruction: string;
}

export interface GenerationResult {
  docType: DocumentType;
  text: string;
  uniqueness: number;
  tokenCount?: number;
  pageCount?: number;
  plan?: BookPlan | BusinessPlan | ArticlePlan | null; // To hold the generated plan
  sources?: WebSource[];
}