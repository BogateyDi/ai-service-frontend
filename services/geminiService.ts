

import { 
    DocumentType, 
    GenerationResult, 
    BookPlanRequest, 
    BookPlan, 
    BookChapter,
    SwotAnalysisRequest,
    CommercialProposalRequest,
    BusinessPlanRequest,
    BusinessPlan,
    BusinessPlanSection,
    MarketingCopyRequest,
    TextRewritingRequest,
    AcademicArticleRequest,
    ArticlePlan,
    ArticleSection,
    CodeGenerationRequest,
    CodeAnalysisResult,
    ThesisSectionInput,
    PersonalAnalysisRequest,
    ChatMessage,
    GenerationRecord,
    AudioScriptRequest,
    Specialist,
} from '../types';

const BACKEND_URL = 'https://ai-service-backend-8lea.onrender.com';

// #region API Call Helpers
async function handleResponse(response: Response) {
    if (!response.ok) {
        const errorText = await response.text();
        // Try to parse as JSON for more detailed errors from backend
        try {
            const errorJson = JSON.parse(errorText);
            throw new Error(errorJson.error || `Backend error: ${response.status} ${response.statusText}`);
        } catch (e) {
            throw new Error(errorText || `Backend error: ${response.status} ${response.statusText}`);
        }
    }
    return response.json();
}

async function apiCall(operation: string, payload: any): Promise<any> {
    const response = await fetch(`${BACKEND_URL}/api/json`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ operation, payload }),
    });
    return handleResponse(response);
}

async function apiCallWithFiles(operation: string, payload: any, files: File[]): Promise<any> {
    const formData = new FormData();
    formData.append('operation', operation);
    formData.append('payload', JSON.stringify(payload));
    files.forEach(file => formData.append('files', file));

    const response = await fetch(`${BACKEND_URL}/api/files`, {
        method: 'POST',
        body: formData,
    });
    return handleResponse(response);
}
// #endregion

// #region Helper Functions
export const calculateTextMetrics = (text: string): { tokenCount: number; pageCount: number } => {
    if (!text) {
        return { tokenCount: 0, pageCount: 0 };
    }
    const tokenCount = Math.ceil(text.length / 4);
    const wordCount = text.split(/\s+/).filter(Boolean).length;
    const pageCount = parseFloat((wordCount / 500).toFixed(1)); // 500 words per page approx.
    return { tokenCount, pageCount };
};

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
// #endregion

// #region Chat Functions
interface ChatContext {
    assistant: 'mirra' | 'dary';
    history: ChatMessage[];
    settings: { internetEnabled: boolean; memoryEnabled: boolean };
}

interface SpecialistChatContext {
    specialist: Specialist;
    history: ChatMessage[];
}

export const sendMessage = async (
    chatContext: ChatContext,
    message: string,
    attachment?: GenerationRecord
): Promise<{ text: string, sources?: any[] }> => {
    return apiCall('sendMessage', { chatContext, message, attachment });
};

export const sendSpecialistMessage = async (
    chatContext: SpecialistChatContext,
    message: string,
): Promise<{ text: string, sources?: any[] }> => {
    return apiCall('sendSpecialistMessage', { chatContext, message });
}
// #endregion

// #region Public Service Functions

// Student / Standard Generation
export const generateText = (docType: DocumentType, topic: string, age: number, onProgressUpdate?: (message: string) => void): Promise<GenerationResult> => {
    onProgressUpdate?.('Отправка запроса на сервер...');
    return apiCall('generateText', { docType, topic, age });
};

// Astrology
export const generateNatalChart = (date: string, time: string, place: string, onProgressUpdate?: (message: string) => void): Promise<GenerationResult> => {
    onProgressUpdate?.('Создаем карту...');
    return apiCall('generateNatalChart', { date, time, place });
};

export const generateHoroscope = (date: string, onProgressUpdate?: (message: string) => void): Promise<GenerationResult> => {
    onProgressUpdate?.('Составляем прогноз...');
    return apiCall('generateHoroscope', { date });
};

