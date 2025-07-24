import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { Toaster, toast } from 'react-hot-toast';
import { 
    GenerationResult, BookPlanRequest, BookPlan, AstrologyStep, BookWritingStep, 
    FileTaskStep, DocumentType, BusinessStep, SwotAnalysisRequest, 
    CommercialProposalRequest, BusinessPlanRequest, BusinessPlan, CreativeStep,
    TextRewritingRequest, ScienceStep, ArticlePlan, AcademicArticleRequest, CodeStep, CodeGenerationRequest, MarketingCopyRequest, ArticleSection,
    CodeAnalysisResult,
    ThesisStep,
    ThesisSectionInput,
    ScienceFileStep,
    PersonalAnalysisStep,
    PersonalAnalysisRequest,
    DocAnalysisStep,
    ConsultationStep,
    TutorStep,
    Specialist,
    ChatMessage,
    BookChapter,
    AudioScriptRequest,
    AnalysisStep,
    ForecastingStep
} from '../types';
import { BOOK_GENRES, BOOK_STYLES, MARKETING_TEXT_TYPES, TONE_OF_VOICE_OPTIONS, REWRITING_GOALS, REWRITING_STYLES, PROGRAMMING_LANGUAGES, SPECIALISTS, TUTOR_SUBJECTS, AUDIO_SCRIPT_TYPES, AUDIO_VOICE_PROFILES } from '../constants';

import FileUploadForm from './FileUploadForm';
import { ThesisForm } from './ThesisForm';
import { MermaidDiagram } from './MermaidDiagram';


interface ResultDisplayProps {
  result: GenerationResult | null;
  isLoading: boolean;
  error: string | null;
  isLoggedIn: boolean;
  remainingGenerations: number;
  hasMirra: boolean;
  onShareWithMirra: (result: GenerationResult) => void;
  hasDary: boolean;
  onShareWithDary: (result: GenerationResult) => void;
  onSaveGeneration: (record: { docType: DocumentType; title: string; text: string; }) => void;
  onBuyGenerations: () => void;
  useGeneration: (cost?: number) => boolean;
  docType: DocumentType;
  onConvertToTable: (brokenCode: string) => void;
  // Astrology Flow
  astrologyStep: AstrologyStep;
  onAstrologySelect: (type: 'natal' | 'horoscope') => void;
  onNatalSubmit: (data: { date: string, time: string, place: string }) => void;
  onHoroscopeSubmit: (data: { date: string }) => void;
  // Book Writing Flow
  bookWritingStep: BookWritingStep;
  bookPlan: BookPlan | null;
  onPlanSubmit: (request: BookPlanRequest) => void;
  onGenerateBook: (plan: BookPlan) => void;
  // Personal Analysis Flow
  personalAnalysisStep: PersonalAnalysisStep;
  onPersonalAnalysisSubmit: (request: PersonalAnalysisRequest) => void;
  // Doc Analysis Flow
  docAnalysisStep: DocAnalysisStep;
  onDocAnalysisSubmit: (files: File[], prompt: string) => void;
  // Consultation Flow
  consultationStep: ConsultationStep;
  onSpecialistSelect: (specialist: Specialist) => void;
  selectedSpecialist: Specialist | null;
  chatMessages: ChatMessage[];
  onSendMessage: (message: string) => void;
  // Tutor Flow
  tutorStep: TutorStep;
  onSubjectSelect: (subject: string) => void;
  selectedSubject: string | null;
  tutorChatMessages: ChatMessage[];
  onTutorSendMessage: (message: string) => void;
  // File Task Flow
  fileTaskStep: FileTaskStep;
  onFileTaskSubmit: (files: File[], prompt:string) => void;
  // Business Flow
  businessStep: BusinessStep;
  businessPlan: BusinessPlan | null;
  onSwotSubmit: (request: SwotAnalysisRequest) => void;
  onCommercialProposalSubmit: (request: CommercialProposalRequest) => void;
  onBusinessPlanSubmit: (request: BusinessPlanRequest) => void;
  onGenerateBusinessPlan: (plan: BusinessPlan) => void;
  onMarketingSubmit: (request: MarketingCopyRequest) => void;
  // Creative Flow
  creativeStep: CreativeStep;
  onRewritingSubmit: (request: TextRewritingRequest, file: File | null) => void;
  onCreativeFileTaskSubmit: (files: File[], text: string, prompt: string) => void;
  onAudioScriptTopicSubmit: (topic: string, duration: number) => void;
  onAudioScriptSubmit: (config: Omit<AudioScriptRequest, 'topic' | 'duration'>) => void;
  audioScriptRequest: Partial<AudioScriptRequest>;
  // Science Flow
  scienceStep: ScienceStep;
  articlePlan: ArticlePlan | null;
  onArticlePlanSubmit: (request: AcademicArticleRequest, file?: File | null) => void;
  onGenerateArticle: (plan: ArticlePlan) => void;
  scienceFileStep: ScienceFileStep;
  onScienceFileTaskSubmit: (files: File[], prompt: string) => void;
  // Thesis Flow
  thesisStep: ThesisStep;
  onThesisSubmit: (topic: string, field: string, sections: ThesisSectionInput[]) => void;
  // Analysis Flow
  analysisStep: AnalysisStep;
  onAnalysisSubmit: (files: File[], prompt: string) => void;
  // Forecasting Flow
  forecastingStep: ForecastingStep;
  onForecastSubmit: (prompt: string) => void;
  // Code Flow
  codeStep: CodeStep;
  onCodeSubmit: (request: CodeGenerationRequest) => void;
  onGenerateCode: () => void;
  codeAnalysis: CodeAnalysisResult | null;
  codeRequest: CodeGenerationRequest | null;
  onCancelCodeAnalysis: () => void;
}

interface ResultViewerProps {
    result: GenerationResult;
    hasMirra: boolean;
    onShareWithMirra: (result: GenerationResult) => void;
    hasDary: boolean;
    onShareWithDary: (result: GenerationResult) => void;
    onSaveGeneration: (record: { docType: DocumentType; title: string; text: string; }) => void;
    isLoggedIn: boolean;
    useGeneration: (cost?: number) => boolean;
    onConvertToTable: (brokenCode: string) => void;
}

const MetricBlock: React.FC<{ label: string; value: string | number; unit?: string; }> = ({ label, value, unit }) => (
    <div className="px-2 text-center">
        <p className="text-xs sm:text-sm font-medium text-[var(--text-dark-secondary)] uppercase tracking-wider">{label}</p>
        <p className="text-2xl sm:text-4xl font-bold text-[var(--text-dark-primary)] mt-1">
            {value}
            {unit && <span className="text-lg sm:text-2xl font-semibold ml-1">{unit}</span>}
        </p>
    </div>
);

// --- Parsing and Rendering Logic ---

interface ContentPart {
  type: 'text' | 'code' | 'mermaid' | 'table';
  content: string;
  lang?: string;
}

const parseTextForTables = (textBlock: string): ContentPart[] => {
    const tableParts: ContentPart[] = [];
    // Regex to find Markdown tables
    const tableRegex = /((?:\|[^\n\r]+\|\r?\n)+(?:\|(?: *:?---+:? *\|)+)\r?\n(?:\|[^\n\r]+\|\r?\n?)+)/g;
    let lastIndex = 0;
    let match;

    while ((match = tableRegex.exec(textBlock)) !== null) {
        if (match.index > lastIndex) {
            tableParts.push({ type: 'text', content: textBlock.substring(lastIndex, match.index) });
        }
        tableParts.push({ type: 'table', content: match[0] });
        lastIndex = tableRegex.lastIndex;
    }

    if (lastIndex < textBlock.length) {
        tableParts.push({ type: 'text', content: textBlock.substring(lastIndex) });
    }

    return tableParts.length > 0 ? tableParts : [{ type: 'text', content: textBlock }];
};

const parseContent = (text: string): ContentPart[] => {
    const parts: ContentPart[] = [];
    const codeRegex = /```(mermaid|[\w\s-]+)?\n([\s\S]+?)\n```/g;
    let lastIndex = 0;
    let match;

    while ((match = codeRegex.exec(text)) !== null) {
        if (match.index > lastIndex) {
            parts.push(...parseTextForTables(text.substring(lastIndex, match.index)));
        }
        
        const lang = match[1];
        const content = match[2];
        
        if (lang === 'mermaid') {
            parts.push({ type: 'mermaid', content });
        } else {
            parts.push({ type: 'code', content, lang: lang || '' });
        }
        
        lastIndex = codeRegex.lastIndex;
    }

    if (lastIndex < text.length) {
        parts.push(...parseTextForTables(text.substring(lastIndex)));
    }

    return parts;
};

