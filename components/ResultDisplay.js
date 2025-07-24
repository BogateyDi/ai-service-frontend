import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { toast } from 'react-hot-toast';
import { DocumentType } from '../types.js';
import { BOOK_GENRES, BOOK_STYLES, MARKETING_TEXT_TYPES, TONE_OF_VOICE_OPTIONS, REWRITING_GOALS, REWRITING_STYLES, PROGRAMMING_LANGUAGES, SPECIALISTS, TUTOR_SUBJECTS, AUDIO_SCRIPT_TYPES, AUDIO_VOICE_PROFILES } from '../constants.js';

import FileUploadForm from './FileUploadForm.js';
import { ThesisForm } from './ThesisForm.js';
import { MermaidDiagram } from './MermaidDiagram.js';


// #region ResultViewer Component
export const ResultViewer = ({ result, hasMirra, hasDary, onShareWithMirra, onShareWithDary, onConvertToTable }) => {
  const resultTextRef = useRef(null);

  const handleCopy = () => {
    if (resultTextRef.current) {
      navigator.clipboard.writeText(result.text);
      toast.success('Результат скопирован в буфер обмена!');
    }
  };

  const resultTextParts = useMemo(() => {
    if (!result.text) return [];
    const regex = /```mermaid\n([\s\S]*?)\n```/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(result.text)) !== null) {
      if (match.index > lastIndex) {
        parts.push({ type: 'text', content: result.text.substring(lastIndex, match.index) });
      }
      parts.push({ type: 'mermaid', content: match[1] });
      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < result.text.length) {
      parts.push({ type: 'text', content: result.text.substring(lastIndex) });
    }
    return parts;
  }, [result.text]);
  
  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold">Результат генерации</h3>
        <div className="flex items-center gap-2">
            <button onClick={handleCopy} className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors" aria-label="Copy result">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
            </button>
            {hasMirra && (
              <button onClick={() => onShareWithMirra(result)} className="text-sm font-semibold bg-pink-100 text-pink-700 px-4 py-2 rounded-full hover:bg-pink-200 transition-colors">Обсудить с Мирраей</button>
            )}
            {hasDary && (
              <button onClick={() => onShareWithDary(result)} className="text-sm font-semibold bg-blue-100 text-blue-700 px-4 py-2 rounded-full hover:bg-blue-200 transition-colors">Анализ с Дарием</button>
            )}
        </div>
      </div>
      <div ref={resultTextRef} className="prose prose-sm max-w-none flex-grow overflow-y-auto bg-gray-50 p-4 rounded-lg border border-gray-200 min-h-[400px]">
         {resultTextParts.map((part, index) => {
            if (part.type === 'mermaid') {
                return <MermaidDiagram key={index} chart={part.content} onConvertToTable={() => onConvertToTable(part.content)} />;
            }
            // Use pre-wrap to preserve whitespace and newlines from AI output
            return <div key={index} style={{ whiteSpace: 'pre-wrap' }}>{part.content}</div>;
         })}
      </div>
       <div className="text-xs text-gray-500 mt-2 text-right">
            {result.tokenCount && <span>Токенов: {result.tokenCount} | </span>}
            {result.pageCount && <span>Страниц: {result.pageCount} | </span>}
            <span>Документ: {result.docType}</span>
      </div>
    </div>
  );
};
// #endregion


// #region Placeholder Component
const Placeholder = ({ docType }) => {
  let title = "Готовы к созданию?";
  let text = "Выберите тип документа слева и заполните необходимые поля, чтобы начать генерацию.";

  const isSpecial = [
    DocumentType.ASTROLOGY, DocumentType.BOOK_WRITING, DocumentType.PERSONAL_ANALYSIS, 
    DocumentType.DOCUMENT_ANALYSIS, DocumentType.CONSULTATION, DocumentType.TUTOR, 
    DocumentType.DO_HOMEWORK, DocumentType.SOLVE_CONTROL_WORK,
    DocumentType.SWOT_ANALYSIS, DocumentType.COMMERCIAL_PROPOSAL, DocumentType.BUSINESS_PLAN, DocumentType.MARKETING_COPY,
    DocumentType.TEXT_REWRITING, DocumentType.SCRIPT, DocumentType.AUDIO_SCRIPT,
    DocumentType.ACADEMIC_ARTICLE, DocumentType.GRANT_PROPOSAL, DocumentType.SCIENTIFIC_RESEARCH, DocumentType.TECH_IMPROVEMENT,
    DocumentType.THESIS, DocumentType.CODE_GENERATION, DocumentType.ANALYSIS_SHORT, DocumentType.ANALYSIS_VERIFY,
    DocumentType.FORECASTING
  ].includes(docType);

  if (isSpecial) {
    title = "Настройте ваш сервис";
    text = "Этот сервис требует дополнительной настройки. Используйте элементы управления в этом окне, чтобы указать все параметры.";
  }

  return (
    <div className="flex flex-col items-center justify-center h-full text-center text-gray-500 p-8">
      <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-300 mb-4">
        <path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M2 14h2"/><path d="M20 14h2"/><path d="M15 13v2"/><path d="M9 13v2"/>
      </svg>
      <h3 className="text-xl font-semibold text-gray-700">{title}</h3>
      <p className="mt-2 max-w-sm">{text}</p>
    </div>
  );
};
// #endregion


