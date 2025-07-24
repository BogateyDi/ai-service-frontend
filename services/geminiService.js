import { DocumentType } from '../types.js';

const BACKEND_URL = 'https://ai-service-backend-8lea.onrender.com';

// #region API Call Helpers
async function handleResponse(response) {
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

async function apiCall(operation, payload) {
    const response = await fetch(`${BACKEND_URL}/api/json`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ operation, payload }),
    });
    return handleResponse(response);
}

async function apiCallWithFiles(operation, payload, files) {
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
export const calculateTextMetrics = (text) => {
    if (!text) {
        return { tokenCount: 0, pageCount: 0 };
    }
    const tokenCount = Math.ceil(text.length / 4);
    const wordCount = text.split(/\s+/).filter(Boolean).length;
    const pageCount = parseFloat((wordCount / 500).toFixed(1)); // 500 words per page approx.
    return { tokenCount, pageCount };
};

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));
// #endregion

// #region Chat Functions
export const sendMessage = async (
    chatContext,
    message,
    attachment
) => {
    return apiCall('sendMessage', { chatContext, message, attachment });
};

export const sendSpecialistMessage = async (
    chatContext,
    message,
) => {
    return apiCall('sendSpecialistMessage', { chatContext, message });
}
// #endregion

// #region Public Service Functions

// Student / Standard Generation
export const generateText = (docType, topic, age, onProgressUpdate) => {
    onProgressUpdate?.('Отправка запроса на сервер...');
    return apiCall('generateText', { docType, topic, age });
};

// Astrology
export const generateNatalChart = (date, time, place, onProgressUpdate) => {
    onProgressUpdate?.('Создаем карту...');
    return apiCall('generateNatalChart', { date, time, place });
};

export const generateHoroscope = (date, onProgressUpdate) => {
    onProgressUpdate?.('Составляем прогноз...');
    return apiCall('generateHoroscope', { date });
};

// Book Writing
export const generateBookPlan = (request, onProgressUpdate) => {
    onProgressUpdate?.('Продумываем сюжет...');
    return apiCall('generateBookPlan', request);
};

export const generateSingleChapter = (chapter, bookTitle, genre, style, readerAge) => {
    return apiCall('generateSingleChapter', { chapter, bookTitle, genre, style, readerAge }).then(res => res.text);
};

// File Tasks
export const solveTaskFromFiles = (files, prompt, docType, onProgressUpdate) => {
    onProgressUpdate?.('Отправка файлов на сервер...');
    return apiCallWithFiles('solveTaskFromFiles', { prompt, docType }, files);
};

export const analyzeScienceTaskFromFiles = (files, prompt, docType, onProgressUpdate) => {
    onProgressUpdate?.('Отправка файлов на сервер...');
    return apiCallWithFiles('analyzeScienceTaskFromFiles', { prompt, docType }, files);
};

export const analyzeCreativeTaskFromFiles = (files, prompt, docType, onProgressUpdate) => {
    onProgressUpdate?.('Отправка файлов на сервер...');
    return apiCallWithFiles('analyzeCreativeTaskFromFiles', { prompt, docType }, files);
};

export const analyzeUserDocuments = (files, prompt, onProgressUpdate) => {
    onProgressUpdate?.('Отправка файлов на сервер...');
    return apiCallWithFiles('analyzeUserDocuments', { prompt }, files);
};

// Business
export const generateSwotAnalysis = (request, onProgressUpdate) => {
    onProgressUpdate?.('Проводим SWOT-анализ...');
    return apiCall('generateSwotAnalysis', request);
};

export const generateCommercialProposal = (request, onProgressUpdate) => {
    onProgressUpdate?.('Составляем коммерческое предложение...');
    return apiCall('generateCommercialProposal', request);
};

export const generateBusinessPlan = (request, onProgressUpdate) => {
    onProgressUpdate?.('Создаем структуру бизнес-плана...');
    return apiCall('generateBusinessPlan', request);
};

export const generateSingleBusinessSection = (section, planTitle, industry) => {
    return apiCall('generateSingleBusinessSection', { section, planTitle, industry }).then(res => res.text);
};

export const generateMarketingCopy = (request, onProgressUpdate) => {
    onProgressUpdate?.('Создаем маркетинговый текст...');
    return apiCall('generateMarketingCopy', request);
};

// Creative
export const rewriteText = (request, file, onProgressUpdate) => {
    onProgressUpdate?.('Перерабатываем ваш текст...');
    if (file) {
        return apiCallWithFiles('rewriteText', request, [file]);
    }
    return apiCall('rewriteText', request);
};

export const generateAudioScript = (request, onProgressUpdate) => {
    onProgressUpdate?.('Создаем ваш аудио-сценарий...');
    return apiCall('generateAudioScript', request);
};

// Science
export const generateArticlePlan = (request, onProgressUpdate) => {
    onProgressUpdate?.('Создаем структуру научной статьи...');
    return apiCall('generateArticlePlan', request);
};

export const generateGrantPlan = (request, file, onProgressUpdate) => {
     onProgressUpdate?.('Создаем структуру для гранта...');
     if (file) {
        return apiCallWithFiles('generateGrantPlan', request, [file]);
     }
     return apiCall('generateGrantPlan', request);
};

export const generateSingleArticleSection = (section, planTitle, field) => {
    return apiCall('generateSingleArticleSection', { section, planTitle, field }).then(res => res.text);
};

// Thesis
export const generateFullThesis = async (topic, field, sections, onProgressUpdate) => {
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

             const generated = generatedSections.find((gs) => gs.id === section.id);
             if (generated) {
                fullText += generated.text;
             } else if (section.contentType === 'text') {
                fullText += section.content;
             } else if (section.contentType === 'file' && section.file) {
                // This part is tricky. Backend needs to handle file-to-text conversion.
                // Assuming backend can receive a mix of generation requests and pre-uploaded file IDs.
                // For simplicity here, we assume file content is handled by a different mechanism or manually inserted.
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
export const analyzeCodeTask = (request, onProgressUpdate) => {
    onProgressUpdate?.('Анализируем вашу задачу...');
    return apiCall('analyzeCodeTask', request);
};
export const generateCode = (request, onProgressUpdate) => {
    onProgressUpdate?.('Генерация кода...');
    return apiCall('generateCode', request);
};

// Personal Analysis
export const generatePersonalAnalysis = (request, onProgressUpdate) => {
    onProgressUpdate?.('Проводим личностный анализ...');
    return apiCall('generatePersonalAnalysis', request);
};

// Analysis
export const performAnalysis = (files, prompt, docType, onProgressUpdate) => {
    onProgressUpdate?.('Проводим анализ...');
    return apiCallWithFiles('performAnalysis', { prompt, docType }, files);
};

// Forecasting
export const generateForecasting = (prompt, onProgressUpdate) => {
    onProgressUpdate?.('Собираем данные для прогноза...');
    return apiCall('generateForecasting', { prompt });
};

// Mermaid to Table
export const convertMermaidToTable = async (brokenCode) => {
    const result = await apiCall('convertMermaidToTable', { brokenCode });
    return result.text;
};

// #endregion