const MarkdownTable: React.FC<{ markdown: string }> = ({ markdown }) => {
    const rows = markdown.trim().split('\n').filter(Boolean);
    if (rows.length < 2) return <pre>{markdown}</pre>;

    const headerCells = rows[0].split('|').slice(1, -1).map(cell => cell.trim());
    const bodyRows = rows.slice(2).map(row => row.split('|').slice(1, -1).map(cell => cell.trim()));

    return (
        <div className="not-prose overflow-x-auto my-4 border border-gray-200 rounded-lg">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        {headerCells.map((cell, i) => (
                            <th key={i} scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                {cell}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {bodyRows.map((row, i) => (
                        <tr key={i}>
                            {row.map((cell, j) => (
                                <td key={j} className="px-4 py-3 whitespace-normal text-sm text-gray-800">
                                    {cell}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};
// --- End Parsing Logic ---


export const ResultViewer: React.FC<ResultViewerProps> = ({ result, hasMirra, onShareWithMirra, hasDary, onShareWithDary, onSaveGeneration, isLoggedIn, useGeneration, onConvertToTable }) => {
    const copyFullTextToClipboard = () => {
        if(result?.text) {
            navigator.clipboard.writeText(result.text);
            toast.success('Результат скопирован в буфер обмена!');
        }
    }
    
    const copyCodeToClipboard = (code: string) => {
        navigator.clipboard.writeText(code);
        toast.success('Код скопирован в буфер обмена!');
    }
    
    const handleDownload = () => {
        if (result?.text) {
            const blob = new Blob([result.text], { type: 'text/plain;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = 'ai_helper_result.txt';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            toast.success('Файл успешно скачан!');
        }
    };
    
    const handleDownloadDoc = useCallback(() => {
        if (result?.text) {
            const header = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
                <head><meta charset='utf-8'><title>AI-Помощник Результат</title>
                <style>body { font-family: 'Times New Roman', Times, serif; font-size: 12pt; } h1, h2, h3, h4, h5, h6 { font-weight: bold; } pre { white-space: pre-wrap; font-family: 'Courier New', monospace; background-color: #f0f0f0; padding: 10px; border-radius: 5px; } table { border-collapse: collapse; width: 100%; } th, td { border: 1px solid #dddddd; text-align: left; padding: 8px; } th { background-color: #f2f2f2; }</style>
                </head><body>`;
            const footer = "</body></html>";
            
            // Basic markdown to html conversion
            const content = result.text
                .replace(/^### (.*$)/gim, '<h3>$1</h3>')
                .replace(/^## (.*$)/gim, '<h2>$1</h2>')
                .replace(/^# (.*$)/gim, '<h1>$1</h1>')
                .split('\n').map(p => `<p>${p}</p>`).join('');
            
            const sourceHTML = header + content + footer;

            const blob = new Blob([sourceHTML], { type: 'application/msword' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = 'ai_helper_result.doc';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            toast.success('Файл DOC успешно скачан!');
        }
    }, [result]);

    const handleSaveToHistory = () => {
        if (!isLoggedIn) {
            toast.error("Войдите в систему, чтобы сохранять результаты.");
            return;
        }
        if (result?.text) {
            const title = `${result.docType}: ${result.text.slice(0, 40)}...`;
            onSaveGeneration({ docType: result.docType, title, text: result.text });
            toast.success('Результат сохранен в историю!');
        }
    };
    
    const hasMetrics = (result.tokenCount && result.tokenCount > 0) || (result.pageCount && result.pageCount > 0);
    
    const docTypesWithExtraDownloads: DocumentType[] = [
        DocumentType.SWOT_ANALYSIS,
        DocumentType.COMMERCIAL_PROPOSAL,
        DocumentType.BUSINESS_PLAN,
        DocumentType.MARKETING_COPY,
        DocumentType.SCIENTIFIC_RESEARCH,
        DocumentType.THESIS,
        DocumentType.ACADEMIC_ARTICLE,
        DocumentType.GRANT_PROPOSAL,
        DocumentType.TECH_IMPROVEMENT,
        DocumentType.PERSONAL_ANALYSIS,
        DocumentType.ASTROLOGY,
    ];
    const showExtraButtons = docTypesWithExtraDownloads.includes(result.docType);

    const contentParts = useMemo(() => parseContent(result.text), [result.text]);

    const renderContent = () => {
        return contentParts.map((part, index) => {
            switch (part.type) {
                case 'text':
                    return <div key={index} className="whitespace-pre-wrap">{part.content}</div>;
                case 'mermaid':
                    return <MermaidDiagram key={index} chart={part.content} onConvertToTable={() => onConvertToTable(part.content)} />;
                case 'table':
                    return <MarkdownTable key={index} markdown={part.content} />;
                case 'code':
                    return (
                        <div key={index} className="not-prose relative my-4 rounded-lg bg-[var(--bg-dark)] border border-[var(--border-color-dark)]">
                            <button 
                                onClick={() => copyCodeToClipboard(part.content)}
                                className="absolute top-2 right-2 z-10 flex items-center gap-1.5 bg-gray-600/50 text-white text-xs font-semibold py-1 px-2 rounded-md transition-colors hover:bg-gray-500/80"
                            >
                               <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
                                Копировать код
                            </button>
                            <pre className="p-4 pt-8 overflow-x-auto text-sm text-gray-200"><code className="font-mono">{part.content}</code></pre>
                        </div>
                    );
                default:
                    return null;
            }
        });
    };

    const hasCodeOrDiagrams = contentParts.some(p => p.type !== 'text');

    return (
        <div className="h-full flex flex-col gap-4">
            <Toaster/>

            {/* --- TOP BLOCK: METRICS & ACTIONS --- */}
            <div className="flex-shrink-0 space-y-4">
                {hasMetrics && (
                     <div className="p-4 rounded-lg border-2 border-gray-200 bg-gray-50">
                        <div className="grid grid-cols-2 divide-x divide-gray-200">
                             {result.tokenCount && result.tokenCount > 0 && <MetricBlock label="ТОКЕНЫ" value={`~${result.tokenCount}`} />}
                             {result.pageCount && result.pageCount > 0 && <MetricBlock label="СТРАНИЦЫ" value={`≈${result.pageCount}`} />}
                        </div>
                    </div>
                )}
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                     <button 
                        onClick={copyFullTextToClipboard}
                        className="flex-1 flex justify-center items-center gap-2 bg-gray-100 text-[var(--text-dark-primary)] font-semibold py-2.5 px-4 rounded-lg transition-colors hover:bg-gray-200"
                    >
                         <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
                        Копировать {hasCodeOrDiagrams ? 'весь текст' : 'результат'}
                    </button>
                    <button 
                        onClick={handleSaveToHistory}
                        disabled={!isLoggedIn}
                        className="flex-1 flex justify-center items-center gap-2 bg-gray-100 text-[var(--text-dark-primary)] font-semibold py-2.5 px-4 rounded-lg transition-colors hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/></svg>
                        Сохранить в историю
                    </button>
                    <button 
                        onClick={handleDownload} 
                        className="flex-1 flex justify-center items-center gap-2 bg-[var(--accent)] text-white font-semibold py-2.5 px-4 rounded-lg transition-colors hover:bg-[var(--accent-light)]"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
                        Скачать TXT
                    </button>
                    {showExtraButtons && (
                        <>
                            <button
                                onClick={handleDownloadDoc}
                                className="flex-1 flex justify-center items-center gap-2 bg-blue-600 text-white font-semibold py-2.5 px-4 rounded-lg transition-colors hover:bg-blue-700"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>
                                Скачать DOC
                            </button>
                        </>
                    )}
                    {(hasMirra || hasDary) && (
                        <div className={`grid gap-3 ${hasMirra && hasDary ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'} sm:col-span-2`}>
                            {hasMirra && (
                                <button
                                    onClick={() => onShareWithMirra(result)}
                                    className="flex justify-center items-center gap-2 bg-[var(--accent-gold)] text-black font-semibold py-2.5 px-4 rounded-lg transition-colors hover:brightness-110"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                                    Поделиться с Мирраей
                                </button>
                            )}
                            {hasDary && (
                                <button
                                    onClick={() => onShareWithDary(result)}
                                    className="flex justify-center items-center gap-2 bg-[var(--accent)] text-white font-semibold py-2.5 px-4 rounded-lg transition-colors hover:bg-[var(--accent-light)]"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                                    Поделиться с Дарием
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>
            
             {/* --- CONTENT AREA --- */}
            <div className="prose prose-sm sm:prose-base max-w-none flex-grow min-h-0 overflow-y-auto bg-gray-50 p-4 sm:p-6 rounded-md border-2 border-[var(--bg-dark)]">
                {renderContent()}
            </div>

        </div>
    );
};

const QuotaErrorDisplay: React.FC<{ onBuyGenerations: () => void; }> = ({ onBuyGenerations }) => {
    return (
        <div className="flex flex-col items-center justify-center h-full text-center text-red-800 bg-red-50 p-6 rounded-lg border-2 border-red-200">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-shield-alert mb-4"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M12 8v4"/><path d="M12 16h.01"/></svg>
            <h3 className="text-xl font-semibold">Лимит запросов исчерпан</h3>
            <p className="mt-2 text-sm text-red-700 max-w-md">
                Вы превысили вашу текущую квоту для API. Это может произойти, если вы используете бесплатный тариф с ограничением на количество запросов в минуту или в день.
            </p>
            <p className="mt-4 text-sm text-red-700 max-w-md">
                Для продолжения работы вы можете подождать или приобрести пакет с большим количеством генераций.
            </p>
            <button
                onClick={onBuyGenerations}
                className="mt-6 bg-[var(--accent)] text-white font-semibold py-2 px-6 rounded-lg transition-colors hover:bg-[var(--accent-light)]"
            >
                Купить генерации
            </button>
        </div>
    );
};

const ApiKeyErrorDisplay: React.FC = () => {
    return (
        <div className="flex flex-col items-center justify-center h-full text-center text-red-800 bg-red-50 p-6 rounded-lg border-2 border-red-200">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-key-round mb-4">
                <path d="M2 18v3c0 .6.4 1 1 1h4v-3h3v-3h2l1.4-1.4a6.5 6.5 0 1 0-4-4Z"/>
                <circle cx="16.5" cy="7.5" r=".5" fill="currentColor"/>
            </svg>
            <h3 className="text-xl font-semibold">Ошибка ключа API</h3>
            <p className="mt-2 text-sm text-red-700 max-w-md">
                Ключ API, используемый этим приложением, недействителен. Пожалуйста, обратитесь к администратору для решения проблемы.
            </p>
            <p className="mt-4 text-xs text-red-700 max-w-md">
                (Причина: API_KEY_INVALID)
            </p>
        </div>
    );
}

// --- Astrology Sub-components ---

const AstrologySelection: React.FC<{ onSelect: (type: 'natal' | 'horoscope') => void }> = ({ onSelect }) => (
    <div className="flex flex-col items-center justify-center h-full text-center">
        <h3 className="text-xl font-semibold mb-6">Выберите астрологическую услугу</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-lg">
            <button onClick={() => onSelect('natal')} className="p-6 bg-gray-50 hover:bg-[var(--accent-soft)] rounded-lg border-2 border-gray-200 hover:border-[var(--accent)] transition-all">
                <h4 className="font-bold text-lg text-[var(--text-dark-primary)]">Натальная карта</h4>
                <p className="text-sm text-[var(--text-dark-secondary)] mt-1">Полный разбор личности по дате, времени и месту рождения.</p>
                <p className="text-sm font-semibold text-[var(--accent)] mt-3">Стоимость: 2 генерации</p>
            </button>
            <button onClick={() => onSelect('horoscope')} className="p-6 bg-gray-50 hover:bg-[var(--accent-soft)] rounded-lg border-2 border-gray-200 hover:border-[var(--accent)] transition-all">
                <h4 className="font-bold text-lg text-[var(--text-dark-primary)]">Гороскоп</h4>
                <p className="text-sm text-[var(--text-dark-secondary)] mt-1">Прогноз на день, месяц и год на основе даты рождения.</p>
                <p className="text-sm font-semibold text-[var(--accent)] mt-3">Стоимость: 1 генерация</p>
            </button>
        </div>
    </div>
);

const NatalChartForm: React.FC<{ onSubmit: (data: { date: string, time: string, place: string }) => void }> = ({ onSubmit }) => {
    const [date, setDate] = useState('');
    const [time, setTime] = useState('');
    const [place, setPlace] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (date && time && place) {
            onSubmit({ date, time, place });
        } else {
            toast.error("Пожалуйста, заполните все поля.");
        }
    };
    
    return (
        <form onSubmit={handleSubmit} className="flex flex-col items-center justify-center h-full text-center p-4">
             <h3 className="text-xl font-semibold mb-6">Данные для натальной карты</h3>
             <div className="space-y-4 w-full max-w-sm">
                <div>
                    <label htmlFor="natal-date" className="block text-sm text-left font-medium text-[var(--text-dark-secondary)] mb-1">Дата рождения</label>
                    <input id="natal-date" type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full bg-gray-50 border-2 border-gray-200 rounded-lg p-3 focus:outline-none focus:border-[var(--accent)]" required />
                </div>
                <div>
                    <label htmlFor="natal-time" className="block text-sm text-left font-medium text-[var(--text-dark-secondary)] mb-1">Время рождения</label>
                    <input id="natal-time" type="time" value={time} onChange={e => setTime(e.target.value)} className="w-full bg-gray-50 border-2 border-gray-200 rounded-lg p-3 focus:outline-none focus:border-[var(--accent)]" required />
                </div>
                <div>
                    <label htmlFor="natal-place" className="block text-sm text-left font-medium text-[var(--text-dark-secondary)] mb-1">Место рождения (город)</label>
                    <input id="natal-place" type="text" value={place} onChange={e => setPlace(e.target.value)} placeholder="Например: Москва" className="w-full bg-gray-50 border-2 border-gray-200 rounded-lg p-3 focus:outline-none focus:border-[var(--accent)]" required />
                </div>
             </div>
             <button type="submit" className="mt-6 w-full max-w-sm bg-[var(--accent)] text-white font-semibold py-3 px-4 rounded-lg transition-all hover:bg-[var(--accent-light)]">
                 Сгенерировать карту
            </button>
        </form>
    );
};

const HoroscopeForm: React.FC<{ onSubmit: (data: { date: string }) => void }> = ({ onSubmit }) => {
    const [date, setDate] = useState('');
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (date) {
            onSubmit({ date });
        } else {
             toast.error("Пожалуйста, укажите дату рождения.");
        }
    };

    return (
        <form onSubmit={handleSubmit} className="flex flex-col items-center justify-center h-full text-center p-4">
            <h3 className="text-xl font-semibold mb-6">Данные для гороскопа</h3>
            <div className="w-full max-w-sm">
                <label htmlFor="horoscope-date" className="block text-sm font-medium text-[var(--text-dark-secondary)] mb-2">
                    Укажите вашу дату рождения
                </label>
                <input 
                    id="horoscope-date"
                    type="date" 
                    value={date} 
                    onChange={e => setDate(e.target.value)} 
                    className="w-full bg-gray-50 border-2 border-gray-200 rounded-lg p-3 focus:outline-none focus:border-[var(--accent)]" 
                    required 
                />
            </div>
            <button type="submit" className="mt-6 w-full max-w-sm bg-[var(--accent)] text-white font-semibold py-3 px-4 rounded-lg transition-all hover:bg-[var(--accent-light)]">
                Получить гороскоп
            </button>
        </form>
    );
};

// --- Book Writing Sub-components ---

const BookPlanForm: React.FC<{ onSubmit: (data: BookPlanRequest) => void }> = ({ onSubmit }) => {
    const [genre, setGenre] = useState(BOOK_GENRES[0]);
    const [style, setStyle] = useState(BOOK_STYLES[0]);
    const [chaptersCount, setChaptersCount] = useState(10);
    const [userPrompt, setUserPrompt] = useState('');
    const [readerAge, setReaderAge] = useState(14);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (chaptersCount > 0 && chaptersCount <= 30 && readerAge >= 5 && readerAge <= 100) {
            onSubmit({ genre, style, chaptersCount, userPrompt, readerAge });
        } else {
            toast.error("Количество глав: 1-30, Возраст: 5-100.");
        }
    };
    
    return (
        <form onSubmit={handleSubmit} className="flex flex-col h-full text-left p-2">
             <h3 className="text-xl font-semibold mb-6 text-center">Планирование книги</h3>
             <div className="flex-grow space-y-4 overflow-y-auto pr-2">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                         <label className="block text-sm font-medium text-[var(--text-dark-secondary)] mb-1">Жанр</label>
                         <select value={genre} onChange={e => setGenre(e.target.value)} className="w-full bg-gray-50 border-2 border-gray-200 rounded-lg p-3 focus:outline-none focus:border-[var(--accent)]">
                            {BOOK_GENRES.map(g => <option key={g} value={g}>{g}</option>)}
                         </select>
                    </div>
                     <div>
                         <label className="block text-sm font-medium text-[var(--text-dark-secondary)] mb-1">Стиль</label>
                         <select value={style} onChange={e => setStyle(e.target.value)} className="w-full bg-gray-50 border-2 border-gray-200 rounded-lg p-3 focus:outline-none focus:border-[var(--accent)]">
                            {BOOK_STYLES.map(s => <option key={s} value={s}>{s}</option>)}
                         </select>
                    </div>
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div>
                        <label className="block text-sm font-medium text-[var(--text-dark-secondary)] mb-1">Количество глав (1-30)</label>
                        <input type="number" value={chaptersCount} onChange={e => setChaptersCount(parseInt(e.target.value, 10))} min="1" max="30" className="w-full bg-gray-50 border-2 border-gray-200 rounded-lg p-3 focus:outline-none focus:border-[var(--accent)]" required />
                     </div>
                     <div>
                        <label className="block text-sm font-medium text-[var(--text-dark-secondary)] mb-1">Возраст читателя (5-100)</label>
                        <input type="number" value={readerAge} onChange={e => setReaderAge(parseInt(e.target.value, 10))} min="5" max="100" className="w-full bg-gray-50 border-2 border-gray-200 rounded-lg p-3 focus:outline-none focus:border-[var(--accent)]" required />
                     </div>
                 </div>
                 <div>
                    <label className="block text-sm font-medium text-[var(--text-dark-secondary)] mb-1">Пояснения и пожелания</label>
                    <textarea value={userPrompt} onChange={e => setUserPrompt(e.target.value)} placeholder="Опишите главную идею, персонажей, ключевые моменты сюжета..." rows={5} className="w-full bg-gray-50 border-2 border-gray-200 rounded-lg p-3 focus:outline-none focus:border-[var(--accent)] resize-none" />
                 </div>
             </div>
             <div className="flex-shrink-0 pt-4 text-center">
                <p className="text-sm text-[var(--text-dark-secondary)] mb-3">Стоимость: 1 генерация</p>
                <button type="submit" className="w-full max-w-sm bg-[var(--accent)] text-white font-semibold py-3 px-4 rounded-lg transition-all hover:bg-[var(--accent-light)]">
                     Создать план книги
                </button>
             </div>
        </form>
    )
};

const BookPlanReview: React.FC<{ initialPlan: BookPlan, onGenerate: (editedPlan: BookPlan) => void }> = ({ initialPlan, onGenerate }) => {
    const [editedPlan, setEditedPlan] = useState<BookPlan>(initialPlan);

    useEffect(() => {
        setEditedPlan(initialPlan);
    }, [initialPlan]);

    const handlePlanChange = <K extends keyof BookPlan>(key: K, value: BookPlan[K]) => {
        setEditedPlan(prev => ({ ...prev, [key]: value }));
    };
    
    const handleChapterChange = (index: number, field: keyof BookChapter, value: string) => {
        const newChapters = [...editedPlan.chapters];
        newChapters[index] = { ...newChapters[index], [field]: value };
        handlePlanChange('chapters', newChapters);
    };

    const handleGenerateClick = () => {
        onGenerate(editedPlan);
    };

    return (
        <div className="flex flex-col h-full text-left">
            <h3 className="text-xl font-semibold mb-2 text-center">План книги (редактируемый)</h3>
            <div className="flex-grow overflow-y-auto space-y-4 p-4 bg-gray-50 rounded-lg border-2 border-gray-200">
                <div>
                    <label className="block text-sm font-medium text-[var(--text-dark-primary)] font-bold mb-1">Название книги</label>
                    <input 
                        type="text" 
                        value={editedPlan.title}
                        onChange={(e) => handlePlanChange('title', e.target.value)}
                        className="w-full bg-white border-2 border-gray-200 rounded-lg p-3 focus:outline-none focus:border-[var(--accent)]"
                    />
                </div>
                <hr/>
                {editedPlan.chapters.map((chapter, index) => (
                    <div key={index} className="p-4 bg-white rounded-md shadow-sm border border-gray-200 space-y-3">
                        <h4 className="font-bold text-[var(--text-dark-primary)]">Глава {index + 1}</h4>
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Название главы</label>
                            <input 
                                type="text"
                                value={chapter.title}
                                onChange={(e) => handleChapterChange(index, 'title', e.target.value)}
                                className="w-full bg-white border border-gray-300 rounded-lg p-2 focus:outline-none focus:border-[var(--accent)] text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Краткое описание</label>
                             <textarea 
                                value={chapter.description}
                                onChange={(e) => handleChapterChange(index, 'description', e.target.value)}
                                rows={2}
                                className="w-full bg-white border border-gray-300 rounded-lg p-2 resize-none focus:outline-none focus:border-[var(--accent)] text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Инструкции для генерации (детально)</label>
                             <textarea 
                                value={chapter.generationPrompt}
                                onChange={(e) => handleChapterChange(index, 'generationPrompt', e.target.value)}
                                rows={4}
                                className="w-full bg-white border border-gray-300 rounded-lg p-2 resize-none focus:outline-none focus:border-[var(--accent)] text-sm"
                            />
                        </div>
                    </div>
                ))}
            </div>
             <div className="flex-shrink-0 pt-4 text-center">
                <p className="text-sm text-[var(--text-dark-secondary)] mb-3">Стоимость генерации полного текста: <span className="font-bold">{editedPlan.chapters.length}</span> генераций</p>
                <button onClick={handleGenerateClick} className="w-full max-w-sm bg-[var(--accent-life)] text-white font-semibold py-3 px-4 rounded-lg transition-all hover:bg-[var(--accent-life-dark)]">
                     Написать книгу по этому плану
                </button>
             </div>
        </div>
    );
};

// --- Personal Analysis Sub-component ---
const PersonalAnalysisForm: React.FC<{ onSubmit: (request: PersonalAnalysisRequest) => void }> = ({ onSubmit }) => {
    const [gender, setGender] = useState<'male' | 'female' | null>(null);
    const [userPrompt, setUserPrompt] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!gender) {
            toast.error("Пожалуйста, выберите ваш пол.");
            return;
        }
        if (!userPrompt.trim()) {
            toast.error("Пожалуйста, опишите ваш запрос.");
            return;
        }
        onSubmit({ gender, userPrompt });
    };

    return (
        <form onSubmit={handleSubmit} className="flex flex-col h-full text-left p-2">
            <h3 className="text-xl font-semibold mb-4 text-center">Личностный анализ</h3>
            <div className="flex-grow flex flex-col space-y-4">
                <div>
                    <label className="block text-sm font-medium text-[var(--text-dark-secondary)] mb-2 text-center">Выберите ваш пол</label>
                    <div className="grid grid-cols-2 gap-4">
                        <button
                            type="button"
                            onClick={() => setGender('male')}
                            className={`p-4 rounded-lg border-2 transition-all flex items-center justify-center gap-2 ${gender === 'male' ? 'bg-blue-100 border-blue-500' : 'bg-gray-50 border-gray-200 hover:border-gray-400'}`}
                        >
                            <span className="font-semibold">Мужчина</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setGender('female')}
                            className={`p-4 rounded-lg border-2 transition-all flex items-center justify-center gap-2 ${gender === 'female' ? 'bg-pink-100 border-pink-500' : 'bg-gray-50 border-gray-200 hover:border-gray-400'}`}
                        >
                             <span className="font-semibold">Женщина</span>
                        </button>
                    </div>
                </div>

                <div className="flex-grow flex flex-col">
                     <label className="block text-sm font-medium text-[var(--text-dark-secondary)] mb-1">Ваш запрос</label>
                     <textarea 
                        value={userPrompt} 
                        onChange={e => setUserPrompt(e.target.value)} 
                        placeholder="Опишите ситуацию или вопрос, который вас волнует. Например: 'Как мне найти баланс между работой и личной жизнью?' или 'Помоги разобраться в моих карьерных целях.'"
                        className="w-full flex-grow bg-gray-50 border-2 border-gray-200 rounded-lg p-3 focus:outline-none focus:border-[var(--accent)] resize-none" />
                </div>
            </div>
            <div className="flex-shrink-0 pt-4 text-center">
                <p className="text-sm text-[var(--text-dark-secondary)] mb-3">Стоимость: 1 генерация</p>
                <button type="submit" className="w-full max-w-sm bg-[var(--accent)] text-white font-semibold py-3 px-4 rounded-lg transition-all hover:bg-[var(--accent-light)]">
                     Получить анализ
                </button>
            </div>
        </form>
    );
};

// --- Consultation Sub-components ---
const SpecialistSelection: React.FC<{ onSelect: (specialist: Specialist) => void }> = ({ onSelect }) => {
    const medicalSpecialists = SPECIALISTS.filter(s => s.category === 'Медицина');
    const otherSpecialists = SPECIALISTS.filter(s => s.category === 'Другие сферы');

    const SpecialistButton: React.FC<{ specialist: Specialist }> = ({ specialist }) => (
        <button
            onClick={() => onSelect(specialist)}
            className="w-full text-left p-4 bg-gray-50 hover:bg-[var(--accent-soft)] rounded-lg border-2 border-gray-200 hover:border-[var(--accent)] transition-all flex flex-col"
        >
            <h4 className="font-bold text-base text-[var(--text-dark-primary)]">{specialist.name}</h4>
            <p className="text-xs text-[var(--text-dark-secondary)] mt-1 flex-grow">{specialist.description}</p>
        </button>
    );

    return (
        <div className="flex flex-col h-full text-center">
            <h3 className="text-xl font-semibold mb-4 flex-shrink-0">Выберите специалиста для консультации</h3>
            <p className="text-sm text-[var(--text-dark-secondary)] mb-4 flex-shrink-0">Каждый ваш вопрос в чате будет стоить 1 генерацию.</p>
            <div className="flex-grow overflow-y-auto pr-2 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3">
                {/* Medical Column */}
                <div className="space-y-3">
                    <h4 className="text-lg font-semibold text-left text-[var(--accent-life)] sticky top-0 bg-white/80 backdrop-blur-sm py-1">Медицина</h4>
                    {medicalSpecialists.map(s => <SpecialistButton key={s.id} specialist={s} />)}
                </div>
                {/* Other Column */}
                <div className="space-y-3">
                    <h4 className="text-lg font-semibold text-left text-[var(--accent-advanced)] sticky top-0 bg-white/80 backdrop-blur-sm py-1">Другие сферы</h4>
                    {otherSpecialists.map(s => <SpecialistButton key={s.id} specialist={s} />)}
                </div>
            </div>
        </div>
    );
};

// --- Tutor Sub-components ---
const SubjectSelection: React.FC<{ onSelect: (subject: string) => void; }> = ({ onSelect }) => {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center">
        <h3 className="text-xl font-semibold mb-2">Занятие с репетитором</h3>
        <p className="text-sm text-[var(--text-dark-secondary)] mb-6">Выберите предмет, по которому вам нужна помощь.</p>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 w-full">
            {TUTOR_SUBJECTS.map(subject => (
                 <button 
                    key={subject}
                    onClick={() => onSelect(subject)} 
                    className="p-4 bg-gray-50 hover:bg-[var(--accent-soft)] rounded-lg border-2 border-gray-200 hover:border-[var(--accent)] transition-all flex flex-col items-center justify-center h-24"
                >
                    <span className="font-bold text-base text-[var(--text-dark-primary)]">{subject}</span>
                </button>
            ))}
        </div>
         <p className="text-sm text-[var(--text-dark-secondary)] mt-6">Каждый ваш вопрос в чате будет стоить 1 генерацию.</p>
    </div>
  );
};

const AnimatedBotAvatar = () => (
    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center p-1.5">
         <style>{`
            @keyframes head-sway-small { 0% { transform: rotate(0); } 25% { transform: rotate(-5deg); } 75% { transform: rotate(5deg); } 100% { transform: rotate(0); } }
            .robot-head-group-small { animation: head-sway-small 2.5s ease-in-out infinite; transform-origin: center 14px; }
            @keyframes eye-scan-small { 0%, 100% { transform: translateX(0); } 40% { transform: translateX(-1px); } 90% { transform: translateX(1px); } }
            .robot-eyes-small { animation: eye-scan-small 2s ease-in-out infinite; }
        `}</style>
        <svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--accent-gold)]">
            <g className="robot-head-group-small">
                <path d="M12 8V4H8"/>
                <rect width="16" height="12" x="4" y="8" rx="2"/>
                <g className="robot-eyes-small">
                    <path d="M15 13v2"/>
                    <path d="M9 13v2"/>
                </g>
            </g>
        </svg>
    </div>
);


const ChatWindow: React.FC<{ specialist: Specialist, messages: ChatMessage[], onSendMessage: (message: string) => void, isLoading: boolean }> = ({ specialist, messages, onSendMessage, isLoading }) => {
    const [input, setInput] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(scrollToBottom, [messages]);

    const handleSend = (e: React.FormEvent) => {
        e.preventDefault();
        if (input.trim() && !isLoading) {
            onSendMessage(input.trim());
            setInput('');
        }
    };

    return (
        <div className="flex flex-col h-full">
            <div className="flex-shrink-0 p-3 border-b-2 border-gray-200 text-center">
                <h3 className="font-semibold text-lg">{specialist.name}</h3>
            </div>
            <div className="flex-grow overflow-y-auto p-4 space-y-4">
                {messages.map((msg, index) => (
                    <div key={index} className={`flex items-end gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        {msg.role === 'model' && (
                            <AnimatedBotAvatar />
                        )}
                        <div className={`max-w-[80%] p-3 rounded-2xl whitespace-pre-wrap ${msg.role === 'user' ? 'bg-[var(--accent)] text-white rounded-br-none' : 'bg-gray-100 text-gray-800 rounded-bl-none'}`}>
                           {msg.text}
                        </div>
                         {msg.role === 'user' && (
                             <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-lg text-white">
                                U
                             </div>
                        )}
                    </div>
                ))}
                 {isLoading && (
                    <div className="flex items-end gap-2 justify-start">
                         <AnimatedBotAvatar />
                         <div className="max-w-[80%] p-3 rounded-2xl bg-gray-100 text-gray-800 rounded-bl-none">
                           <div className="flex items-center gap-1.5">
                               <span className="w-2 h-2 bg-gray-400 rounded-full animate-pulse " style={{animationDelay: '0s'}}></span>
                               <span className="w-2 h-2 bg-gray-400 rounded-full animate-pulse " style={{animationDelay: '0.2s'}}></span>
                               <span className="w-2 h-2 bg-gray-400 rounded-full animate-pulse " style={{animationDelay: '0.4s'}}></span>
                           </div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>
            <div className="flex-shrink-0 p-2 border-t-2 border-gray-200">
                <form onSubmit={handleSend} className="flex items-center gap-2">
                    <textarea 
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { handleSend(e); } }}
                        placeholder="Введите ваш вопрос..."
                        rows={1}
                        className="flex-grow bg-gray-100 border-2 border-gray-200 rounded-full p-3 px-5 focus:outline-none focus:border-[var(--accent)] resize-none"
                        disabled={isLoading}
                    />
                    <button type="submit" className="w-12 h-12 flex-shrink-0 bg-[var(--accent)] text-white rounded-full flex items-center justify-center transition-colors hover:bg-[var(--accent-light)] disabled:bg-gray-400" disabled={isLoading || !input.trim()}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>
                    </button>
                </form>
            </div>
        </div>
    );
};

// --- Business Sub-components ---
const SwotAnalysisForm: React.FC<{ onSubmit: (request: SwotAnalysisRequest) => void }> = ({ onSubmit }) => {
    const [description, setDescription] = useState('');
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!description.trim()) {
            toast.error("Пожалуйста, опишите вашу компанию или идею.");
            return;
        }
        onSubmit({ description });
    };

    return (
        <form onSubmit={handleSubmit} className="flex flex-col h-full text-left p-2">
            <h3 className="text-xl font-semibold mb-2 text-center">SWOT-анализ</h3>
            <p className="text-sm text-center text-[var(--text-dark-secondary)] mb-4">Опишите вашу компанию, продукт или идею для анализа.</p>
            <div className="flex-grow flex flex-col">
                <textarea 
                    value={description} 
                    onChange={e => setDescription(e.target.value)} 
                    placeholder="Например: 'Онлайн-школа по обучению программированию для детей от 10 до 16 лет. Основные конкуренты - ...'" 
                    rows={10} 
                    className="w-full flex-grow bg-gray-50 border-2 border-gray-200 rounded-lg p-3 focus:outline-none focus:border-[var(--accent)] resize-none" />
            </div>
            <div className="flex-shrink-0 pt-4 text-center">
                <p className="text-sm text-[var(--text-dark-secondary)] mb-3">Стоимость: 2 генерации</p>
                <button type="submit" className="w-full max-w-sm bg-[var(--accent)] text-white font-semibold py-3 px-4 rounded-lg transition-all hover:bg-[var(--accent-light)]">
                     Провести анализ
                </button>
            </div>
        </form>
    );
};

const CommercialProposalForm: React.FC<{ onSubmit: (request: CommercialProposalRequest) => void }> = ({ onSubmit }) => {
    const [product, setProduct] = useState('');
    const [client, setClient] = useState('');
    const [goals, setGoals] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!product.trim() || !client.trim() || !goals.trim()) {
            toast.error("Пожалуйста, заполните все поля.");
            return;
        }
        onSubmit({ product, client, goals });
    };

    return (
        <form onSubmit={handleSubmit} className="flex flex-col h-full text-left p-2">
            <h3 className="text-xl font-semibold mb-4 text-center">Коммерческое предложение</h3>
            <div className="flex-grow space-y-4 overflow-y-auto pr-2">
                <div>
                    <label className="block text-sm font-medium text-[var(--text-dark-secondary)] mb-1">Ваш продукт или услуга</label>
                    <textarea value={product} onChange={e => setProduct(e.target.value)} placeholder="Подробно опишите, что вы предлагаете." rows={4} className="w-full bg-gray-50 border-2 border-gray-200 rounded-lg p-3 focus:outline-none focus:border-[var(--accent)] resize-none" />
                </div>
                 <div>
                    <label className="block text-sm font-medium text-[var(--text-dark-secondary)] mb-1">Ваш клиент</label>
                    <textarea value={client} onChange={e => setClient(e.target.value)} placeholder="Кто он? Каковы его потребности и проблемы?" rows={4} className="w-full bg-gray-50 border-2 border-gray-200 rounded-lg p-3 focus:outline-none focus:border-[var(--accent)] resize-none" />
                </div>
                 <div>
                    <label className="block text-sm font-medium text-[var(--text-dark-secondary)] mb-1">Цели и призыв к действию</label>
                    <textarea value={goals} onChange={e => setGoals(e.target.value)} placeholder="Что должен сделать клиент после прочтения? (Например: 'Назначить встречу', 'Запросить демо')" rows={3} className="w-full bg-gray-50 border-2 border-gray-200 rounded-lg p-3 focus:outline-none focus:border-[var(--accent)] resize-none" />
                </div>
            </div>
             <div className="flex-shrink-0 pt-4 text-center">
                <p className="text-sm text-[var(--text-dark-secondary)] mb-3">Стоимость: 2 генерации</p>
                <button type="submit" className="w-full max-w-sm bg-[var(--accent)] text-white font-semibold py-3 px-4 rounded-lg transition-all hover:bg-[var(--accent-light)]">
                     Создать предложение
                </button>
            </div>
        </form>
    );
};

const BusinessPlanForm: React.FC<{ onSubmit: (request: BusinessPlanRequest) => void }> = ({ onSubmit }) => {
    const [idea, setIdea] = useState('');
    const [industry, setIndustry] = useState('');
    const [sectionsCount, setSectionsCount] = useState(7);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!idea.trim() || !industry.trim()) {
            toast.error("Пожалуйста, заполните поля 'Идея' и 'Отрасль'.");
            return;
        }
         if (sectionsCount < 3 || sectionsCount > 15) {
            toast.error("Количество разделов должно быть от 3 до 15.");
            return;
        }
        onSubmit({ idea, industry, sectionsCount });
    };

    return (
        <form onSubmit={handleSubmit} className="flex flex-col h-full text-left p-2">
            <h3 className="text-xl font-semibold mb-4 text-center">Создание бизнес-плана</h3>
            <div className="flex-grow space-y-4 overflow-y-auto pr-2">
                <div>
                    <label className="block text-sm font-medium text-[var(--text-dark-secondary)] mb-1">Главная идея бизнеса</label>
                    <textarea value={idea} onChange={e => setIdea(e.target.value)} placeholder="Кратко, но емко опишите суть вашего проекта." rows={5} className="w-full bg-gray-50 border-2 border-gray-200 rounded-lg p-3 focus:outline-none focus:border-[var(--accent)] resize-none" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-[var(--text-dark-secondary)] mb-1">Отрасль</label>
                    <input type="text" value={industry} onChange={e => setIndustry(e.target.value)} placeholder="Например: 'IT', 'Общественное питание', 'Ритейл'" className="w-full bg-gray-50 border-2 border-gray-200 rounded-lg p-3 focus:outline-none focus:border-[var(--accent)]" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-[var(--text-dark-secondary)] mb-1">Количество разделов (3-15)</label>
                    <input type="number" value={sectionsCount} onChange={e => setSectionsCount(parseInt(e.target.value, 10))} min="3" max="15" className="w-full bg-gray-50 border-2 border-gray-200 rounded-lg p-3 focus:outline-none focus:border-[var(--accent)]" />
                </div>
            </div>
            <div className="flex-shrink-0 pt-4 text-center">
                <p className="text-sm text-[var(--text-dark-secondary)] mb-3">Стоимость создания структуры: 2 генерации</p>
                <button type="submit" className="w-full max-w-sm bg-[var(--accent)] text-white font-semibold py-3 px-4 rounded-lg transition-all hover:bg-[var(--accent-light)]">
                     Создать структуру плана
                </button>
            </div>
        </form>
    );
};

const BusinessPlanReview: React.FC<{ initialPlan: BusinessPlan, onGenerate: (plan: BusinessPlan) => void }> = ({ initialPlan, onGenerate }) => {
    const [editedPlan, setEditedPlan] = useState<BusinessPlan>(initialPlan);

    useEffect(() => {
        setEditedPlan(initialPlan);
    }, [initialPlan]);

    return (
        <div className="flex flex-col h-full text-left">
            <h3 className="text-xl font-semibold mb-2 text-center">Структура бизнес-плана: "{editedPlan.title}"</h3>
            <div className="flex-grow overflow-y-auto space-y-3 p-4 bg-gray-50 rounded-lg border-2 border-gray-200">
                {editedPlan.sections.map((section, index) => (
                    <div key={index} className="p-3 bg-white rounded-md shadow-sm">
                        <h4 className="font-bold text-[var(--text-dark-primary)]">{index + 1}. {section.title}</h4>
                        <p className="text-sm text-[var(--text-dark-secondary)] mt-1">{section.description}</p>
                    </div>
                ))}
            </div>
             <div className="flex-shrink-0 pt-4 text-center">
                <p className="text-sm text-[var(--text-dark-secondary)] mb-3">Стоимость генерации полного текста: <span className="font-bold">{editedPlan.sections.length}</span> генераций</p>
                <button onClick={() => onGenerate(editedPlan)} className="w-full max-w-sm bg-[var(--accent-life)] text-white font-semibold py-3 px-4 rounded-lg transition-all hover:bg-[var(--accent-life-dark)]">
                     Написать бизнес-план
                </button>
             </div>
        </div>
    );
};

const MarketingCopyForm: React.FC<{ onSubmit: (request: MarketingCopyRequest) => void }> = ({ onSubmit }) => {
    const [copyType, setCopyType] = useState(MARKETING_TEXT_TYPES[0]);
    const [product, setProduct] = useState('');
    const [audience, setAudience] = useState('');
    const [tone, setTone] = useState(TONE_OF_VOICE_OPTIONS[0]);
    const [details, setDetails] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!product.trim() || !audience.trim()) {
            toast.error("Пожалуйста, опишите продукт и целевую аудиторию.");
            return;
        }
        onSubmit({ copyType, product, audience, tone, details });
    };

    return (
        <form onSubmit={handleSubmit} className="flex flex-col h-full text-left p-2">
            <h3 className="text-xl font-semibold mb-4 text-center">Маркетинговые и рекламные тексты</h3>
            <div className="flex-grow space-y-3 overflow-y-auto pr-2">
                 <div>
                    <label className="block text-sm font-medium text-[var(--text-dark-secondary)] mb-1">Тип текста</label>
                    <select value={copyType} onChange={e => setCopyType(e.target.value)} className="w-full bg-gray-50 border-2 border-gray-200 rounded-lg p-3 focus:outline-none focus:border-[var(--accent)]">
                        {MARKETING_TEXT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-[var(--text-dark-secondary)] mb-1">Продукт/услуга</label>
                    <textarea value={product} onChange={e => setProduct(e.target.value)} placeholder="Опишите, что вы продвигаете." rows={3} className="w-full bg-gray-50 border-2 border-gray-200 rounded-lg p-3 focus:outline-none focus:border-[var(--accent)] resize-none" />
                </div>
                 <div>
                    <label className="block text-sm font-medium text-[var(--text-dark-secondary)] mb-1">Целевая аудитория</label>
                    <input type="text" value={audience} onChange={e => setAudience(e.target.value)} placeholder="Например: 'Студенты технических вузов'" className="w-full bg-gray-50 border-2 border-gray-200 rounded-lg p-3 focus:outline-none focus:border-[var(--accent)]" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-[var(--text-dark-secondary)] mb-1">Тональность (Tone of Voice)</label>
                    <select value={tone} onChange={e => setTone(e.target.value)} className="w-full bg-gray-50 border-2 border-gray-200 rounded-lg p-3 focus:outline-none focus:border-[var(--accent)]">
                        {TONE_OF_VOICE_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-[var(--text-dark-secondary)] mb-1">Ключевые детали</label>
                    <textarea value={details} onChange={e => setDetails(e.target.value)} placeholder="Укажите акции, УТП, призыв к действию..." rows={3} className="w-full bg-gray-50 border-2 border-gray-200 rounded-lg p-3 focus:outline-none focus:border-[var(--accent)] resize-none" />
                </div>
            </div>
             <div className="flex-shrink-0 pt-4 text-center">
                <p className="text-sm text-[var(--text-dark-secondary)] mb-3">Стоимость: 1 генерация</p>
                <button type="submit" className="w-full max-w-sm bg-[var(--accent)] text-white font-semibold py-3 px-4 rounded-lg transition-all hover:bg-[var(--accent-light)]">
                     Создать текст
                </button>
            </div>
        </form>
    );
};

// --- Creative Sub-components ---
const TextRewritingForm: React.FC<{ onSubmit: (request: TextRewritingRequest, file: File | null) => void }> = ({ onSubmit }) => {
    const [originalText, setOriginalText] = useState('');
    const [goal, setGoal] = useState(REWRITING_GOALS[0]);
    const [style, setStyle] = useState(REWRITING_STYLES[0]);
    const [instructions, setInstructions] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [isReadingFile, setIsReadingFile] = useState(false);
    const [cost, setCost] = useState(1);

    useEffect(() => {
        const textCost = originalText ? Math.ceil(originalText.length / 5000) : 0;
        const fileCost = file ? 1 : 0;
        setCost(Math.max(1, textCost + fileCost));
    }, [originalText, file]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (!selectedFile) return;

        if (selectedFile.size > 10 * 1024 * 1024) { // 10MB limit
            toast.error('Файл слишком большой (макс. 10 МБ).');
            return;
        }
        const allowedTypes = ['text/plain', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
        if (!allowedTypes.includes(selectedFile.type) && !selectedFile.type.startsWith('image/')) {
            toast.error('Неподдерживаемый тип файла. Пожалуйста, используйте .txt, .docx или изображения.');
            return;
        }
        setFile(selectedFile);
        if (selectedFile.type.startsWith('image/')) {
            setOriginalText(''); // Clear text area if an image is uploaded
        }
    };
    
    const removeFile = () => {
        setFile(null);
        setOriginalText('');
        const fileInput = document.getElementById('file-rewrite-upload') as HTMLInputElement;
        if (fileInput) {
            fileInput.value = '';
        }
    };


    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (isReadingFile) return;
        if (!originalText.trim() && !file) {
            toast.error("Пожалуйста, вставьте текст для переработки или загрузите файл.");
            return;
        }
        onSubmit({ 
            originalText, 
            goal, 
            style: goal === 'Изменить стиль' ? style : undefined,
            instructions: goal === 'Внести изменения' ? instructions : undefined
        }, file);
    };

    return (
        <form onSubmit={handleSubmit} className="flex flex-col h-full text-left p-2">
            <h3 className="text-xl font-semibold mb-4 text-center">Переработка текста</h3>
            <div className="flex-grow flex flex-col space-y-4">

                <div>
                    <label className="block text-sm font-medium text-[var(--text-dark-secondary)] mb-1">Загрузить файл (необязательно, до 10МБ)</label>
                    <input id="file-rewrite-upload" type="file" className="sr-only" onChange={handleFileChange} accept=".txt,.docx,image/*" />
                    <label htmlFor="file-rewrite-upload" className="w-full text-sm cursor-pointer bg-white border border-gray-300 rounded-md px-3 py-2 hover:bg-gray-50 flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 flex-shrink-0"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
                        {file ? 'Заменить файл' : 'Выбрать файл...'}
                    </label>
                    {file && (
                        <div className="mt-2 text-xs flex items-center gap-2 text-gray-600">
                             <span className="truncate">{file.name}</span>
                             <button type="button" onClick={removeFile} className="text-red-500 font-bold">&times;</button>
                        </div>
                    )}
                </div>

                <div className="flex-grow flex flex-col">
                     <label className="block text-sm font-medium text-[var(--text-dark-secondary)] mb-1">Текст для переработки</label>
                     <textarea 
                        value={originalText} 
                        onChange={e => setOriginalText(e.target.value)} 
                        placeholder="Вставьте сюда свой текст или загрузите его из файла." 
                        className="w-full flex-grow bg-gray-50 border-2 border-gray-200 rounded-lg p-3 focus:outline-none focus:border-[var(--accent-creative)] resize-none" />
                </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-[var(--text-dark-secondary)] mb-1">Цель</label>
                        <select value={goal} onChange={e => setGoal(e.target.value)} className="w-full bg-gray-50 border-2 border-gray-200 rounded-lg p-3 focus:outline-none focus:border-[var(--accent-creative)]">
                            {REWRITING_GOALS.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                    </div>
                     {goal === 'Изменить стиль' && (
                         <div>
                            <label className="block text-sm font-medium text-[var(--text-dark-secondary)] mb-1">Новый стиль</label>
                            <select value={style} onChange={e => setStyle(e.target.value)} className="w-full bg-gray-50 border-2 border-gray-200 rounded-lg p-3 focus:outline-none focus:border-[var(--accent-creative)]">
                                {REWRITING_STYLES.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </div>
                     )}
                 </div>

                 {goal === 'Внести изменения' && (
                    <div>
                        <label className="block text-sm font-medium text-[var(--text-dark-secondary)] mb-1">Инструкции по изменению</label>
                        <textarea
                            value={instructions}
                            onChange={e => setInstructions(e.target.value)}
                            placeholder="Например: 'Сделай первый абзац более эмоциональным', 'Убери упоминания о ценах', 'Перефразируй вывод'"
                            rows={4}
                            className="w-full bg-gray-50 border-2 border-gray-200 rounded-lg p-3 focus:outline-none focus:border-[var(--accent-creative)] resize-none"
                        />
                    </div>
                 )}
            </div>
             <div className="flex-shrink-0 pt-4 text-center">
                <p className="text-sm text-[var(--text-dark-secondary)] mb-3">Стоимость: {cost} генерация</p>
                <button type="submit" className="w-full max-w-sm bg-[var(--accent)] text-white font-semibold py-3 px-4 rounded-lg transition-all hover:bg-[var(--accent-light)]">
                     Переработать
                </button>
            </div>
        </form>
    );
};

const AudioScriptTopicForm: React.FC<{ onSubmit: (topic: string, duration: number) => void }> = ({ onSubmit }) => {
    const [topic, setTopic] = useState('');
    const [duration, setDuration] = useState(5);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!topic.trim()) {
            toast.error("Пожалуйста, укажите тему.");
            return;
        }
        if (duration < 1 || duration > 60) {
            toast.error("Длительность должна быть от 1 до 60 минут.");
            return;
        }
        onSubmit(topic, duration);
    };

    return (
        <form onSubmit={handleSubmit} className="flex flex-col h-full text-left p-2">
            <h3 className="text-xl font-semibold mb-4 text-center">Аудио-сценарий: Тема</h3>
            <div className="flex-grow space-y-4">
                <div>
                    <label className="block text-sm font-medium text-[var(--text-dark-secondary)] mb-1">Тема скрипта</label>
                    <textarea value={topic} onChange={e => setTopic(e.target.value)} placeholder="Например: 'Обсуждение последних новостей в области AI' или 'Интервью с вымышленным персонажем'" rows={5} className="w-full bg-gray-50 border-2 border-gray-200 rounded-lg p-3 focus:outline-none focus:border-[var(--accent-creative)] resize-none" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-[var(--text-dark-secondary)] mb-1">Примерная длительность (минут)</label>
                    <input type="number" value={duration} onChange={e => setDuration(Number(e.target.value))} min="1" max="60" className="w-full bg-gray-50 border-2 border-gray-200 rounded-lg p-3 focus:outline-none focus:border-[var(--accent-creative)]" />
                </div>
            </div>
            <div className="flex-shrink-0 pt-4 text-center">
                <button type="submit" className="w-full max-w-sm bg-[var(--accent)] text-white font-semibold py-3 px-4 rounded-lg transition-all hover:bg-[var(--accent-light)]">
                    Далее
                </button>
            </div>
        </form>
    );
};

const AudioScriptConfigForm: React.FC<{ onSubmit: (config: Omit<AudioScriptRequest, 'topic' | 'duration'>) => void, request: Partial<AudioScriptRequest> }> = ({ onSubmit, request }) => {
    const [format, setFormat] = useState<'dialogue' | 'monologue'>('dialogue');
    const [type, setType] = useState(AUDIO_SCRIPT_TYPES[0]);
    const [voice1, setVoice1] = useState(AUDIO_VOICE_PROFILES[0].id);
    const [voice2, setVoice2] = useState(AUDIO_VOICE_PROFILES[1].id);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (format === 'dialogue' && voice1 === voice2) {
            toast.error("Пожалуйста, выберите разные голоса для диалога.");
            return;
        }
        onSubmit({ format, type, voice1, voice2: format === 'dialogue' ? voice2 : undefined });
    };
    const cost = Math.max(2, Math.ceil((request.duration || 5) / 5) * 2);

    return (
        <form onSubmit={handleSubmit} className="flex flex-col h-full text-left p-2">
            <h3 className="text-xl font-semibold mb-4 text-center">Аудио-сценарий: Настройка</h3>
            <div className="flex-grow space-y-3 overflow-y-auto pr-2">
                <div><label className="block text-sm font-medium">Тема: <span className="font-normal text-gray-600">{request.topic}</span></label></div>
                <div><label className="block text-sm font-medium">Длительность: <span className="font-normal text-gray-600">~{request.duration} мин.</span></label></div>
                <hr className="my-2" />
                <div className="grid grid-cols-2 gap-2">
                    <button type="button" onClick={() => setFormat('dialogue')} className={`py-2 rounded-lg border-2 ${format==='dialogue' ? 'bg-blue-100 border-blue-500' : 'bg-gray-100 border-gray-200'}`}>Диалог</button>
                    <button type="button" onClick={() => setFormat('monologue')} className={`py-2 rounded-lg border-2 ${format==='monologue' ? 'bg-blue-100 border-blue-500' : 'bg-gray-100 border-gray-200'}`}>Монолог</button>
                </div>
                <div>
                    <label className="block text-sm font-medium text-[var(--text-dark-secondary)] mb-1">Жанр/Тип</label>
                    <select value={type} onChange={e => setType(e.target.value)} className="w-full bg-gray-50 border-2 border-gray-200 rounded-lg p-3 focus:outline-none focus:border-[var(--accent-creative)]">
                        {AUDIO_SCRIPT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-[var(--text-dark-secondary)] mb-1">{format === 'dialogue' ? 'Голос 1' : 'Голос'}</label>
                    <select value={voice1} onChange={e => setVoice1(e.target.value)} className="w-full bg-gray-50 border-2 border-gray-200 rounded-lg p-3 focus:outline-none focus:border-[var(--accent-creative)]">
                        {AUDIO_VOICE_PROFILES.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
                    </select>
                </div>
                {format === 'dialogue' && (
                    <div>
                        <label className="block text-sm font-medium text-[var(--text-dark-secondary)] mb-1">Голос 2</label>
                        <select value={voice2} onChange={e => setVoice2(e.target.value)} className="w-full bg-gray-50 border-2 border-gray-200 rounded-lg p-3 focus:outline-none focus:border-[var(--accent-creative)]">
                            {AUDIO_VOICE_PROFILES.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
                        </select>
                    </div>
                )}
            </div>
            <div className="flex-shrink-0 pt-4 text-center">
                <p className="text-sm text-[var(--text-dark-secondary)] mb-3">Стоимость: <span className="font-bold">{cost}</span> генераций</p>
                <button type="submit" className="w-full max-w-sm bg-[var(--accent)] text-white font-semibold py-3 px-4 rounded-lg transition-all hover:bg-[var(--accent-light)]">
                    Создать сценарий
                </button>
            </div>
        </form>
    );
};


const ArticlePlanForm: React.FC<{ onSubmit: (request: AcademicArticleRequest, file?: File | null) => void, docType: DocumentType }> = ({ onSubmit, docType }) => {
    const [topic, setTopic] = useState('');
    const [hypothesis, setHypothesis] = useState('');
    const [field, setField] = useState('');
    const [sectionsCount, setSectionsCount] = useState(5);
    const [file, setFile] = useState<File | null>(null);

    const isGrant = docType === DocumentType.GRANT_PROPOSAL;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!topic.trim() || !field.trim()) {
            toast.error("Пожалуйста, заполните все обязательные поля.");
            return;
        }
        if (sectionsCount < 3 || sectionsCount > 15) {
            toast.error("Количество разделов должно быть от 3 до 15.");
            return;
        }
        onSubmit({ topic, hypothesis, field, sectionsCount }, file);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile && selectedFile.size > 2 * 1024 * 1024) { // 2MB limit for form
            toast.error('Файл слишком большой (макс. 2 МБ).');
            return;
        }
        setFile(selectedFile || null);
    };

    return (
        <form onSubmit={handleSubmit} className="flex flex-col h-full text-left p-2">
            <h3 className="text-xl font-semibold mb-4 text-center">{isGrant ? "Планирование гранта" : "Планирование научной статьи"}</h3>
            <div className="flex-grow space-y-3 overflow-y-auto pr-2">
                <div>
                    <label className="block text-sm font-medium text-[var(--text-dark-secondary)] mb-1">Тема*</label>
                    <input type="text" value={topic} onChange={e => setTopic(e.target.value)} placeholder={isGrant ? "Название грантового проекта" : "Тема вашей научной статьи"} className="w-full bg-gray-50 border-2 border-gray-200 rounded-lg p-3 focus:outline-none focus:border-[var(--accent-science)]" required />
                </div>
                 <div>
                    <label className="block text-sm font-medium text-[var(--text-dark-secondary)] mb-1">{isGrant ? "Основная идея/Цель проекта" : "Гипотеза или главный вопрос"} (необязательно)</label>
                    <textarea value={hypothesis} onChange={e => setHypothesis(e.target.value)} rows={3} className="w-full bg-gray-50 border-2 border-gray-200 rounded-lg p-3 focus:outline-none focus:border-[var(--accent-science)] resize-none" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-[var(--text-dark-secondary)] mb-1">Научная область*</label>
                    <input type="text" value={field} onChange={e => setField(e.target.value)} placeholder="Например: 'Биоинформатика', 'Социология'" className="w-full bg-gray-50 border-2 border-gray-200 rounded-lg p-3 focus:outline-none focus:border-[var(--accent-science)]" required />
                </div>
                 <div>
                    <label className="block text-sm font-medium text-[var(--text-dark-secondary)] mb-1">Количество разделов (3-15)</label>
                    <input type="number" value={sectionsCount} onChange={e => setSectionsCount(parseInt(e.target.value, 10))} min="3" max="15" className="w-full bg-gray-50 border-2 border-gray-200 rounded-lg p-3 focus:outline-none focus:border-[var(--accent-science)]" required />
                </div>
                {isGrant && (
                    <div>
                        <label className="block text-sm font-medium text-[var(--text-dark-secondary)] mb-1">Форма заявки (необязательно)</label>
                        <input type="file" onChange={handleFileChange} accept=".txt,.doc,.docx" className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[var(--accent-soft)] file:text-[var(--accent)] hover:file:bg-[var(--accent-soft)]/80"/>
                        {file && <p className="text-xs mt-1 text-gray-500">Выбран файл: {file.name}</p>}
                    </div>
                )}
            </div>
             <div className="flex-shrink-0 pt-4 text-center">
                <p className="text-sm text-[var(--text-dark-secondary)] mb-3">Стоимость создания плана: 1 генерация</p>
                <button type="submit" className="w-full max-w-sm bg-[var(--accent)] text-white font-semibold py-3 px-4 rounded-lg transition-all hover:bg-[var(--accent-light)]">
                     Создать план
                </button>
            </div>
        </form>
    );
};

const ArticlePlanReview: React.FC<{ initialPlan: ArticlePlan, onGenerate: (plan: ArticlePlan) => void, docType: DocumentType }> = ({ initialPlan, onGenerate, docType }) => {
    const [editedPlan, setEditedPlan] = useState<ArticlePlan>(initialPlan);
    const isGrant = docType === DocumentType.GRANT_PROPOSAL;

    useEffect(() => setEditedPlan(initialPlan), [initialPlan]);
    
    const handleSectionChange = (index: number, field: keyof ArticleSection, value: string) => {
        const newSections = [...editedPlan.sections];
        newSections[index] = { ...newSections[index], [field]: value };
        setEditedPlan(prev => ({ ...prev, sections: newSections }));
    };

    return (
        <div className="flex flex-col h-full text-left">
            <h3 className="text-xl font-semibold mb-2 text-center">План {isGrant ? "гранта" : "статьи"}: "{editedPlan.title}"</h3>
            <div className="flex-grow overflow-y-auto space-y-3 p-4 bg-gray-50 rounded-lg border-2 border-gray-200">
                {editedPlan.sections.map((section, index) => (
                    <div key={index} className="p-3 bg-white rounded-md shadow-sm border border-gray-200 space-y-2">
                        <h4 className="font-bold text-[var(--text-dark-primary)]">{index + 1}. {section.title}</h4>
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Описание раздела</label>
                            <textarea value={section.description} onChange={e => handleSectionChange(index, 'description', e.target.value)} rows={2} className="w-full bg-white border border-gray-300 rounded-lg p-2 resize-none focus:outline-none focus:border-[var(--accent-science)] text-sm" />
                        </div>
                    </div>
                ))}
            </div>
             <div className="flex-shrink-0 pt-4 text-center">
                <p className="text-sm text-[var(--text-dark-secondary)] mb-3">Стоимость генерации полного текста: <span className="font-bold">{editedPlan.sections.length}</span> генераций</p>
                <button onClick={() => onGenerate(editedPlan)} className="w-full max-w-sm bg-[var(--accent-science)] text-white font-semibold py-3 px-4 rounded-lg transition-all hover:bg-[var(--accent-science-dark)]">
                     {isGrant ? "Написать заявку по плану" : "Написать статью по плану"}
                </button>
             </div>
        </div>
    );
};

const CodeGenerationForm: React.FC<{ onSubmit: (request: CodeGenerationRequest) => void }> = ({ onSubmit }) => {
    const [language, setLanguage] = useState(PROGRAMMING_LANGUAGES[0]);
    const [taskDescription, setTaskDescription] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!taskDescription.trim()) {
            toast.error("Пожалуйста, опишите задачу.");
            return;
        }
        onSubmit({ language, taskDescription });
    };

    return (
        <form onSubmit={handleSubmit} className="flex flex-col h-full text-left p-2">
            <h3 className="text-xl font-semibold mb-4 text-center">Генерация кода</h3>
            <div className="flex-grow space-y-4 overflow-y-auto pr-2">
                <div>
                    <label className="block text-sm font-medium text-[var(--text-dark-secondary)] mb-1">Язык программирования</label>
                    <select value={language} onChange={e => setLanguage(e.target.value)} className="w-full bg-gray-50 border-2 border-gray-200 rounded-lg p-3 focus:outline-none focus:border-[var(--accent-code)]">
                        {PROGRAMMING_LANGUAGES.map(lang => <option key={lang} value={lang}>{lang}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-[var(--text-dark-secondary)] mb-1">Описание задачи</label>
                    <textarea value={taskDescription} onChange={e => setTaskDescription(e.target.value)} placeholder="Например: 'Напиши функцию на Python, которая сортирует массив чисел методом быстрой сортировки' или 'Создай HTML-форму с полями для имени, email и пароля'." rows={8} className="w-full bg-gray-50 border-2 border-gray-200 rounded-lg p-3 focus:outline-none focus:border-[var(--accent-code)] resize-none" />
                </div>
            </div>
            <div className="flex-shrink-0 pt-4 text-center">
                <p className="text-sm text-[var(--text-dark-secondary)] mb-3">Стоимость анализа: 1 генерация</p>
                <button type="submit" className="w-full max-w-sm bg-[var(--accent)] text-white font-semibold py-3 px-4 rounded-lg transition-all hover:bg-[var(--accent-light)]">
                    Проанализировать задачу
                </button>
            </div>
        </form>
    );
};

const ForecastingForm: React.FC<{ onSubmit: (prompt: string) => void }> = ({ onSubmit }) => {
    const [prompt, setPrompt] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!prompt.trim()) {
            toast.error("Пожалуйста, опишите, что нужно спрогнозировать.");
            return;
        }
        onSubmit(prompt);
    };

    return (
        <form onSubmit={handleSubmit} className="flex flex-col h-full text-left p-2">
            <h3 className="text-xl font-semibold mb-2 text-center">Прогнозирование</h3>
            <p className="text-sm text-center text-[var(--text-dark-secondary)] mb-4">Опишите задачу для прогноза на основе открытых данных.</p>
            <div className="flex-grow flex flex-col">
                <textarea 
                    value={prompt} 
                    onChange={e => setPrompt(e.target.value)} 
                    placeholder="Например: 'Каковы перспективы развития рынка электромобилей в России на ближайшие 5 лет?' или 'Спрогнозируй изменение туристических потоков в Европу после 2024 года.'"
                    rows={10} 
                    className="w-full flex-grow bg-gray-50 border-2 border-gray-200 rounded-lg p-3 focus:outline-none focus:border-[var(--accent)] resize-none" />
            </div>
            <div className="flex-shrink-0 pt-4 text-center">
                <p className="text-sm text-[var(--text-dark-secondary)] mb-3">Стоимость: 3 генерации</p>
                <button type="submit" className="w-full max-w-sm bg-[var(--accent)] text-white font-semibold py-3 px-4 rounded-lg transition-all hover:bg-[var(--accent-light)]">
                     Сделать прогноз
                </button>
            </div>
        </form>
    );
};

const CodeAnalysisReview: React.FC<{ analysis: CodeAnalysisResult, request: CodeGenerationRequest, onGenerate: () => void, onCancel: () => void, remainingGenerations: number }> = ({ analysis, request, onGenerate, onCancel, remainingGenerations }) => {
    const canAfford = remainingGenerations >= analysis.cost;

    return (
        <div className="flex flex-col h-full text-left p-2">
            <h3 className="text-xl font-semibold mb-4 text-center">Анализ задачи: "{request.language}"</h3>
            <div className="flex-grow space-y-4 overflow-y-auto pr-2 bg-gray-50 p-4 rounded-lg border">
                <div>
                    <h4 className="font-bold text-sm text-gray-700 mb-1">План выполнения:</h4>
                    <p className="text-sm whitespace-pre-wrap">{analysis.plan}</p>
                </div>
                <div>
                    <h4 className="font-bold text-sm text-gray-700 mb-1">Оценка сложности:</h4>
                    <p className="text-sm">{analysis.complexity}</p>
                </div>
                <div>
                    <h4 className="font-bold text-sm text-gray-700 mb-1">Стоимость генерации:</h4>
                    <p className="text-lg font-bold text-[var(--accent-code)]">{analysis.cost} генераций</p>
                </div>
            </div>
            <div className="flex-shrink-0 pt-4 text-center">
                {!canAfford && (
                    <p className="text-sm text-red-600 mb-3">
                        Недостаточно генераций. У вас {remainingGenerations}.
                    </p>
                )}
                <div className="flex gap-4 justify-center">
                    <button onClick={onCancel} className="w-full max-w-xs bg-gray-200 text-gray-800 font-semibold py-3 px-4 rounded-lg transition-all hover:bg-gray-300">
                        Отмена
                    </button>
                    <button onClick={onGenerate} disabled={!canAfford} className="w-full max-w-xs bg-[var(--accent)] text-white font-semibold py-3 px-4 rounded-lg transition-all hover:bg-[var(--accent-light)] disabled:bg-gray-400">
                        Сгенерировать код
                    </button>
                </div>
            </div>
        </div>
    );
};


export const ResultDisplay: React.FC<ResultDisplayProps> = ({
  result,
  isLoading,
  error,
  isLoggedIn,
  remainingGenerations,
  hasMirra,
  onShareWithMirra,
  hasDary,
  onShareWithDary,
  onSaveGeneration,
  onBuyGenerations,
  useGeneration,
  docType,
  onConvertToTable,
  // Flows
  astrologyStep, onAstrologySelect, onNatalSubmit, onHoroscopeSubmit,
  bookWritingStep, bookPlan, onPlanSubmit, onGenerateBook,
  personalAnalysisStep, onPersonalAnalysisSubmit,
  docAnalysisStep, onDocAnalysisSubmit,
  consultationStep, onSpecialistSelect, selectedSpecialist, chatMessages, onSendMessage,
  tutorStep, onSubjectSelect, selectedSubject, tutorChatMessages, onTutorSendMessage,
  fileTaskStep, onFileTaskSubmit,
  businessStep, businessPlan, onSwotSubmit, onCommercialProposalSubmit, onBusinessPlanSubmit, onGenerateBusinessPlan, onMarketingSubmit,
  creativeStep, onRewritingSubmit, onCreativeFileTaskSubmit, onAudioScriptTopicSubmit, onAudioScriptSubmit, audioScriptRequest,
  scienceStep, articlePlan, onArticlePlanSubmit, onGenerateArticle,
  scienceFileStep, onScienceFileTaskSubmit,
  thesisStep, onThesisSubmit,
  analysisStep, onAnalysisSubmit,
  forecastingStep, onForecastSubmit,
  codeStep, onCodeSubmit, onGenerateCode, codeAnalysis, codeRequest, onCancelCodeAnalysis
}) => {

  const isQuotaError = error && (error.includes('quota') || error.includes('429'));
  const isApiKeyError = error && (error.includes('API_KEY_INVALID') || error.includes('API key not valid'));

  if (isQuotaError) return <QuotaErrorDisplay onBuyGenerations={onBuyGenerations} />;
  if (isApiKeyError) return <ApiKeyErrorDisplay />;
  if (error) {
    return (
        <div className="flex flex-col items-center justify-center h-full text-center text-red-800 bg-red-50 p-6 rounded-lg border-2 border-red-200">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-shield-x mb-4"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m14.5 9.5-5 5"/><path d="m9.5 9.5 5 5"/></svg>
            <h3 className="text-xl font-semibold">Произошла ошибка</h3>
            <p className="mt-2 text-sm text-red-700 max-w-md">{error}</p>
        </div>
    );
  }

  // Astrology Flow
  if (astrologyStep === 'selection') return <AstrologySelection onSelect={onAstrologySelect} />;
  if (astrologyStep === 'natal_form') return <NatalChartForm onSubmit={onNatalSubmit} />;
  if (astrologyStep === 'horoscope_form') return <HoroscopeForm onSubmit={onHoroscopeSubmit} />;

  // Book Writing Flow
  if (bookWritingStep === 'form') return <BookPlanForm onSubmit={onPlanSubmit} />;
  if (bookWritingStep === 'plan_review' && bookPlan) return <BookPlanReview initialPlan={bookPlan} onGenerate={onGenerateBook} />;
  
  // Personal Analysis Flow
  if (personalAnalysisStep === 'form') return <PersonalAnalysisForm onSubmit={onPersonalAnalysisSubmit} />;
  
  // Doc Analysis Flow
  if (docAnalysisStep === 'upload_form') {
    return <FileUploadForm
                title="Доктор"
                description="Загрузите медицинские анализы, заключения или другие документы для анализа."
                promptLabel="Опишите, что вы хотите узнать из документов"
                promptPlaceholder="Например: 'Расшифруй, пожалуйста, эти анализы крови' или 'Что означает этот диагноз?'"
                buttonText="Проанализировать документы"
                cost={2} maxFiles={5} maxFileSizeMB={10} acceptedFileTypes="image/*,application/pdf"
                accentColor="accent-life"
                icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-10 h-10 text-gray-400"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/></svg>}
                remainingGenerations={remainingGenerations}
                onSubmit={onDocAnalysisSubmit}
            />;
  }
  
  // Consultation Flow
  if (consultationStep === 'selection') return <SpecialistSelection onSelect={onSpecialistSelect} />;
  if (consultationStep === 'chatting' && selectedSpecialist) {
    return <ChatWindow specialist={selectedSpecialist} messages={chatMessages} onSendMessage={onSendMessage} isLoading={isLoading} />;
  }

  // Tutor Flow
  if (tutorStep === 'subject_selection') return <SubjectSelection onSelect={onSubjectSelect} />;
  if (tutorStep === 'chatting' && selectedSubject) {
    const tutorSpecialist = { id: 'tutor', name: `Репетитор: ${selectedSubject}`, description: '', category: 'Другие сферы', systemInstruction: '' };
    return <ChatWindow specialist={tutorSpecialist} messages={tutorChatMessages} onSendMessage={onTutorSendMessage} isLoading={isLoading} />;
  }
  
  // File Task Flow
  if (fileTaskStep === 'upload_form') {
    return <FileUploadForm
                title={docType === DocumentType.DO_HOMEWORK ? "Сделать ДЗ" : "Решить КР, ПР"}
                description="Загрузите фото или файлы с вашим заданием, чтобы получить решение и объяснение."
                promptLabel="Пояснения к заданию (необязательно)"
                promptPlaceholder="Например: 'Нужно решить только нечетные номера' или 'Объясни, пожалуйста, второй шаг подробнее'"
                buttonText="Отправить на решение"
                cost={docType === DocumentType.DO_HOMEWORK ? 2 : 1}
                maxFiles={10} maxFileSizeMB={10} acceptedFileTypes="image/*,application/pdf,.doc,.docx,.txt"
                accentColor="accent"
                icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-10 h-10 text-gray-400"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/></svg>}
                remainingGenerations={remainingGenerations}
                onSubmit={onFileTaskSubmit}
            />;
  }

  // Business Flow
  if (businessStep === 'swot_form') return <SwotAnalysisForm onSubmit={onSwotSubmit} />;
  if (businessStep === 'proposal_form') return <CommercialProposalForm onSubmit={onCommercialProposalSubmit} />;
  if (businessStep === 'business_plan_form') return <BusinessPlanForm onSubmit={onBusinessPlanSubmit} />;
  if (businessStep === 'plan_review' && businessPlan) return <BusinessPlanReview initialPlan={businessPlan} onGenerate={onGenerateBusinessPlan} />;
  if (businessStep === 'marketing_form') return <MarketingCopyForm onSubmit={onMarketingSubmit} />;
  
  // Creative Flow
  if (creativeStep === 'rewriting_form') return <TextRewritingForm onSubmit={onRewritingSubmit} />;
  if (creativeStep === 'script_upload_form') {
    return <FileUploadForm
                title="Анализ сценария"
                description="Загрузите ваш сценарий, синопсис, логлайн или просто идеи для анализа и улучшения."
                promptLabel="Что вы хотите улучшить или проанализировать?"
                promptPlaceholder="Например: 'Усилить конфликт во втором акте', 'Проверить диалоги на естественность', 'Предложить варианты развития сюжета'"
                buttonText="Отправить на анализ"
                cost={2} maxFiles={3} maxFileSizeMB={10} acceptedFileTypes=".txt,.doc,.docx"
                accentColor="accent-creative"
                icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-10 h-10 text-gray-400"><rect x="4" y="2" width="16" height="20" rx="2" ry="2"/><line x1="8" y1="6" x2="16" y2="6"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="8" y1="18" x2="12" y2="18"/></svg>}
                remainingGenerations={remainingGenerations}
                onSubmit={(files, prompt) => onCreativeFileTaskSubmit(files, '', prompt)}
            />;
  }
  if (creativeStep === 'audio_script_topic') return <AudioScriptTopicForm onSubmit={onAudioScriptTopicSubmit} />;
  if (creativeStep === 'audio_script_config') return <AudioScriptConfigForm onSubmit={onAudioScriptSubmit} request={audioScriptRequest} />;

  // Science Flow
  if (scienceStep === 'article_form') return <ArticlePlanForm onSubmit={onArticlePlanSubmit} docType={docType} />;
  if (scienceStep === 'plan_review' && articlePlan) return <ArticlePlanReview initialPlan={articlePlan} onGenerate={onGenerateArticle} docType={docType} />;
  if (scienceFileStep === 'upload_form') {
      return <FileUploadForm
                  title={docType}
                  description="Загрузите файлы для проведения изыскания или улучшения технологии."
                  promptLabel="Пояснения к задаче"
                  promptPlaceholder="Например: 'Проанализируй эти данные и предложи гипотезы' или 'На основе этих патентов предложи улучшения для технологии...'"
                  buttonText="Начать анализ"
                  cost={2} maxFiles={10} maxFileSizeMB={10} acceptedFileTypes="image/*,application/pdf,.doc,.docx,.txt"
                  accentColor="accent-science"
                  icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-10 h-10 text-gray-400"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><path d="M12 18v-6"/><path d="m9 15 3-3 3 3"/></svg>}
                  remainingGenerations={remainingGenerations}
                  onSubmit={onScienceFileTaskSubmit}
              />;
  }

  // Thesis Flow
  if (thesisStep === 'form') return <ThesisForm onSubmit={onThesisSubmit} remainingGenerations={remainingGenerations} />;

  // Analysis Flow
  if (analysisStep === 'upload_form') {
      return <FileUploadForm
                title={docType}
                description="Загрузите текст или документ для анализа."
                promptLabel="Что именно нужно сделать?"
                promptPlaceholder={docType === DocumentType.ANALYSIS_VERIFY ? "Например: 'Проверь факты в этом тексте' или 'Найди возможные противоречия'" : "Например: 'Выдели основные тезисы' или 'Сделай краткое саммари'"}
                buttonText="Начать анализ"
                cost={docType === DocumentType.ANALYSIS_VERIFY ? 3 : 2}
                maxFiles={3} maxFileSizeMB={5} acceptedFileTypes=".txt,.doc,.docx"
                accentColor="accent-analysis"
                icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-10 h-10 text-gray-400"><path d="M20 12V8l-6-6H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h4"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="m18 16-2-2-2 2"/><path d="m16 14-2 2-2-2"/></svg>}
                remainingGenerations={remainingGenerations}
                onSubmit={onAnalysisSubmit}
            />;
  }
  
  // Forecasting Flow
  if (forecastingStep === 'form') {
      return <ForecastingForm onSubmit={onForecastSubmit} />;
  }

  // Code Flow
  if (codeStep === 'form') return <CodeGenerationForm onSubmit={onCodeSubmit} />;
  if (codeStep === 'review' && codeAnalysis && codeRequest) {
    return <CodeAnalysisReview 
        analysis={codeAnalysis} 
        request={codeRequest}
        onGenerate={onGenerateCode}
        onCancel={onCancelCodeAnalysis}
        remainingGenerations={remainingGenerations}
    />;
  }
  
  // Default Idle View
  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-4">
        <h3 className="text-xl font-semibold">Готов к работе</h3>
        <p className="mt-2 text-sm text-[var(--text-dark-secondary)] max-w-sm">
            Выберите необходимый вам сервис в левой панели, заполните поля, и я сгенерирую для вас результат.
        </p>
    </div>
  );
};