// #region Form Components
const FormWrapper = ({ title, description, children, accentColor = 'accent' }) => (
    <div className="flex flex-col h-full p-2">
        <h3 className={`text-xl font-semibold mb-2 text-center text-[var(--${accentColor})]`}>{title}</h3>
        <p className="text-sm text-center text-[var(--text-dark-secondary)] mb-4">{description}</p>
        <div className="flex-grow flex flex-col gap-4">
            {children}
        </div>
    </div>
);

const FormSubmitButton = ({ text, cost, isDisabled = false, accentColor = 'accent', onClick }) => (
    <div className="flex-shrink-0 pt-4 text-center">
        {cost !== undefined && <p className="text-sm text-[var(--text-dark-secondary)] mb-3">Стоимость: <span className="font-bold">{cost}</span> генерации</p>}
        <button type={onClick ? "button" : "submit"} onClick={onClick} disabled={isDisabled} className={`w-full max-w-sm text-white font-semibold py-3 px-4 rounded-lg transition-all bg-[var(--${accentColor})] hover:bg-[var(--${accentColor}-dark)] disabled:bg-gray-400`}>
             {text}
        </button>
     </div>
);

const Label = ({ htmlFor, children }) => <label htmlFor={htmlFor} className="block text-sm font-medium text-[var(--text-dark-secondary)] mb-1">{children}</label>;
const Input = (props) => <input {...props} className={`w-full bg-gray-50 border-2 border-gray-200 rounded-lg p-3 focus:outline-none focus:border-[var(--accent)] ${props.className}`} />;
const Textarea = (props) => <textarea {...props} className={`w-full bg-gray-50 border-2 border-gray-200 rounded-lg p-3 focus:outline-none focus:border-[var(--accent)] resize-none ${props.className}`} />;
const Select = (props) => <select {...props} className={`w-full bg-gray-50 border-2 border-gray-200 rounded-lg p-3 focus:outline-none focus:border-[var(--accent)] ${props.className}`} />;


// --- Specialist / Tutor Forms ---
const SpecialistSelector = ({ onSelect }) => {
    const specialistsByCat = useMemo(() => {
        return SPECIALISTS.reduce((acc, specialist) => {
            (acc[specialist.category] = acc[specialist.category] || []).push(specialist);
            return acc;
        }, {});
    }, []);

    return (
        <FormWrapper title="Консультация" description="Выберите специалиста, с которым хотите пообщаться.">
            <div className="flex-grow overflow-y-auto pr-2 space-y-4">
            {Object.entries(specialistsByCat).map(([category, specialists]) => (
                <div key={category}>
                    <h4 className="font-bold mb-2 text-[var(--text-dark-primary)]">{category}</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {specialists.map(specialist => (
                            <button key={specialist.id} onClick={() => onSelect(specialist)} className="text-left p-3 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
                                <p className="font-semibold">{specialist.name}</p>
                                <p className="text-xs text-gray-600">{specialist.description}</p>
                            </button>
                        ))}
                    </div>
                </div>
            ))}
            </div>
        </FormWrapper>
    );
};

const TutorSelector = ({ onSelect }) => (
    <FormWrapper title="Репетитор" description="Выберите предмет для занятия.">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {TUTOR_SUBJECTS.map(subject => (
                <button key={subject} onClick={() => onSelect(subject)} className="p-3 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors font-semibold">
                    {subject}
                </button>
            ))}
        </div>
    </FormWrapper>
);