// Book Writing
export const generateBookPlan = (request: BookPlanRequest, onProgressUpdate?: (message: string) => void): Promise<BookPlan> => {
    onProgressUpdate?.('Продумываем сюжет...');
    return apiCall('generateBookPlan', request);
};

export const generateSingleChapter = (chapter: BookChapter, bookTitle: string, genre: string, style: string, readerAge: number): Promise<string> => {
    return apiCall('generateSingleChapter', { chapter, bookTitle, genre, style, readerAge }).then(res => res.text);
};

// File Tasks
export const solveTaskFromFiles = (files: File[], prompt: string, docType: DocumentType, onProgressUpdate?: (message: string) => void): Promise<GenerationResult> => {
    onProgressUpdate?.('Отправка файлов на сервер...');
    return apiCallWithFiles('solveTaskFromFiles', { prompt, docType }, files);
};

export const analyzeScienceTaskFromFiles = (files: File[], prompt: string, docType: DocumentType, onProgressUpdate?: (message: string) => void): Promise<GenerationResult> => {
    onProgressUpdate?.('Отправка файлов на сервер...');
    return apiCallWithFiles('analyzeScienceTaskFromFiles', { prompt, docType }, files);
};

export const analyzeCreativeTaskFromFiles = (files: File[], text: string, prompt: string, docType: DocumentType, onProgressUpdate?: (message: string) => void): Promise<GenerationResult> => {
    onProgressUpdate?.('Отправка файлов на сервер...');
    return apiCallWithFiles('analyzeCreativeTaskFromFiles', { text, prompt, docType }, files);
};

export const analyzeUserDocuments = (files: File[], prompt: string, onProgressUpdate?: (message: string) => void): Promise<GenerationResult> => {
    onProgressUpdate?.('Отправка файлов на сервер...');
    return apiCallWithFiles('analyzeUserDocuments', { prompt }, files);
};

// Business
export const generateSwotAnalysis = (request: SwotAnalysisRequest, onProgressUpdate?: (message: string) => void): Promise<GenerationResult> => {
    onProgressUpdate?.('Проводим SWOT-анализ...');
    return apiCall('generateSwotAnalysis', request);
};

export const generateCommercialProposal = (request: CommercialProposalRequest, onProgressUpdate?: (message: string) => void): Promise<GenerationResult> => {
    onProgressUpdate?.('Составляем коммерческое предложение...');
    return apiCall('generateCommercialProposal', request);
};

export const generateBusinessPlan = (request: BusinessPlanRequest, onProgressUpdate?: (message: string) => void): Promise<BusinessPlan> => {
    onProgressUpdate?.('Создаем структуру бизнес-плана...');
    return apiCall('generateBusinessPlan', request);
};

export const generateSingleBusinessSection = (section: BusinessPlanSection, planTitle: string, industry: string): Promise<string> => {
    return apiCall('generateSingleBusinessSection', { section, planTitle, industry }).then(res => res.text);
};

export const generateMarketingCopy = (request: MarketingCopyRequest, onProgressUpdate?: (message: string) => void): Promise<GenerationResult> => {
    onProgressUpdate?.('Создаем маркетинговый текст...');
    return apiCall('generateMarketingCopy', request);
};

// Creative
export const rewriteText = (request: TextRewritingRequest, file: File | null, onProgressUpdate?: (message: string) => void): Promise<GenerationResult> => {
    onProgressUpdate?.('Перерабатываем ваш текст...');
    if (file) {
        return apiCallWithFiles('rewriteText', request, [file]);
    }
    return apiCall('rewriteText', request);
};

export const generateAudioScript = (request: AudioScriptRequest, onProgressUpdate?: (message: string) => void): Promise<GenerationResult> => {
    onProgressUpdate?.('Создаем ваш аудио-сценарий...');
    return apiCall('generateAudioScript', request);
};

// Science
export const generateArticlePlan = (request: AcademicArticleRequest, onProgressUpdate?: (message: string) => void): Promise<ArticlePlan> => {
    onProgressUpdate?.('Создаем структуру научной статьи...');
    return apiCall('generateArticlePlan', request);
};

