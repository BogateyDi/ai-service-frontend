
import {
    DocumentType, GenerationResult, BookPlanRequest, BookPlan, BookChapter,
    SwotAnalysisRequest, CommercialProposalRequest, BusinessPlanRequest, BusinessPlan,
    BusinessPlanSection, MarketingCopyRequest, TextRewritingRequest, AcademicArticleRequest,
    ArticlePlan, ArticleSection, CodeGenerationRequest, CodeAnalysisResult, ThesisSectionInput,
    PersonalAnalysisRequest, Specialist, ChatMessage, GenerationRecord, AudioScriptRequest, WebSource
} from '../types';

// Используем URL вашего бэкенда на Render. Замените, если имя вашего сервиса отличается.
const API_URL = 'https://ai-service-backend.onrender.com';

// Helper to read a file and convert it to a base64 string
const fileToSerializable = async (file: File): Promise<{ base64: string, name: string, type: string }> => {
    const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve((reader.result as string).split(',')[1]);
        reader.onerror = (error) => reject(error);
    });
    return { base64, name: file.name, type: file.type };
};

const handleApiResponse = async (response: Response) => {
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to parse error response' }));
        throw new Error(errorData.error || `Request failed with status ${response.status}`);
    }
    return response.json();
};

const generate = (type: string, payload: any) => {
    return fetch(`${API_URL}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, payload }),
    }).then(handleApiResponse);
};

export const calculateTextMetrics = (text: string): { tokenCount: number; pageCount: number } => {
    if (!text) return { tokenCount: 0, pageCount: 0 };
    const tokenCount = Math.ceil(text.length / 4);
    const wordCount = text.split(/\s+/).filter(Boolean).length;
    const pageCount = parseFloat((wordCount / 500).toFixed(1));
    return { tokenCount, pageCount };
};

// #region Public Service Functions

// Student / Standard Generation
export const generateText = async (docType: DocumentType, topic: string, age: number): Promise<GenerationResult> => {
    return generate('standard', { docType, topic, age });
};

// Astrology
export const generateNatalChart = async (date: string, time: string, place: string): Promise<GenerationResult> => {
    return generate('astrology', { date, time, place, horoscope: false, docType: DocumentType.ASTROLOGY });
};

export const generateHoroscope = async (date: string): Promise<GenerationResult> => {
    return generate('astrology', { date, horoscope: true, docType: DocumentType.ASTROLOGY });
};

// Book Writing
export const generateBookPlan = async (request: BookPlanRequest): Promise<BookPlan> => {
    return generate('book_plan', request);
};

export const generateSingleChapter = async (chapter: BookChapter, bookTitle: string, genre: string, style: string, readerAge: number): Promise<string> => {
    const result = await generate('single_chapter', { chapter, bookTitle, genre, style, readerAge });
    return result.text; // Assuming backend returns { text: '...' }
};

// File Tasks
const generateWithFiles = async (type: string, files: File[], prompt: string, docType: DocumentType, otherPayload = {}) => {
    const serializedFiles = await Promise.all(files.map(fileToSerializable));
    return generate(type, { files: serializedFiles, prompt, docType, ...otherPayload });
}

export const solveTaskFromFiles = async (files: File[], prompt: string, docType: DocumentType): Promise<GenerationResult> => {
    return generateWithFiles('file_task', files, prompt, docType);
};

export const analyzeScienceTaskFromFiles = async (files: File[], prompt: string, docType: DocumentType): Promise<GenerationResult> => {
    return generateWithFiles('science_file_task', files, prompt, docType);
};

export const analyzeCreativeTaskFromFiles = async (files: File[], text: string, prompt: string, docType: DocumentType): Promise<GenerationResult> => {
    const serializedFiles = await Promise.all(files.map(fileToSerializable));
    return generate('creative_file_task', { files: serializedFiles, text, prompt, docType });
};

export const analyzeUserDocuments = async (files: File[], prompt:string): Promise<GenerationResult> => {
    return generateWithFiles('doc_analysis', files, prompt, DocumentType.DOCUMENT_ANALYSIS);
};


// Business
export const generateSwotAnalysis = async (request: SwotAnalysisRequest): Promise<GenerationResult> => {
    return generate('swot', { ...request, docType: DocumentType.SWOT_ANALYSIS });
};

export const generateCommercialProposal = async (request: CommercialProposalRequest): Promise<GenerationResult> => {
    return generate('commercial_proposal', { ...request, docType: DocumentType.COMMERCIAL_PROPOSAL });
};

export const generateBusinessPlan = async (request: BusinessPlanRequest): Promise<BusinessPlan> => {
    return generate('business_plan', { ...request, docType: DocumentType.BUSINESS_PLAN });
};

export const generateSingleBusinessSection = async (section: BusinessPlanSection, planTitle: string, industry: string): Promise<string> => {
    const result = await generate('business_section', { section, planTitle, industry, docType: DocumentType.BUSINESS_PLAN });
    return result.text;
};

export const generateMarketingCopy = async (request: MarketingCopyRequest): Promise<GenerationResult> => {
    return generate('marketing_copy', { ...request, docType: DocumentType.MARKETING_COPY });
};

// Creative
export const rewriteText = async (request: TextRewritingRequest, file: File | null): Promise<GenerationResult> => {
    const filePayload = file ? await fileToSerializable(file) : null;
    return generate('rewrite', { ...request, file: filePayload, docType: DocumentType.TEXT_REWRITING });
};

export const generateAudioScript = async (request: AudioScriptRequest): Promise<GenerationResult> => {
    return generate('audio_script', { ...request, docType: DocumentType.AUDIO_SCRIPT });
};

// Science
export const generateArticlePlan = async (request: AcademicArticleRequest): Promise<ArticlePlan> => {
    return generate('article_plan', { ...request, docType: DocumentType.ACADEMIC_ARTICLE });
};

export const generateGrantPlan = async (request: AcademicArticleRequest, file: File | null): Promise<ArticlePlan> => {
    const filePayload = file ? await fileToSerializable(file) : null;
    return generate('grant_plan', { ...request, file: filePayload, docType: DocumentType.GRANT_PROPOSAL });
};

export const generateSingleArticleSection = async (section: ArticleSection, planTitle: string, field: string): Promise<string> => {
    const result = await generate('article_section', { section, planTitle, field, docType: DocumentType.ACADEMIC_ARTICLE });
    return result.text;
};

// Thesis
export const generateFullThesis = async (topic: string, field: string, sections: ThesisSectionInput[]): Promise<GenerationResult> => {
    const serializableSections = await Promise.all(sections.map(async s => {
        if (s.contentType === 'file' && s.file) {
            return { ...s, file: await fileToSerializable(s.file) };
        }
        return s;
    }));
    return generate('full_thesis', { topic, field, sections: serializableSections, docType: DocumentType.THESIS });
};


// Code
export const analyzeCodeTask = async (request: CodeGenerationRequest): Promise<CodeAnalysisResult> => {
    return generate('code_analysis', { ...request, docType: DocumentType.CODE_GENERATION });
};

export const generateCode = async (request: CodeGenerationRequest): Promise<GenerationResult> => {
    return generate('code_generate', { ...request, docType: DocumentType.CODE_GENERATION });
};

// Personal Analysis
export const generatePersonalAnalysis = async (request: PersonalAnalysisRequest): Promise<GenerationResult> => {
    return generate('personal_analysis', { ...request, docType: DocumentType.PERSONAL_ANALYSIS });
};

// Analysis
export const performAnalysis = async (files: File[], prompt: string, docType: DocumentType): Promise<GenerationResult> => {
    const isGrounded = docType === DocumentType.ANALYSIS_VERIFY;
    return generateWithFiles('analysis', files, prompt, docType, { isGrounded });
};

// Forecasting
export const generateForecasting = async (prompt: string): Promise<GenerationResult> => {
    return generate('forecasting', { prompt, docType: DocumentType.FORECASTING });
};

// Mermaid to Table
export const convertMermaidToTable = async (brokenCode: string): Promise<string> => {
    const result = await generate('mermaid_to_table', { brokenCode, docType: DocumentType.REPORT });
    return result.text;
};

// #region Chat Functions

// For Mirra/Dary, where frontend manages history
export const sendStatelessMessage = async (
    assistantType: 'mirra' | 'dary',
    history: ChatMessage[],
    message: string,
    settings: { internetEnabled: boolean; memoryEnabled: boolean; },
    attachment?: GenerationRecord
): Promise<{ text: string, sources?: WebSource[] }> => {
    return fetch(`${API_URL}/api/stateless-chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assistantType, history, message, settings, attachment }),
    }).then(handleApiResponse);
};

// For Tutor/Consultant, where backend manages history
export const startChatSession = async (
    config: { specialist?: Specialist, tutorSubject?: string, age?: number }
): Promise<string> => {
    const response = await fetch(`${API_URL}/api/chat/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
    }).then(handleApiResponse);
    return response.chatId;
};

export const sendMessageInSession = async (
    chatId: string,
    message: string
): Promise<{ text: string, sources?: WebSource[] }> => {
    return fetch(`${API_URL}/api/chat/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chatId, message }),
    }).then(handleApiResponse);
};

// #endregion