const ChatInterface = ({ title, messages, onSendMessage, isLoading }) => {
    const [input, setInput] = useState('');
    const messagesEndRef = useRef(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);
    
    const handleSend = (e) => {
        e.preventDefault();
        if (input.trim() && !isLoading) {
            onSendMessage(input.trim());
            setInput('');
        }
    };
    
    return (
        <div className="flex flex-col h-full">
            <h3 className="text-xl font-semibold mb-4 text-center">{title}</h3>
            <div className="flex-grow overflow-y-auto p-2 bg-gray-50 rounded-lg border border-gray-200 space-y-4">
                {messages.map((msg, index) => (
                    <div key={index} className={`flex items-start gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        {msg.role === 'model' && <div className="w-8 h-8 rounded-full bg-gray-300 flex-shrink-0" />}
                        <div className={`p-3 px-4 rounded-2xl max-w-md ${msg.role === 'user' ? 'bg-[var(--accent)] text-white' : 'bg-gray-200'}`}>
                            <p className="whitespace-pre-wrap">{msg.text}</p>
                        </div>
                    </div>
                ))}
                 {isLoading && <p className="text-center text-gray-500 animate-pulse">Печатает...</p>}
                 <div ref={messagesEndRef} />
            </div>
            <form onSubmit={handleSend} className="mt-4">
                <Textarea value={input} onChange={e => setInput(e.target.value)} disabled={isLoading} placeholder="Ваше сообщение..." rows={2} />
                <button type="submit" disabled={isLoading} className="mt-2 w-full bg-[var(--accent)] text-white font-semibold py-2 px-4 rounded-lg">Отправить</button>
            </form>
        </div>
    );
};

// --- Other Simple Forms ---
const SimplePromptForm = ({ title, description, placeholder, buttonText, cost, onSubmit, accentColor }) => {
    const [prompt, setPrompt] = useState('');
    const handleSubmit = (e) => {
        e.preventDefault();
        if (!prompt.trim()) { toast.error("Пожалуйста, заполните поле."); return; }
        onSubmit(prompt);
    };
    return (
        <form onSubmit={handleSubmit} className="h-full flex flex-col">
            <FormWrapper title={title} description={description} accentColor={accentColor}>
                <Textarea value={prompt} onChange={e => setPrompt(e.target.value)} placeholder={placeholder} rows={8} />
                <FormSubmitButton text={buttonText} cost={cost} isDisabled={!prompt.trim()} accentColor={accentColor}/>
            </FormWrapper>
        </form>
    );
};


const PersonalAnalysisForm = ({ onSubmit }) => {
    const [gender, setGender] = useState('male');
    const [prompt, setPrompt] = useState('');
    const handleSubmit = (e) => {
        e.preventDefault();
        if (!prompt.trim()) { toast.error("Пожалуйста, опишите ваш запрос."); return; }
        onSubmit({ gender, userPrompt: prompt });
    };
    return (
         <form onSubmit={handleSubmit} className="h-full flex flex-col">
            <FormWrapper title="Личностный анализ" description="Опишите ситуацию, вопрос или проблему, в которой хотите разобраться." accentColor="accent-life">
                <div>
                    <Label>Ваш пол</Label>
                    <div className="flex gap-4">
                        <label><input type="radio" name="gender" value="male" checked={gender === 'male'} onChange={() => setGender('male')} className="mr-2"/>Мужской</label>
                        <label><input type="radio" name="gender" value="female" checked={gender === 'female'} onChange={() => setGender('female')} className="mr-2"/>Женский</label>
                    </div>
                </div>
                <Textarea value={prompt} onChange={e => setPrompt(e.target.value)} placeholder="Например: 'Я постоянно откладываю важные дела, помоги разобраться, почему' или 'Проанализируй мои сильные и слабые стороны на основе моего рассказа о себе...'" rows={8} />
                <FormSubmitButton text="Провести анализ" cost={1} isDisabled={!prompt.trim()} accentColor="accent-life"/>
            </FormWrapper>
        </form>
    );
};

// --- Complex Plan-Based Forms ---
const PlanReviewer = ({ plan, onGenerate, planType, accentColor }) => {
    const [editablePlan, setEditablePlan] = useState(plan);
    const sections = 'chapters' in editablePlan ? editablePlan.chapters : editablePlan.sections;
    const cost = sections.length;

    const handleSectionChange = (index, field, value) => {
        const newSections = [...sections];
        newSections[index] = { ...newSections[index], [field]: value };
        const key = 'chapters' in editablePlan ? 'chapters' : 'sections';
        setEditablePlan({ ...editablePlan, [key]: newSections });
    };

    return (
        <FormWrapper title={`План для: ${planType}`} description="Вы можете отредактировать план перед финальной генерацией.">
            <div className="flex-grow overflow-y-auto pr-2 space-y-3">
                <h4 className="text-lg font-bold">{editablePlan.title}</h4>
                {sections.map((section, index) => (
                    <div key={index} className="p-3 bg-gray-50 rounded-md border">
                        <Input value={section.title} onChange={e => handleSectionChange(index, 'title', e.target.value)} />
                        <Textarea value={section.description} onChange={e => handleSectionChange(index, 'description', e.target.value)} rows={3} className="mt-2 text-sm" />
                    </div>
                ))}
            </div>
            <FormSubmitButton text={`Сгенерировать ${planType}`} cost={cost} accentColor={accentColor} onClick={() => onGenerate(editablePlan)} />
        </FormWrapper>
    );
};

const ArticlePlanForm = ({ onSubmit, docType }) => {
    const [topic, setTopic] = useState('');
    const [hypothesis, setHypothesis] = useState('');
    const [field, setField] = useState('');
    const [sectionsCount, setSectionsCount] = useState(5);
    const [file, setFile] = useState(null);

    const isGrant = docType === DocumentType.GRANT_PROPOSAL;

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit({ topic, hypothesis, field, sectionsCount }, file);
    };

    return (
        <form onSubmit={handleSubmit} className="h-full flex flex-col">
            <FormWrapper title={isGrant ? "Заявка на грант" : "Научная статья"} description="Заполните основу для создания детального плана." accentColor="accent-science">
                <div className="flex-grow space-y-3 overflow-y-auto pr-2">
                    {isGrant && (
                        <div>
                            <Label>Файл с условиями гранта (если есть)</Label>
                            <Input type="file" onChange={e => setFile(e.target.files?.[0] || null)} accept=".pdf,.doc,.docx,.txt" />
                        </div>
                    )}
                    <div><Label>Тема</Label><Input value={topic} onChange={e => setTopic(e.target.value)} required /></div>
                    <div><Label>Гипотеза/Основная идея</Label><Textarea value={hypothesis} onChange={e => setHypothesis(e.target.value)} rows={3} required /></div>
                    <div><Label>Научная область</Label><Input value={field} onChange={e => setField(e.target.value)} required /></div>
                    <div><Label>Количество разделов</Label><Input type="number" value={sectionsCount} onChange={e => setSectionsCount(Number(e.target.value))} min="3" max="15" required /></div>
                </div>
                <FormSubmitButton text="Создать план" cost={1} accentColor="accent-science" />
            </FormWrapper>
        </form>
    );
};

const BookPlanForm = ({ onSubmit }) => {
    const [userPrompt, setUserPrompt] = useState('');
    const [genre, setGenre] = useState(BOOK_GENRES[0]);
    const [style, setStyle] = useState(BOOK_STYLES[0]);
    const [chaptersCount, setChaptersCount] = useState(10);
    const [readerAge, setReaderAge] = useState(16);

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit({ userPrompt, genre, style, chaptersCount, readerAge });
    };

    return (
        <form onSubmit={handleSubmit} className="h-full flex flex-col">
            <FormWrapper title="Написать книгу" description="Опишите вашу идею, и мы создадим для вас план книги." accentColor="accent-creative">
                <div className="flex-grow space-y-3 overflow-y-auto pr-2">
                    <div><Label>Идея, сюжет, персонажи</Label><Textarea value={userPrompt} onChange={e => setUserPrompt(e.target.value)} rows={5} required /></div>
                    <div><Label>Жанр</Label><Select value={genre} onChange={e => setGenre(e.target.value)}>{BOOK_GENRES.map(g => <option key={g} value={g}>{g}</option>)}</Select></div>
                    <div><Label>Стиль</Label><Select value={style} onChange={e => setStyle(e.target.value)}>{BOOK_STYLES.map(s => <option key={s} value={s}>{s}</option>)}</Select></div>
                    <div><Label>Количество глав</Label><Input type="number" value={chaptersCount} onChange={e => setChaptersCount(Number(e.target.value))} min="3" max="50" required /></div>
                    <div><Label>Возраст читателя</Label><Input type="number" value={readerAge} onChange={e => setReaderAge(Number(e.target.value))} min="6" max="100" required /></div>
                </div>
                <FormSubmitButton text="Создать план" cost={1} accentColor="accent-creative" />
            </FormWrapper>
        </form>
    );
};

const BusinessPlanForm = ({ onSubmit }) => {
    const [idea, setIdea] = useState('');
    const [industry, setIndustry] = useState('');
    const [sectionsCount, setSectionsCount] = useState(7);
    const handleSubmit = (e) => { e.preventDefault(); onSubmit({ idea, industry, sectionsCount }); };

    return (
        <form onSubmit={handleSubmit} className="h-full flex flex-col">
            <FormWrapper title="Бизнес-план" description="Заполните основу для создания бизнес-плана." accentColor="accent-advanced">
                 <div className="flex-grow space-y-3 overflow-y-auto pr-2">
                    <div><Label>Идея бизнеса</Label><Textarea value={idea} onChange={e => setIdea(e.target.value)} rows={4} required /></div>
                    <div><Label>Отрасль</Label><Input value={industry} onChange={e => setIndustry(e.target.value)} required /></div>
                    <div><Label>Количество разделов</Label><Input type="number" value={sectionsCount} onChange={e => setSectionsCount(Number(e.target.value))} min="3" max="15" required /></div>
                </div>
                <FormSubmitButton text="Создать план" cost={2} accentColor="accent-advanced"/>
            </FormWrapper>
        </form>
    );
};

const MarketingForm = ({ onSubmit }) => {
    const [request, setRequest] = useState({ copyType: MARKETING_TEXT_TYPES[0], product: '', audience: '', tone: TONE_OF_VOICE_OPTIONS[0], details: '' });
    const handleChange = (e) => setRequest({...request, [e.target.name]: e.target.value });
    const handleSubmit = (e) => { e.preventDefault(); onSubmit(request); };

    return (
        <form onSubmit={handleSubmit} className="h-full flex flex-col">
            <FormWrapper title="Маркетинг" description="Создайте эффективные тексты для вашего продукта." accentColor="accent-advanced">
                <div className="flex-grow space-y-3 overflow-y-auto pr-2">
                    <div><Label>Тип текста</Label><Select name="copyType" value={request.copyType} onChange={handleChange}>{MARKETING_TEXT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}</Select></div>
                    <div><Label>Продукт/Услуга</Label><Input name="product" value={request.product} onChange={handleChange} required /></div>
                    <div><Label>Целевая аудитория</Label><Input name="audience" value={request.audience} onChange={handleChange} required /></div>
                    <div><Label>Тон</Label><Select name="tone" value={request.tone} onChange={handleChange}>{TONE_OF_VOICE_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}</Select></div>
                    <div><Label>Дополнительные детали</Label><Textarea name="details" value={request.details} onChange={handleChange} rows={3} /></div>
                </div>
                <FormSubmitButton text="Создать текст" cost={1} accentColor="accent-advanced" />
            </FormWrapper>
        </form>
    );
};

const TextRewritingForm = ({ onSubmit }) => {
    const [request, setRequest] = useState({ goal: REWRITING_GOALS[0] });
    const [text, setText] = useState('');
    const [file, setFile] = useState(null);

    const handleSubmit = (e) => { e.preventDefault(); onSubmit({ ...request, originalText: text }, file); };

    return (
        <form onSubmit={handleSubmit} className="h-full flex flex-col">
            <FormWrapper title="Переработка текста" description="Улучшите свой текст: повысьте уникальность, измените стиль и т.д." accentColor="accent-creative">
                <div className="flex-grow space-y-3 overflow-y-auto pr-2">
                    <Textarea value={text} onChange={e => { setText(e.target.value); setFile(null); }} placeholder="Вставьте ваш текст сюда" rows={6} />
                    <div className="text-center text-sm text-gray-500">или</div>
                    <Input type="file" onChange={e => { setFile(e.target.files?.[0] || null); setText(''); }} accept=".txt,.doc,.docx"/>
                    <div><Label>Цель</Label><Select value={request.goal} onChange={e => setRequest({...request, goal: e.target.value})}>{REWRITING_GOALS.map(g => <option key={g} value={g}>{g}</option>)}</Select></div>
                    <div><Label>Новый стиль (опционально)</Label><Select value={request.style || ''} onChange={e => setRequest({...request, style: e.target.value})}><option value="">-- Не менять --</option>{REWRITING_STYLES.map(s => <option key={s} value={s}>{s}</option>)}</Select></div>
                </div>
                <FormSubmitButton text="Переработать" cost={1} accentColor="accent-creative" />
            </FormWrapper>
        </form>
    );
};

const AudioScriptTopicForm = ({ onSubmit }) => {
    const [topic, setTopic] = useState('');
    const [duration, setDuration] = useState(5);
    const handleSubmit = (e) => { e.preventDefault(); onSubmit(topic, duration) };

    return (
        <form onSubmit={handleSubmit} className="h-full flex flex-col">
            <FormWrapper title="Аудио скрипт (Шаг 1/2)" description="Укажите тему и желаемую длительность в минутах." accentColor="accent-creative">
                <div className="flex-grow space-y-3">
                    <div><Label>Тема</Label><Input value={topic} onChange={e => setTopic(e.target.value)} required /></div>
                    <div><Label>Длительность (минуты)</Label><Input type="number" min="1" max="60" value={duration} onChange={e => setDuration(Number(e.target.value))} required /></div>
                </div>
                <FormSubmitButton text="Далее" accentColor="accent-creative" />
            </FormWrapper>
        </form>
    );
};

const AudioScriptConfigForm = ({ onSubmit, topic, duration, remainingGenerations }) => {
    const [config, setConfig] = useState({ format: 'dialogue', type: AUDIO_SCRIPT_TYPES[0], voice1: AUDIO_VOICE_PROFILES[0].id, voice2: AUDIO_VOICE_PROFILES[1].id });
    const cost = Math.max(2, Math.ceil(duration / 5) * 2);
    const handleSubmit = (e) => { e.preventDefault(); onSubmit(config) };

    return (
        <form onSubmit={handleSubmit} className="h-full flex flex-col">
            <FormWrapper title="Аудио скрипт (Шаг 2/2)" description={`Тема: "${topic}" (${duration} мин.)`} accentColor="accent-creative">
                <div className="flex-grow space-y-3 overflow-y-auto pr-2">
                    <div><Label>Формат</Label><Select value={config.format} onChange={e => setConfig({...config, format: e.target.value, voice2: e.target.value === 'monologue' ? undefined : config.voice2})}>{['dialogue', 'monologue'].map(f => <option key={f} value={f}>{f}</option>)}</Select></div>
                    <div><Label>Тип</Label><Select value={config.type} onChange={e => setConfig({...config, type: e.target.value})}>{AUDIO_SCRIPT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}</Select></div>
                    <div><Label>Голос 1</Label><Select value={config.voice1} onChange={e => setConfig({...config, voice1: e.target.value})}>{AUDIO_VOICE_PROFILES.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}</Select></div>
                    {config.format === 'dialogue' && <div><Label>Голос 2</Label><Select value={config.voice2} onChange={e => setConfig({...config, voice2: e.target.value})}>{AUDIO_VOICE_PROFILES.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}</Select></div>}
                </div>
                <FormSubmitButton text="Создать скрипт" cost={cost} isDisabled={cost > remainingGenerations} accentColor="accent-creative" />
            </FormWrapper>
        </form>
    )
};

const CodeGenerationForm = ({ onSubmit }) => {
    const [language, setLanguage] = useState(PROGRAMMING_LANGUAGES[0]);
    const [taskDescription, setTaskDescription] = useState('');
    const handleSubmit = (e) => { e.preventDefault(); onSubmit({ language, taskDescription }) };
    return (
        <form onSubmit={handleSubmit} className="h-full flex flex-col">
            <FormWrapper title="Генерация кода" description="Опишите задачу, и мы напишем код для вас." accentColor="accent-code">
                 <div className="flex-grow space-y-3 overflow-y-auto pr-2">
                    <div><Label>Язык программирования</Label><Select value={language} onChange={e => setLanguage(e.target.value)}>{PROGRAMMING_LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}</Select></div>
                    <div><Label>Описание задачи</Label><Textarea value={taskDescription} onChange={e => setTaskDescription(e.target.value)} rows={8} required /></div>
                </div>
                <FormSubmitButton text="Анализ задачи" cost={1} accentColor="accent-code" />
            </FormWrapper>
        </form>
    );
};

const CodeAnalysisReview = ({ analysis, onConfirm, onCancel, remainingGenerations }) => {
    return (
        <FormWrapper title="Анализ задачи" description="Мы проанализировали вашу задачу. Вот результат:" accentColor="accent-code">
            <div className="flex-grow space-y-3 overflow-y-auto pr-2 bg-gray-50 p-3 rounded-lg border">
                <div><h5 className="font-bold">План реализации:</h5><p className="text-sm whitespace-pre-wrap">{analysis.plan}</p></div>
                <div><h5 className="font-bold">Сложность:</h5><p className="text-sm">{analysis.complexity}</p></div>
                <div><h5 className="font-bold">Стоимость генерации:</h5><p className="text-sm">{analysis.cost} генераций</p></div>
            </div>
            <div className="pt-4 flex-shrink-0 flex items-center justify-center gap-4">
                <button type="button" onClick={onCancel} className="bg-gray-200 text-gray-800 font-semibold py-2 px-6 rounded-lg">Отмена</button>
                <button type="button" onClick={onConfirm} disabled={analysis.cost > remainingGenerations} className="bg-[var(--accent-code)] text-white font-semibold py-2 px-6 rounded-lg disabled:bg-gray-400">Сгенерировать</button>
            </div>
        </FormWrapper>
    )
}

// #endregion


export const ResultDisplay = (props) => {
  const { docType } = props;

  if (props.error) {
    return (
      <div className="p-4 text-center text-red-600 bg-red-50 rounded-lg">
        <h3 className="font-bold">Произошла ошибка</h3>
        <p className="text-sm mt-2">{props.error}</p>
      </div>
    );
  }

  // --- File Upload Forms ---
  const fileUploaders = {
    [DocumentType.DO_HOMEWORK]: <FileUploadForm title="Сделать ДЗ" description="Загрузите файлы с домашним заданием" promptLabel="Ваши инструкции" promptPlaceholder="Например: 'Реши задачу №5', 'Напиши сочинение по теме из файла'" buttonText="Решить" cost={2} maxFiles={5} maxFileSizeMB={10} acceptedFileTypes=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png" accentColor="accent" icon={<span className="text-4xl">📚</span>} remainingGenerations={props.remainingGenerations} onSubmit={props.onFileTaskSubmit} />,
    [DocumentType.SOLVE_CONTROL_WORK]: <FileUploadForm title="Решить КР/ПР" description="Загрузите фото или документ с контрольной работой" promptLabel="Ваши инструкции (необязательно)" promptPlaceholder="Например: 'Нужно решить все задания'" buttonText="Решить" cost={1} maxFiles={5} maxFileSizeMB={10} acceptedFileTypes=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png" accentColor="accent" icon={<span className="text-4xl">📝</span>} remainingGenerations={props.remainingGenerations} onSubmit={props.onFileTaskSubmit} />,
    [DocumentType.DOCUMENT_ANALYSIS]: <FileUploadForm title="Доктор" description="Загрузите один или несколько документов для анализа (например, результаты анализов, выписки)." promptLabel="Что вы хотите узнать?" promptPlaceholder="Например: 'Расшифруй анализы', 'Что означают эти показатели?'" buttonText="Проанализировать" cost={2} maxFiles={10} maxFileSizeMB={10} acceptedFileTypes=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png" accentColor="accent-life" icon={<span className="text-4xl">🩺</span>} remainingGenerations={props.remainingGenerations} onSubmit={props.onDocAnalysisSubmit} />,
    [DocumentType.SCIENTIFIC_RESEARCH]: <FileUploadForm title="Изыскание" description="Загрузите научные статьи, данные или другие материалы для проведения изыскания." promptLabel="Цель изыскания" promptPlaceholder="Например: 'Провести литературный обзор по теме', 'Найти противоречия в данных'" buttonText="Начать изыскание" cost={2} maxFiles={10} maxFileSizeMB={10} acceptedFileTypes=".pdf,.doc,.docx,.txt" accentColor="accent-science" icon={<span className="text-4xl">🔬</span>} remainingGenerations={props.remainingGenerations} onSubmit={props.onScienceFileTaskSubmit} />,
    [DocumentType.TECH_IMPROVEMENT]: <FileUploadForm title="Улучшение технологии" description="Загрузите описание существующей технологии, патенты или статьи." promptLabel="Что нужно улучшить?" promptPlaceholder="Например: 'Предложи способы повышения эффективности', 'Найди уязвимости'" buttonText="Предложить улучшения" cost={2} maxFiles={10} maxFileSizeMB={10} acceptedFileTypes=".pdf,.doc,.docx,.txt" accentColor="accent-science" icon={<span className="text-4xl">💡</span>} remainingGenerations={props.remainingGenerations} onSubmit={props.onScienceFileTaskSubmit} />,
    [DocumentType.ANALYSIS_SHORT]: <FileUploadForm title="Кратко по сути" description="Загрузите один или несколько документов, чтобы получить краткую выжимку." promptLabel="На что обратить внимание? (необязательно)" promptPlaceholder="Например: 'Сконцентрируйся на выводах', 'Выдели ключевые цифры'" buttonText="Сделать выжимку" cost={2} maxFiles={10} maxFileSizeMB={10} acceptedFileTypes=".pdf,.doc,.docx,.txt" accentColor="accent-advanced" icon={<span className="text-4xl">🎯</span>} remainingGenerations={props.remainingGenerations} onSubmit={props.onAnalysisSubmit} />,
    [DocumentType.ANALYSIS_VERIFY]: <FileUploadForm title="Достоверность" description="Загрузите текст или статью для проверки на достоверность и поиск первоисточников." promptLabel="Тема или ключевые утверждения для проверки" promptPlaceholder="Например: 'Проверь статистику в разделе 2', 'Найди источники для этих цитат'" buttonText="Проверить" cost={3} maxFiles={10} maxFileSizeMB={10} acceptedFileTypes=".pdf,.doc,.docx,.txt" accentColor="accent-advanced" icon={<span className="text-4xl">🛡️</span>} remainingGenerations={props.remainingGenerations} onSubmit={props.onAnalysisSubmit} />,
    [DocumentType.SCRIPT]: <FileUploadForm title="Анализ" description="Загрузите сценарий, идеи или наброски для анализа и получения рекомендаций." promptLabel="Что вы хотите получить?" promptPlaceholder="Например: 'Оцени диалоги', 'Предложи развитие сюжета', 'Найди слабые места'" buttonText="Проанализировать" cost={2} maxFiles={5} maxFileSizeMB={10} acceptedFileTypes=".pdf,.doc,.docx,.txt" accentColor="accent-creative" icon={<span className="text-4xl">🎬</span>} remainingGenerations={props.remainingGenerations} onSubmit={(files, prompt) => props.onCreativeFileTaskSubmit(files, prompt)} />,
  };
  
  if (fileUploaders[docType]) {
    return fileUploaders[docType];
  }

  // --- Step-based flows ---
  if (docType === DocumentType.ASTROLOGY) {
    if (props.astrologyStep === 'selection') return <AstrologySelection onSelect={props.onAstrologySelect} />;
    if (props.astrologyStep === 'natal_form') return <NatalForm onSubmit={props.onNatalSubmit} />;
    if (props.astrologyStep === 'horoscope_form') return <HoroscopeForm onSubmit={props.onHoroscopeSubmit} />;
  }
  
  if (docType === DocumentType.THESIS && props.thesisStep === 'form') {
      return <ThesisForm onSubmit={props.onThesisSubmit} remainingGenerations={props.remainingGenerations}/>
  }
  
  if (docType === DocumentType.PERSONAL_ANALYSIS && props.personalAnalysisStep === 'form') {
      return <PersonalAnalysisForm onSubmit={props.onPersonalAnalysisSubmit} />;
  }

  if (docType === DocumentType.CONSULTATION) {
      if (props.consultationStep === 'selection') return <SpecialistSelector onSelect={props.onSpecialistSelect} />;
      if (props.consultationStep === 'chatting' && props.selectedSpecialist) return <ChatInterface title={props.selectedSpecialist.name} messages={props.chatMessages} onSendMessage={props.onSendMessage} isLoading={props.isLoading} />;
  }
  
  if (docType === DocumentType.TUTOR) {
      if (props.tutorStep === 'subject_selection') return <TutorSelector onSelect={props.onSubjectSelect} />;
      if (props.tutorStep === 'chatting' && props.selectedSubject) return <ChatInterface title={`Репетитор: ${props.selectedSubject}`} messages={props.tutorChatMessages} onSendMessage={props.onTutorSendMessage} isLoading={props.isLoading} />;
  }

  if ([DocumentType.ACADEMIC_ARTICLE, DocumentType.GRANT_PROPOSAL].includes(docType)) {
      if (props.scienceStep === 'article_form') return <ArticlePlanForm onSubmit={props.onArticlePlanSubmit} docType={docType} />;
      if (props.scienceStep === 'plan_review' && props.articlePlan) return <PlanReviewer plan={props.articlePlan} onGenerate={props.onGenerateArticle} planType="статью" accentColor="accent-science" />;
  }
  
  if (docType === DocumentType.BOOK_WRITING) {
      if (props.bookWritingStep === 'form') return <BookPlanForm onSubmit={props.onPlanSubmit} />;
      if (props.bookWritingStep === 'plan_review' && props.bookPlan) return <PlanReviewer plan={props.bookPlan} onGenerate={props.onGenerateBook} planType="книгу" accentColor="accent-creative" />;
  }
  
  if (docType === DocumentType.BUSINESS_PLAN) {
      if (props.businessStep === 'business_plan_form') return <BusinessPlanForm onSubmit={props.onBusinessPlanSubmit} />;
      if (props.businessStep === 'plan_review' && props.businessPlan) return <PlanReviewer plan={props.businessPlan} onGenerate={props.onGenerateBusinessPlan} planType="бизнес-план" accentColor="accent-advanced" />;
  }
  
  if (docType === DocumentType.SWOT_ANALYSIS && props.businessStep === 'swot_form') {
      return <SimplePromptForm title="SWOT-анализ" description="Опишите вашу компанию, продукт или идею для проведения анализа." placeholder="Например: 'Онлайн-школа по программированию для детей...'" buttonText="Провести анализ" cost={2} onSubmit={(prompt) => props.onSwotSubmit({ description: prompt })} accentColor="accent-advanced" />;
  }
  
  if (docType === DocumentType.COMMERCIAL_PROPOSAL && props.businessStep === 'proposal_form') {
      const Form = () => {
          const [req, setReq] = useState({ product: '', client: '', goals: '' });
          const handleSubmit = (e) => { e.preventDefault(); props.onCommercialProposalSubmit(req); };
          return (
              <form onSubmit={handleSubmit} className="h-full flex flex-col"><FormWrapper title="Коммерческое предложение" description="Заполните данные для создания предложения." accentColor="accent-advanced">
                  <div className="flex-grow space-y-3 overflow-y-auto pr-2">
                      <div><Label>Продукт/Услуга</Label><Input value={req.product} onChange={e => setReq({...req, product: e.target.value})} required /></div>
                      <div><Label>Описание клиента</Label><Input value={req.client} onChange={e => setReq({...req, client: e.target.value})} required /></div>
                      <div><Label>Цели предложения</Label><Textarea value={req.goals} onChange={e => setReq({...req, goals: e.target.value})} rows={4} required /></div>
                  </div>
                  <FormSubmitButton text="Создать предложение" cost={2} accentColor="accent-advanced" />
              </FormWrapper></form>
          );
      };
      return <Form />;
  }
  
  if (docType === DocumentType.MARKETING_COPY && props.businessStep === 'marketing_form') {
      return <MarketingForm onSubmit={props.onMarketingSubmit} />;
  }
  
  if (docType === DocumentType.TEXT_REWRITING && props.creativeStep === 'rewriting_form') {
      return <TextRewritingForm onSubmit={props.onRewritingSubmit} />;
  }

  if (docType === DocumentType.AUDIO_SCRIPT) {
      if (props.creativeStep === 'audio_script_topic') return <AudioScriptTopicForm onSubmit={props.onAudioScriptTopicSubmit} />;
      if (props.creativeStep === 'audio_script_config' && props.audioScriptRequest.topic && props.audioScriptRequest.duration) {
          return <AudioScriptConfigForm onSubmit={props.onAudioScriptSubmit} topic={props.audioScriptRequest.topic} duration={props.audioScriptRequest.duration} remainingGenerations={props.remainingGenerations}/>;
      }
  }

  if (docType === DocumentType.CODE_GENERATION) {
      if (props.codeStep === 'form') return <CodeGenerationForm onSubmit={props.onCodeSubmit} />;
      if (props.codeStep === 'review' && props.codeAnalysis) return <CodeAnalysisReview analysis={props.codeAnalysis} onConfirm={props.onGenerateCode} onCancel={props.onCancelCodeAnalysis} remainingGenerations={props.remainingGenerations} />;
  }

  if (docType === DocumentType.FORECASTING && props.forecastingStep === 'form') {
      return <SimplePromptForm title="Прогнозирование" description="Опишите ситуацию и данные для построения прогноза. Используйте поисковые запросы для доступа к актуальной информации." placeholder="Например: 'прогноз цен на нефть на следующий квартал', 'перспективы рынка электромобилей в России до 2030 года'" buttonText="Сделать прогноз" cost={3} onSubmit={props.onForecastSubmit} accentColor="accent-life" />;
  }

  return <Placeholder docType={docType} />;
};