export const generateGrantPlan = (request: AcademicArticleRequest, file: File | null, onProgressUpdate?: (message: string) => void): Promise<ArticlePlan> => {
     onProgressUpdate?.('Создаем структуру для гранта...');
     if (file) {
        return apiCallWithFiles('generateGrantPlan', request, [file]);
     }
     return apiCall('generateGrantPlan', request);
};

export const generateSingleArticleSection = (section: ArticleSection, planTitle: string, field: string): Promise<string> => {
    return apiCall('generateSingleArticleSection', { section, planTitle, field }).then(res => res.text);
};

// Thesis
export const generateFullThesis = async (topic: string, field: string, sections: ThesisSectionInput[], onProgressUpdate?: (message: string) => void): Promise<GenerationResult> => {
    let fullText = `# Дипломная работа\n## Тема: ${topic}\n\n`;

    const sectionsToGenerate = sections.filter(s => s.contentType === 'generate');
    const sectionsWithContent = sections.filter(s => s.contentType !== 'generate' && s.contentType !== 'skip');
    
    // Batch generate sections
    if (sectionsToGenerate.length > 0) {
        onProgressUpdate?.('Генерация разделов...');
        const generatedSections = await apiCall('generateThesisSections', { topic, field, sections: sectionsToGenerate });

        sections.forEach(section => {
             if (section.contentType === 'skip') return;

             fullText += `\n\n### ${section.title}\n\n`;

             const generated = generatedSections.find((gs: any) => gs.id === section.id);
             if (generated) {
                fullText += generated.text;
             } else if (section.contentType === 'text') {
                fullText += section.content;
             } else if (section.contentType === 'file' && section.file) {
                // This part is tricky. Backend needs to handle file-to-text conversion.
                // Assuming backend can receive a mix of generation requests and pre-uploaded file IDs.
                // For simplicity here, we assume file content is handled by a different mechanism or manually inserted.
                // A more robust solution would involve uploading files first and passing their IDs.
                fullText += `[Содержимое файла ${section.file.name} будет вставлено здесь]`;
             }
        });

    } else { // Handle only local content if no generation is needed
        sections.forEach(section => {
            if (section.contentType === 'skip') return;
            fullText += `\n\n### ${section.title}\n\n`;
            if (section.contentType === 'text') {
                fullText += section.content;
            } else if (section.contentType === 'file' && section.file) {
                 fullText += `[Содержимое файла ${section.file.name} будет вставлено здесь]`;
            }
        });
    }

    const metrics = calculateTextMetrics(fullText);
    return { docType: DocumentType.THESIS, text: fullText, tokenCount: metrics.tokenCount, pageCount: metrics.pageCount, uniqueness: 0 };
};


// Code
export const analyzeCodeTask = (request: CodeGenerationRequest, onProgressUpdate?: (message: string) => void): Promise<CodeAnalysisResult> => {
    onProgressUpdate?.('Анализируем вашу задачу...');
    return apiCall('analyzeCodeTask', request);
};
export const generateCode = (request: CodeGenerationRequest, onProgressUpdate?: (message: string) => void): Promise<GenerationResult> => {
    onProgressUpdate?.('Генерация кода...');
    return apiCall('generateCode', request);
};

// Personal Analysis
export const generatePersonalAnalysis = (request: PersonalAnalysisRequest, onProgressUpdate?: (message: string) => void): Promise<GenerationResult> => {
    onProgressUpdate?.('Проводим личностный анализ...');
    return apiCall('generatePersonalAnalysis', request);
};

// Analysis
export const performAnalysis = (files: File[], prompt: string, docType: DocumentType, onProgressUpdate?: (message: string) => void): Promise<GenerationResult> => {
    onProgressUpdate?.('Проводим анализ...');
    return apiCallWithFiles('performAnalysis', { prompt, docType }, files);
};

// Forecasting
export const generateForecasting = (prompt: string, onProgressUpdate?: (message: string) => void): Promise<GenerationResult> => {
    onProgressUpdate?.('Собираем данные для прогноза...');
    return apiCall('generateForecasting', { prompt });
};

// Mermaid to Table
export const convertMermaidToTable = async (brokenCode: string): Promise<string> => {
    const result = await apiCall('convertMermaidToTable', { brokenCode });
    return result.text;
};

// #endregion