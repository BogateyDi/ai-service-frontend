import React, { useState, useCallback, useEffect } from 'react';
import { TextGeneratorForm } from './TextGeneratorForm.js';
import { ResultDisplay, ResultViewer } from './ResultDisplay.js';
import { 
    generateText,
    generateNatalChart, generateHoroscope, generateBookPlan, generateSingleChapter, 
    calculateTextMetrics, solveTaskFromFiles, generateSwotAnalysis,
    generateCommercialProposal, generateBusinessPlan, generateSingleBusinessSection,
    generateMarketingCopy, rewriteText, generateArticlePlan, generateSingleArticleSection, 
    generateCode, analyzeCodeTask, generateFullThesis, analyzeScienceTaskFromFiles,
    analyzeCreativeTaskFromFiles, generatePersonalAnalysis, analyzeUserDocuments,
    sendSpecialistMessage, generateGrantPlan, generateAudioScript, performAnalysis,
    generateForecasting,
    convertMermaidToTable
} from '../services/geminiService.js';
import { STUDENT_DOC_TYPES_STANDARD, STUDENT_DOC_TYPES_INTERACTIVE, ADULT_CATEGORIES, DOC_TYPES_BY_ADULT_CATEGORY, CHILDREN_AGES } from '../constants.js';
import { toast } from 'react-hot-toast';
import { GenerationProgressModal } from './GenerationProgressModal.js';


const findCategoryForDocType = (docTypeToFind) => {
    for (const category in DOC_TYPES_BY_ADULT_CATEGORY) {
        if (DOC_TYPES_BY_ADULT_CATEGORY[category].includes(docTypeToFind)) {
            return category;
        }
    }
    return null;
};


const SwitcherButton = ({ activeValue, value, onClick, children }) => {
  return (
    <button
      type="button"
      onClick={() => onClick(value)}
      className={`w-1/2 px-4 py-2 text-sm font-medium rounded-lg transition-colors duration-300 focus:outline-none ${
        activeValue === value ? 'text-white' : 'text-[var(--text-dark-secondary)] hover:text-[var(--text-dark-primary)]'
      }`}
    >
      {children}
    </button>
  );
};


const AudienceSwitch = ({ activeAudience, onAudienceChange, isDisabled }) => {
  return (
    <div className={`relative flex items-center bg-gray-100 rounded-xl w-full p-1 border border-gray-200 shadow-sm transition-opacity duration-300 ${isDisabled ? 'opacity-50 pointer-events-none' : ''}`}>
      <div
        className="absolute top-1 h-[calc(100%-8px)] w-[calc(50%-4px)] bg-[var(--accent)] shadow-md rounded-lg transition-transform duration-300 ease-in-out"
        style={{ transform: activeAudience === 'children' ? 'translateX(4px)' : 'translateX(calc(100% + 4px))' }}
      />
      <div className="relative flex w-full z-10">
        <SwitcherButton activeValue={activeAudience} value="children" onClick={onAudienceChange}>Дети</SwitcherButton>
        <SwitcherButton activeValue={activeAudience} value="adults" onClick={onAudienceChange}>Взрослые</SwitcherButton>
      </div>
    </div>
  );
};

// Helper function to add delays
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export const GeneratorView = ({ isLoggedIn, remainingGenerations, useGeneration, onBuyGenerations, result, setResult, onSaveGeneration, onGenerationStateChange, hasMirra, onShareWithMirra, hasDary, onShareWithDary, initialDocType, initialAge, onInitialDocTypeHandled }) => {
  const [audience, setAudience] = useState('children');
  const [docType, setDocType] = useState(STUDENT_DOC_TYPES_STANDARD[0]);
  const [adultCategory, setAdultCategory] = useState(ADULT_CATEGORIES[0]);
  const [age, setAge] = useState(CHILDREN_AGES[6]); // Default to 12. Lifted state.
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [progressMessage, setProgressMessage] = useState('');
  
  // State for special flows
  const [astrologyStep, setAstrologyStep] = useState('none');
  const [bookWritingStep, setBookWritingStep] = useState('none');
  const [personalAnalysisStep, setPersonalAnalysisStep] = useState('none');
  const [docAnalysisStep, setDocAnalysisStep] = useState('none');
  const [consultationStep, setConsultationStep] = useState('none');
  const [tutorStep, setTutorStep] = useState('none');
  const [fileTaskStep, setFileTaskStep] = useState('none');
  const [businessStep, setBusinessStep] = useState('none');
  const [creativeStep, setCreativeStep] = useState('none');
  const [scienceStep, setScienceStep] = useState('none');
  const [scienceFileStep, setScienceFileStep] = useState('none');
  const [codeStep, setCodeStep] = useState('none');
  const [thesisStep, setThesisStep] = useState('none');
  const [analysisStep, setAnalysisStep] = useState('none');
  const [forecastingStep, setForecastingStep] = useState('none');
  
  const [bookPlan, setBookPlan] = useState(null);
  const [businessPlan, setBusinessPlan] = useState(null);
  const [articlePlan, setArticlePlan] = useState(null);
  const [codeAnalysis, setCodeAnalysis] = useState(null);
  const [codeRequest, setCodeRequest] = useState(null);
  const [audioScriptRequest, setAudioScriptRequest] = useState({});

  // Consultation state
  const [selectedSpecialist, setSelectedSpecialist] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  
  // Tutor state
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [tutorChatMessages, setTutorChatMessages] = useState([]);

  const resetAllFlows = useCallback(() => {
      setResult(null);
      setError('');
      setIsLoading(false);
      setProgressMessage('');
      setAstrologyStep('none');
      setBookWritingStep('none');
      setPersonalAnalysisStep('none');
      setDocAnalysisStep('none');
      setConsultationStep('none');
      setTutorStep('none');
      setFileTaskStep('none');
      setBusinessStep('none');
      setCreativeStep('none');
      setScienceStep('none');
      setScienceFileStep('none');
      setCodeStep('none');
      setThesisStep('none');
      setAnalysisStep('none');
      setForecastingStep('none');
      setBookPlan(null);
      setBusinessPlan(null);
      setArticlePlan(null);
      setCodeAnalysis(null);
      setCodeRequest(null);
      setAudioScriptRequest({});
      setSelectedSpecialist(null);
      setChatMessages([]);
      setSelectedSubject(null);
      setTutorChatMessages([]);
  }, [setResult]);
  
  const handleGenerationStart = useCallback((message) => {
    setIsLoading(true);
    setResult(null);
    setError('');
    setProgressMessage(message);
  }, [setResult]);

  const handleAudienceChange = useCallback((newAudience) => {
    setAudience(newAudience);
    resetAllFlows();
    if (newAudience === 'children') {
        setDocType(STUDENT_DOC_TYPES_STANDARD[0]);
        setAge(CHILDREN_AGES[6]); // Reset age on switch, default to 12
    } else {
        const defaultCategory = ADULT_CATEGORIES[0];
        setAdultCategory(defaultCategory);
        setDocType(DOC_TYPES_BY_ADULT_CATEGORY[defaultCategory][0]);
    }
  }, [resetAllFlows]);

  const handleDocTypeChange = useCallback((newDocType) => {
    setDocType(newDocType);
    resetAllFlows();
  }, [resetAllFlows]);
  
  // This effect ensures that when the user logs out, all active flows are reset.
  useEffect(() => {
    if (!isLoggedIn) {
      resetAllFlows();
    }
  }, [isLoggedIn, resetAllFlows]);

  // Effect to handle navigation from another view (e.g., Assistant favorites)
  useEffect(() => {
    if (initialDocType && isLoggedIn && onInitialDocTypeHandled) {
      resetAllFlows();

      const isChildType = STUDENT_DOC_TYPES_STANDARD.includes(initialDocType) || STUDENT_DOC_TYPES_INTERACTIVE.includes(initialDocType);
      
      if (isChildType) {
        setAudience('children');
        if (initialAge) {
          setAge(initialAge);
        } else {
          setAge(CHILDREN_AGES[6]); // Default age if not provided
        }
      } else {
        setAudience('adults');
        const category = findCategoryForDocType(initialDocType);
        if (category) {
            setAdultCategory(category);
        }
      }
      
      setDocType(initialDocType);
      onInitialDocTypeHandled();
    }
  }, [initialDocType, initialAge, isLoggedIn, resetAllFlows, onInitialDocTypeHandled]);


  const handleStandardSubmit = useCallback(async (topic, currentAge) => {
    if (useGeneration(1)) {
        handleGenerationStart("Создание текста...");
        try {
            const res = await generateText(docType, topic, currentAge, setProgressMessage);
            setResult(res);
            onSaveGeneration({ docType, title: topic, text: res.text });
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : JSON.stringify(err);
            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    }
  }, [useGeneration, docType, handleGenerationStart, onSaveGeneration, setResult]);
  
  const handleConvertToTable = useCallback(async (brokenDiagramCode) => {
    if (useGeneration(1)) {
        handleGenerationStart("Конвертируем диаграмму в таблицу...");
        try {
            const tableMarkdown = await convertMermaidToTable(brokenDiagramCode);
            if (result && result.text) {
                const blockToReplace = `\`\`\`mermaid\n${brokenDiagramCode}\n\`\`\``;
                
                const newText = result.text.replace(blockToReplace, tableMarkdown);

                const newResult = {
                    ...result,
                    text: newText,
                };
                setResult(newResult);
                
                if (newText !== result.text) {
                    toast.success('Диаграмма заменена таблицей!');
                } else {
                    toast.error('Не удалось автоматически заменить диаграмму. Таблица добавлена в конец ответа.');
                    const fallbackText = result.text + '\n\n### Таблица из диаграммы\n\n' + tableMarkdown;
                    const fallbackResult = { ...result, text: fallbackText };
                    setResult(fallbackResult);
                }
            } else {
                 toast.error('Не удалось найти исходный текст для замены.');
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : JSON.stringify(err);
            setError(errorMessage);
            toast.error('Не удалось сконвертировать диаграмму.');
        } finally {
            setIsLoading(false);
            setProgressMessage("");
        }
    }
  }, [result, useGeneration, setResult, handleGenerationStart]);

  // --- Astrology Flow ---
  const handleStartAstrology = useCallback(() => {
      resetAllFlows();
      if (remainingGenerations < 1) { 
          setError('Недостаточно генераций для астрологического прогноза.');
          return;
      }
      setAstrologyStep('selection');
  }, [resetAllFlows, remainingGenerations]);
  
  const handleAstrologySelect = useCallback((type) => {
      if (type === 'natal') {
          if (remainingGenerations < 2) {
              setError('Для натальной карты необходимо 2 генерации.');
              setAstrologyStep('selection'); 
              return;
          }
          setAstrologyStep('natal_form');
      } else {
          setAstrologyStep('horoscope_form');
      }
       setError('');
  }, [remainingGenerations]);
  
  const handleNatalSubmit = useCallback(async (data) => {
      if (useGeneration(2)) {
          handleGenerationStart('Составляем вашу натальную карту...');
          setAstrologyStep('generating');
          try {
              const res = await generateNatalChart(data.date, data.time, data.place, setProgressMessage);
              setResult(res);
              onSaveGeneration({ docType: docType, title: 'Натальная карта', text: res.text });
              setAstrologyStep('completed');
          } catch (err) {
              const msg = err instanceof Error ? err.message : JSON.stringify(err);
              setError(msg);
              setAstrologyStep('natal_form');
          } finally {
              setIsLoading(false);
          }
      }
  }, [useGeneration, handleGenerationStart, onSaveGeneration, setResult, docType]);
  
  const handleHoroscopeSubmit = useCallback(async (data) => {
      if (useGeneration(1)) {
          handleGenerationStart('Составляем ваш гороскоп...');
          setAstrologyStep('generating');
          try {
              const res = await generateHoroscope(data.date, setProgressMessage);
              setResult(res);
              onSaveGeneration({ docType: docType, title: 'Гороскоп', text: res.text });
              setAstrologyStep('completed');
          } catch (err) {
              const msg = err instanceof Error ? err.message : JSON.stringify(err);
              setError(msg);
              setAstrologyStep('horoscope_form');
          } finally {
              setIsLoading(false);
          }
      }
  }, [useGeneration, handleGenerationStart, onSaveGeneration, setResult, docType]);

  // --- Book Writing Flow ---
   const handleStartBookWriting = useCallback(() => {
    resetAllFlows();
    setBookWritingStep('form');
  }, [resetAllFlows]);
  
  const handlePlanSubmit = useCallback(async (request) => {
      if (useGeneration(1)) {
          handleGenerationStart('Создаем план вашей будущей книги...');
          try {
              const plan = await generateBookPlan(request, setProgressMessage);
              setBookPlan({ ...plan, genre: request.genre, style: request.style, readerAge: request.readerAge });
              setBookWritingStep('plan_review');
          } catch (err) {
              const msg = err instanceof Error ? err.message : JSON.stringify(err);
              setError(msg);
              setBookWritingStep('form');
          } finally {
              setIsLoading(false);
          }
      }
  }, [useGeneration, handleGenerationStart]);

  const handleGenerateBook = useCallback(async (editedPlan) => {
      if (!bookPlan) {
          setError('Исходные данные для книги отсутствуют.');
          return;
      }
      
      const { genre, style, readerAge } = bookPlan;
      const cost = editedPlan.chapters.length;
      if (useGeneration(cost)) {
          handleGenerationStart(`Подготовка к написанию книги...`);
          setBookWritingStep('generating_chapters');
          let fullBookText = `# ${editedPlan.title}\n\n`;

          try {
              for (let i = 0; i < editedPlan.chapters.length; i++) {
                  const chapter = editedPlan.chapters[i];
                  setProgressMessage(`Пишем главу ${i + 1}/${cost}: "${chapter.title}"...`);
                  const chapterText = await generateSingleChapter(chapter, editedPlan.title, genre, style, readerAge);
                  fullBookText += `## ${chapter.title}\n\n${chapterText}\n\n`;
                  setProgressMessage(`Глава ${i + 1} написана.`);
                  if (i < editedPlan.chapters.length - 1) {
                      await wait(1000); 
                  }
              }

              const metrics = calculateTextMetrics(fullBookText);
              const finalResult = {
                  docType: docType,
                  text: fullBookText,
                  uniqueness: 0,
                  ...metrics,
                  plan: editedPlan
              };
              setResult(finalResult);
              onSaveGeneration({ docType: docType, title: editedPlan.title, text: finalResult.text });
              setBookWritingStep('completed');

          } catch (err) {
              const msg = err instanceof Error ? err.message : JSON.stringify(err);
              setError(msg);
              setBookWritingStep('plan_review');
          } finally {
            setIsLoading(false);
          }
      }
  }, [useGeneration, bookPlan, handleGenerationStart, onSaveGeneration, setResult, docType]);
  
    // --- Personal Analysis Flow ---
  const handleStartPersonalAnalysis = useCallback(() => {
      resetAllFlows();
      if (remainingGenerations < 1) { 
          setError('Недостаточно генераций для личностного анализа.');
          return;
      }
      setPersonalAnalysisStep('form');
  }, [resetAllFlows, remainingGenerations]);

  const handlePersonalAnalysisSubmit = useCallback(async (request) => {
      const COST = 1;
      if (useGeneration(COST)) {
          handleGenerationStart('Проводим личностный анализ...');
          setPersonalAnalysisStep('generating');
          try {
              const res = await generatePersonalAnalysis(request, setProgressMessage);
              setResult(res);
              onSaveGeneration({ docType: docType, title: `Анализ: "${request.userPrompt.slice(0, 40)}..."`, text: res.text });
              setPersonalAnalysisStep('completed');
          } catch (err) {
              const msg = err instanceof Error ? err.message : JSON.stringify(err);
              setError(msg);
              setPersonalAnalysisStep('form');
          } finally {
            setIsLoading(false);
          }
      }
  }, [useGeneration, handleGenerationStart, onSaveGeneration, setResult, docType]);

  // --- Document Analysis Flow ---
    const handleStartDocAnalysis = useCallback(() => {
        resetAllFlows();
        const COST = 2; // Analysis cost
        if (remainingGenerations < COST) {
            setError(`Для анализа документов необходимо ${COST} генерации.`);
            return;
        }
        setDocAnalysisStep('upload_form');
    }, [resetAllFlows, remainingGenerations]);

    const handleDocAnalysisSubmit = useCallback(async (files, prompt) => {
        const COST = 2;
        if (useGeneration(COST)) {
            handleGenerationStart('Анализируем ваши документы...');
            setDocAnalysisStep('generating');
            try {
                const res = await analyzeUserDocuments(files, prompt, setProgressMessage);
                setResult(res);
                onSaveGeneration({ docType: docType, title: `Анализ документов: "${prompt.slice(0, 40)}..."`, text: res.text });
                setDocAnalysisStep('completed');
            } catch (err) {
                const msg = err instanceof Error ? err.message : JSON.stringify(err);
                setError(msg);
                setDocAnalysisStep('upload_form');
            } finally {
                setIsLoading(false);
            }
        }
    }, [useGeneration, handleGenerationStart, onSaveGeneration, setResult, docType]);

  // --- Consultation Flow ---
    const handleStartConsultation = useCallback(() => {
        resetAllFlows();
        if (remainingGenerations < 1) {
            setError('Недостаточно генераций для начала консультации.');
            return;
        }
        setConsultationStep('selection');
    }, [resetAllFlows, remainingGenerations]);
    
    const handleSpecialistSelect = useCallback((specialist) => {
        setSelectedSpecialist(specialist);
        setChatMessages([{
            role: 'model',
            text: `Здравствуйте! Я ваш виртуальный ассистент в роли "${specialist.name.toLowerCase()}". Чем могу помочь?`
        }]);
        setConsultationStep('chatting');
    }, []);

    const handleSendMessage = useCallback(async (messageText) => {
        if (!selectedSpecialist) {
            setError("Сессия чата неактивна. Пожалуйста, начните заново.");
            return;
        }
        if (useGeneration(1)) {
            setIsLoading(true);
            const userMessage = { role: 'user', text: messageText };
            const newHistory = [...chatMessages, userMessage];
            setChatMessages(newHistory);
            
            try {
                const result = await sendSpecialistMessage({ specialist: selectedSpecialist, history: newHistory }, messageText);
                const modelMessage = { role: 'model', text: result.text, sources: result.sources };
                setChatMessages(prev => [...prev, modelMessage]);
            } catch (err) {
                const msg = err instanceof Error ? err.message : JSON.stringify(err);
                setError(msg);
                setChatMessages(prev => [...prev, { role: 'model', text: `Ошибка: ${msg}` }]);
            } finally {
                setIsLoading(false);
            }
        }
    }, [selectedSpecialist, chatMessages, useGeneration]);

  // --- Tutor Flow ---
    const handleStartTutor = useCallback(() => {
        resetAllFlows();
        if (remainingGenerations < 1) {
            setError('Недостаточно генераций для начала занятия с репетитором.');
            return;
        }
        setTutorStep('subject_selection');
    }, [resetAllFlows, remainingGenerations]);

    const handleSubjectSelect = useCallback((subject) => {
        setSelectedSubject(subject);
        const introMessage = `Привет! Я твой личный репетитор по предмету "${subject}". Очень рад нашему знакомству! 😊\n\nТы можешь задавать мне любые вопросы по этой теме, просить объяснить сложный материал или помочь с домашним заданием. Мы будем разбираться во всем вместе, шаг за шагом. Не стесняйся спрашивать, если что-то непонятно! \n\nС чего начнем?`;
        setTutorChatMessages([{ role: 'model', text: introMessage }]);
        setTutorStep('chatting');
    }, []);

    const handleTutorSendMessage = useCallback(async (messageText) => {
        if (!selectedSubject) {
            setError("Сессия с репетитором неактивна. Пожалуйста, начните заново.");
            return;
        }
        if (useGeneration(1)) {
            setIsLoading(true);
            const userMessage = { role: 'user', text: messageText };
            const newHistory = [...tutorChatMessages, userMessage];
            setTutorChatMessages(newHistory);

            const systemInstruction = `Вы — «Репетитор-Помощник», дружелюбный и очень терпеливый наставник по предмету **${selectedSubject}**. Ваша задача — помогать ученику (возраст: **${age}** лет) понять материал, а не просто давать готовые ответы.

**Ваша личность и стиль общения:**
1.  **Дружелюбие и Поддержка:** Вы всегда обращаетесь к ученику в ободряющей и позитивной манере. Используйте слова "Отлично!", "Хороший вопрос!", "Давай разберемся вместе". Ваша цель — создать безопасное пространство, где ученик не боится ошибаться.
2.  **Адаптация под возраст:** Ваш язык и примеры должны быть понятны ребенку ${age} лет. Избегайте слишком сложных терминов. Если используете термин, сразу объясняйте его простым языком.
3.  **Интерактивность:** Задавайте встречные вопросы, чтобы проверить понимание. Например: "Как ты думаешь, почему это так работает?", "Можешь привести свой пример?".
4.  **Человечность:** Будьте учтивым и открытым. Помогайте ребенку не только с предметом, но и с развитием любознательности.

**Ваш рабочий процесс:**
1.  **Объяснение на примерах:** Когда объясняете тему, всегда используйте наглядные примеры из жизни или простые аналогии, понятные ребенку.
2.  **Пошаговый подход:** Если ученик просит решить задачу, не давайте ответ сразу. Разбейте решение на маленькие шаги и ведите ученика по ним.
3.  **Возвращение к теме:** Если ученик чего-то не понял, будьте готовы вернуться и объяснить тему заново, но уже с другими примерами или с другой стороны.
4.  **Обработка файлов:** Если ученик загружает файл (фото задачи, документ), проанализируйте его и обсуждайте его содержимое в контексте вашего диалога.`;

        const tutorAsSpecialist = {
            id: `tutor-${selectedSubject.toLowerCase()}`,
            name: `Репетитор по ${selectedSubject}`,
            description: `Ваш личный репетитор по предмету: ${selectedSubject}`,
            category: 'Другие сферы',
            systemInstruction: systemInstruction,
        };
            
            try {
                const result = await sendSpecialistMessage({ specialist: tutorAsSpecialist, history: newHistory }, messageText);
                const modelMessage = { role: 'model', text: result.text, sources: result.sources };
                setTutorChatMessages(prev => [...prev, modelMessage]);
            } catch (err) {
                const msg = err instanceof Error ? err.message : JSON.stringify(err);
                setError(msg);
                setTutorChatMessages(prev => [...prev, { role: 'model', text: `Ошибка: ${msg}` }]);
            } finally {
                setIsLoading(false);
            }
        }
    }, [selectedSubject, tutorChatMessages, useGeneration, age]);


  // --- File Task (HW/CR) Flow ---
    const handleStartFileTask = useCallback(() => {
        resetAllFlows();
        if (remainingGenerations < 1) { 
            setError('Недостаточно генераций для решения задачи.');
            return;
        }
        setFileTaskStep('upload_form');
    }, [resetAllFlows, remainingGenerations]);

    const handleFileTaskSubmit = useCallback(async (files, prompt) => {
        const COST = docType === docType.DO_HOMEWORK ? 2 : 1;
        if (useGeneration(COST)) {
            handleGenerationStart('Решаем вашу задачу...');
            setFileTaskStep('generating');
            try {
                const res = await solveTaskFromFiles(files, prompt, docType, setProgressMessage);
                setResult(res);
                onSaveGeneration({ docType, title: `${docType}: ${(prompt || 'Файлы без темы')}`, text: res.text });
                setFileTaskStep('completed');
            } catch (err) {
                const msg = err instanceof Error ? err.message : JSON.stringify(err);
                setError(msg);
                setFileTaskStep('upload_form');
            } finally {
                setIsLoading(false);
            }
        }
    }, [useGeneration, docType, handleGenerationStart, onSaveGeneration, setResult]);

  // --- Business Flow ---
  const handleStartBusiness = useCallback(() => {
    resetAllFlows();
    if (remainingGenerations < 1) {
      setError('Недостаточно генераций для выполнения бизнес-задачи.');
      return;
    }
    if (docType === docType.SWOT_ANALYSIS) setBusinessStep('swot_form');
    if (docType === docType.COMMERCIAL_PROPOSAL) setBusinessStep('proposal_form');
    if (docType === docType.BUSINESS_PLAN) setBusinessStep('business_plan_form');
    if (docType === docType.MARKETING_COPY) setBusinessStep('marketing_form');
  }, [resetAllFlows, remainingGenerations, docType]);

  const handleSwotSubmit = useCallback(async (request) => {
    if (useGeneration(2)) {
        handleGenerationStart('Проводим SWOT-анализ...');
        setBusinessStep('generating');
        try {
            const res = await generateSwotAnalysis(request, setProgressMessage);
            setResult(res);
            onSaveGeneration({ docType: docType.SWOT_ANALYSIS, title: `SWOT: ${request.description.slice(0, 50)}...`, text: res.text });
            setBusinessStep('completed');
        } catch (err) {
            const msg = err instanceof Error ? err.message : JSON.stringify(err);
            setError(msg);
            setBusinessStep('swot_form');
        } finally {
            setIsLoading(false);
        }
    }
  }, [useGeneration, handleGenerationStart, onSaveGeneration, setResult]);

  const handleCommercialProposalSubmit = useCallback(async (request) => {
    if (useGeneration(2)) {
        handleGenerationStart('Составляем коммерческое предложение...');
        setBusinessStep('generating');
        try {
            const res = await generateCommercialProposal(request, setProgressMessage);
            setResult(res);
            onSaveGeneration({ docType: docType.COMMERCIAL_PROPOSAL, title: `КП для: ${request.client}`, text: res.text });
            setBusinessStep('completed');
        } catch (err) {
            const msg = err instanceof Error ? err.message : JSON.stringify(err);
            setError(msg);
            setBusinessStep('proposal_form');
        } finally {
            setIsLoading(false);
        }
    }
  }, [useGeneration, handleGenerationStart, onSaveGeneration, setResult]);

  const handleBusinessPlanSubmit = useCallback(async (request) => {
    if (useGeneration(2)) {
        handleGenerationStart('Создаем структуру бизнес-плана...');
        try {
            const plan = await generateBusinessPlan(request, setProgressMessage);
            setBusinessPlan({ ...plan, industry: request.industry });
            setBusinessStep('plan_review');
        } catch (err) {
            const msg = err instanceof Error ? err.message : JSON.stringify(err);
            setError(msg);
            setBusinessStep('business_plan_form');
        } finally {
            setIsLoading(false);
        }
    }
  }, [useGeneration, handleGenerationStart]);

  const handleGenerateBusinessPlan = useCallback(async (editedPlan) => {
    if (!businessPlan) {
        setError('План для бизнеса отсутствует.');
        return;
    }
    
    const { industry } = businessPlan;
    const cost = editedPlan.sections.length;
    if (useGeneration(cost)) {
        handleGenerationStart(`Подготовка бизнес-плана...`);
        setBusinessStep('generating');
        let fullPlanText = `# ${editedPlan.title}\n\n`;

        try {
            for (let i = 0; i < editedPlan.sections.length; i++) {
                const section = editedPlan.sections[i];
                setProgressMessage(`Генерация раздела ${i + 1}/${cost}: "${section.title}"...`);
                const sectionText = await generateSingleBusinessSection(section, editedPlan.title, industry);
                fullPlanText += `## ${i+1}. ${section.title}\n\n${sectionText}\n\n`;
                if (i < editedPlan.sections.length - 1) {
                    await wait(1000);
                }
            }

            const metrics = calculateTextMetrics(fullPlanText);
            const finalResult = {
                docType: docType.BUSINESS_PLAN,
                text: fullPlanText,
                uniqueness: 0,
                ...metrics,
                plan: editedPlan
            };
            setResult(finalResult);
            onSaveGeneration({ docType: docType.BUSINESS_PLAN, title: editedPlan.title, text: finalResult.text });
            setBusinessStep('completed');

        } catch (err) {
            const msg = err instanceof Error ? err.message : JSON.stringify(err);
            setError(msg);
            setBusinessStep('plan_review');
        } finally {
            setIsLoading(false);
        }
    }
  }, [useGeneration, businessPlan, handleGenerationStart, onSaveGeneration, setResult]);
  
  const handleMarketingSubmit = useCallback(async (request) => {
    if(useGeneration(1)) {
      handleGenerationStart(`Создаем: ${request.copyType}...`);
      setBusinessStep('generating');
      try {
        const res = await generateMarketingCopy(request, setProgressMessage);
        setResult(res);
        onSaveGeneration({ docType: docType.MARKETING_COPY, title: `${request.copyType}: ${request.product}`, text: res.text });
        setBusinessStep('completed');
      } catch(err) {
        const msg = err instanceof Error ? err.message : JSON.stringify(err);
        setError(msg);
        setBusinessStep('marketing_form');
      } finally {
        setIsLoading(false);
      }
    }
  }, [useGeneration, handleGenerationStart, onSaveGeneration, setResult]);
  
  // --- Creative Flow ---
  const handleStartCreative = useCallback(() => {
    resetAllFlows();
    if (docType === docType.TEXT_REWRITING) {
      if (remainingGenerations < 1) {
          setError('Недостаточно генераций для творческой задачи.');
          return;
      }
      setCreativeStep('rewriting_form');
    } else if (docType === docType.SCRIPT) {
      const COST = 2;
      if (remainingGenerations < COST) {
        setError(`Для анализа сценария необходимо ${COST} генерации.`);
        return;
      }
      setCreativeStep('script_upload_form');
    } else if (docType === docType.AUDIO_SCRIPT) {
        if (remainingGenerations < 2) { // Minimum cost for audio script
            setError('Для создания аудио-скрипта необходимо минимум 2 генерации.');
            return;
        }
        setCreativeStep('audio_script_topic');
    }
  }, [resetAllFlows, docType, remainingGenerations]);
  
  const handleRewritingSubmit = useCallback(async (request, file) => {
    const textCost = request.originalText ? Math.ceil(request.originalText.length / 5000) : 0;
    const fileCost = file ? 1 : 0;
    const cost = Math.max(1, textCost + fileCost);

    if (useGeneration(cost)) {
        handleGenerationStart('Перерабатываем ваш текст...');
        setCreativeStep('generating');
        try {
            const res = await rewriteText(request, file, setProgressMessage);
            setResult(res);
            onSaveGeneration({ docType: docType.TEXT_REWRITING, title: `Переработка текста (Цель: ${request.goal})`, text: res.text });
            setCreativeStep('completed');
        } catch (err) {
            const msg = err instanceof Error ? err.message : JSON.stringify(err);
            setError(msg);
            setCreativeStep('rewriting_form');
        } finally {
            setIsLoading(false);
        }
    }
  }, [useGeneration, handleGenerationStart, onSaveGeneration, setResult]);

  const handleCreativeFileTaskSubmit = useCallback(async (files, prompt) => {
    const COST = 2;
    if (useGeneration(COST)) {
        handleGenerationStart('Анализируем ваши материалы...');
        setCreativeStep('generating');
        try {
            const res = await analyzeCreativeTaskFromFiles(files, prompt, docType, setProgressMessage);
            setResult(res);
            onSaveGeneration({ docType, title: `${docType}: ${(prompt || 'Анализ материалов')}`, text: res.text });
            setCreativeStep('completed');
        } catch (err) {
            const msg = err instanceof Error ? err.message : JSON.stringify(err);
            setError(msg);
            setCreativeStep('script_upload_form');
        } finally {
            setIsLoading(false);
        }
    }
  }, [useGeneration, docType, handleGenerationStart, onSaveGeneration, setResult]);

  const handleAudioScriptTopicSubmit = useCallback((topic, duration) => {
    setAudioScriptRequest({ topic, duration });
    setCreativeStep('audio_script_config');
  }, []);

  const handleAudioScriptSubmit = useCallback(async (config) => {
      if (!audioScriptRequest.topic || !audioScriptRequest.duration) {
          setError('Отсутствуют данные о теме или длительности.');
          setCreativeStep('audio_script_topic');
          return;
      }
      
      const fullRequest = {
          topic: audioScriptRequest.topic,
          duration: audioScriptRequest.duration,
          ...config
      };
      
      const cost = Math.max(2, Math.ceil(fullRequest.duration / 5) * 2);

      if (useGeneration(cost)) {
          handleGenerationStart('Создаем ваш аудио-сценарий...');
          setCreativeStep('generating');
          try {
              const res = await generateAudioScript(fullRequest, setProgressMessage);
              setResult(res);
              onSaveGeneration({ docType: docType.AUDIO_SCRIPT, title: `Аудио-скрипт: ${fullRequest.topic.slice(0, 40)}...`, text: res.text });
              setCreativeStep('completed');
          } catch (err) {
              const msg = err instanceof Error ? err.message : JSON.stringify(err);
              setError(msg);
              setCreativeStep('audio_script_config');
          } finally {
              setIsLoading(false);
          }
      }
  }, [audioScriptRequest, useGeneration, handleGenerationStart, onSaveGeneration, setResult]);

  // --- Science Flow ---
  const handleStartScience = useCallback(() => {
    resetAllFlows();
    if (remainingGenerations < 1) {
        setError('Недостаточно генераций для научной задачи.');
        return;
    }
    if ([docType.ACADEMIC_ARTICLE, docType.GRANT_PROPOSAL].includes(docType)) {
      setScienceStep('article_form');
    }
  }, [resetAllFlows, remainingGenerations, docType]);
  
  const handleArticlePlanSubmit = useCallback(async (request, file) => {
      if (useGeneration(1)) {
          const isGrant = docType === docType.GRANT_PROPOSAL;
          handleGenerationStart(isGrant ? 'Создаем структуру для гранта...' : 'Создаем структуру научной статьи...');
          try {
              const plan = isGrant
                ? await generateGrantPlan(request, file, setProgressMessage)
                : await generateArticlePlan(request, setProgressMessage);

              setArticlePlan({ ...plan, field: request.field });
              setScienceStep('plan_review');
          } catch (err) {
              const msg = err instanceof Error ? err.message : JSON.stringify(err);
              setError(msg);
              setScienceStep('article_form');
          } finally {
            setIsLoading(false);
          }
      }
  }, [useGeneration, handleGenerationStart, docType]);

  const handleGenerateArticle = useCallback(async (editedPlan) => {
      if (!articlePlan) {
          setError('План статьи отсутствует.');
          return;
      }
      
      const { field } = articlePlan;
      const cost = editedPlan.sections.length;
      if (useGeneration(cost)) {
          handleGenerationStart(`Подготовка статьи...`);
          setScienceStep('generating');
          let fullArticleText = `# ${editedPlan.title}\n\n`;

          try {
              for (let i = 0; i < editedPlan.sections.length; i++) {
                  const section = editedPlan.sections[i];
                  setProgressMessage(`Генерация раздела ${i + 1}/${cost}: "${section.title}"...`);
                  const sectionText = await generateSingleArticleSection(section, editedPlan.title, field);
                  fullArticleText += `## ${i+1}. ${section.title}\n\n${sectionText}\n\n`;
                  if (i < editedPlan.sections.length - 1) {
                      await wait(1000);
                  }
              }

              const metrics = calculateTextMetrics(fullArticleText);
              const finalResult = {
                  docType,
                  text: fullArticleText,
                  uniqueness: 0, 
                  ...metrics,
                  plan: editedPlan
              };
              setResult(finalResult);
              onSaveGeneration({ docType, title: editedPlan.title, text: finalResult.text });
              setScienceStep('completed');

          } catch (err) {
              const msg = err instanceof Error ? err.message : JSON.stringify(err);
              setError(msg);
              setScienceStep('plan_review');
          } finally {
            setIsLoading(false);
          }
      }
  }, [useGeneration, articlePlan, handleGenerationStart, onSaveGeneration, setResult, docType]);

  const handleStartScienceFileTask = useCallback(() => {
    resetAllFlows();
    const COST = 2;
    if (remainingGenerations < COST) {
        setError(`Для этой задачи необходимо ${COST} генерации.`);
        return;
    }
    setScienceFileStep('upload_form');
  }, [resetAllFlows, remainingGenerations]);

  const handleScienceFileTaskSubmit = useCallback(async (files, prompt) => {
    const COST = 2;
    if (useGeneration(COST)) {
        handleGenerationStart('Анализируем ваши научные материалы...');
        setScienceFileStep('generating');
        try {
            const res = await analyzeScienceTaskFromFiles(files, prompt, docType, setProgressMessage);
            setResult(res);
            onSaveGeneration({ docType, title: `${docType}: ${(prompt || 'Анализ файлов')}`, text: res.text });
            setScienceFileStep('completed');
        } catch (err) {
            const msg = err instanceof Error ? err.message : JSON.stringify(err);
            setError(msg);
            setScienceFileStep('upload_form');
        } finally {
            setIsLoading(false);
        }
    }
  }, [useGeneration, docType, handleGenerationStart, onSaveGeneration, setResult]);

  // --- Thesis Flow ---
  const handleStartThesis = useCallback(() => {
    resetAllFlows();
    setThesisStep('form');
  }, [resetAllFlows]);

  const handleThesisSubmit = useCallback(async (topic, field, sections) => {
    const cost = sections.reduce((acc, s) => {
        return acc + (s.contentType === 'generate' ? s.pagesToGenerate : 0);
    }, 0);

    if (cost === 0 && !sections.some(s => s.contentType === 'text' || s.contentType === 'file')) {
        setError("Пожалуйста, выберите хотя бы один раздел для генерации или добавьте свой контент.");
        return;
    }

    if (useGeneration(cost)) {
        handleGenerationStart('Начинаем работу над дипломной работой...');
        setThesisStep('generating');
        try {
            const res = await generateFullThesis(topic, field, sections, setProgressMessage);
            setResult(res);
            onSaveGeneration({ docType: docType.THESIS, title: `Диплом: ${topic}`, text: res.text });
            setThesisStep('completed');
        } catch (err) {
            const msg = err instanceof Error ? err.message : JSON.stringify(err);
            setError(msg);
            setThesisStep('form');
        } finally {
            setIsLoading(false);
        }
    }
  }, [useGeneration, handleGenerationStart, onSaveGeneration, setResult]);


  // --- Code Flow ---
    const handleStartCode = useCallback(() => {
        resetAllFlows();
        if (remainingGenerations < 1) {
            setError('Недостаточно генераций для написания кода.');
            return;
        }
        setCodeStep('form');
    }, [resetAllFlows, remainingGenerations]);
    
    const handleCodeAnalysisSubmit = useCallback(async (request) => {
        if (useGeneration(1)) { // Cost 1 for analysis
            handleGenerationStart('Анализируем вашу задачу...');
            setCodeStep('generating');
            try {
                const analysis = await analyzeCodeTask(request, setProgressMessage);
                setCodeAnalysis(analysis);
                setCodeRequest(request);
                setCodeStep('review');
            } catch (err) {
                const msg = err instanceof Error ? err.message : JSON.stringify(err);
                setError(msg);
                setCodeStep('form');
            } finally {
                setIsLoading(false); // Stop loading, show review or form
            }
        }
    }, [useGeneration, handleGenerationStart]);

    const handleGenerateCode = useCallback(async () => {
        if (!codeAnalysis || !codeRequest) {
            setError('Отсутствуют данные для анализа кода.');
            return;
        }
        
        if (useGeneration(codeAnalysis.cost)) {
            handleGenerationStart('Генерация кода...');
            setCodeStep('generating');
            try {
                const res = await generateCode(codeRequest, setProgressMessage);
                setResult(res);
                onSaveGeneration({ docType: docType.CODE_GENERATION, title: `Код (${codeRequest.language}): ${codeRequest.taskDescription.slice(0, 40)}...`, text: res.text });
                setCodeStep('completed');
            } catch (err) {
                 const msg = err instanceof Error ? err.message : JSON.stringify(err);
                setError(msg);
                setCodeStep('review');
            } finally {
                setIsLoading(false);
            }
        }
    }, [useGeneration, codeAnalysis, codeRequest, handleGenerationStart, onSaveGeneration, setResult]);
    
    // --- Analysis Flow ---
    const handleStartAnalysis = useCallback(() => {
        resetAllFlows();
        setAnalysisStep('upload_form');
    }, [resetAllFlows]);

    const handleAnalysisSubmit = useCallback(async (files, prompt) => {
        const COST = docType === docType.ANALYSIS_VERIFY ? 3 : 2;
        if (useGeneration(COST)) {
            handleGenerationStart('Проводим анализ...');
            setAnalysisStep('generating');
            try {
                const res = await performAnalysis(files, prompt, docType, setProgressMessage);
                setResult(res);
                onSaveGeneration({ docType, title: `${docType}: ${(prompt || files[0]?.name || 'Анализ')}`, text: res.text });
                setAnalysisStep('completed');
            } catch (err) {
                const msg = err instanceof Error ? err.message : JSON.stringify(err);
                setError(msg);
                setAnalysisStep('upload_form');
            } finally {
                setIsLoading(false);
            }
        }
    }, [useGeneration, docType, handleGenerationStart, onSaveGeneration, setResult]);
    
    // --- Forecasting Flow ---
    const handleStartForecasting = useCallback(() => {
        resetAllFlows();
        if (remainingGenerations < 3) {
            setError('Для прогнозирования необходимо 3 генерации.');
            return;
        }
        setForecastingStep('form');
    }, [resetAllFlows, remainingGenerations]);

    const handleForecastSubmit = useCallback(async (prompt) => {
        const COST = 3;
        if (useGeneration(COST)) {
            handleGenerationStart('Собираем данные для прогноза...');
            setForecastingStep('generating');
            try {
                const res = await generateForecasting(prompt, setProgressMessage);
                setResult(res);
                onSaveGeneration({ docType: docType.FORECASTING, title: `Прогноз: ${prompt.slice(0, 40)}...`, text: res.text });
                setForecastingStep('completed');
            } catch (err) {
                const msg = err instanceof Error ? err.message : JSON.stringify(err);
                setError(msg);
                setForecastingStep('form');
            } finally {
                setIsLoading(false);
            }
        }
    }, [useGeneration, handleGenerationStart, onSaveGeneration, setResult]);

  const shouldShowProgressModal = isLoading && consultationStep !== 'chatting' && tutorStep !== 'chatting';

  useEffect(() => {
    onGenerationStateChange(shouldShowProgressModal);
  }, [shouldShowProgressModal, onGenerationStateChange]);

  if (!isLoggedIn) {
    return (
      <div className="bg-[var(--bg-card)] rounded-2xl shadow-[var(--shadow-deep)] p-8 md:p-12 text-center text-[var(--text-dark-primary)] max-w-4xl mx-auto -mt-16 relative z-10">
        <style>{`
          @keyframes head-sway-welcome { 0% { transform: rotate(0); } 25% { transform: rotate(-6deg); } 75% { transform: rotate(6deg); } 100% { transform: rotate(0); } }
          .robot-head-group-welcome { animation: head-sway-welcome 2.5s ease-in-out infinite; transform-origin: center 14px; }
          @keyframes eye-scan-welcome { 0%, 100% { transform: translateX(0); } 40% { transform: translateX(-1.5px); } 90% { transform: translateX(1.5px); } }
          .robot-eyes-welcome { animation: eye-scan-welcome 2s ease-in-out infinite; }
        `}</style>
        <div className="w-24 h-24 mb-6 mx-auto">
           <svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 24 24" fill="none" stroke="var(--accent-gold)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <g className="robot-head-group-welcome">
                <path d="M12 8V4H8"/>
                <rect width="16" height="12" x="4" y="8" rx="2"/>
                <g className="robot-eyes-welcome">
                  <path d="M15 13v2"/>
                  <path d="M9 13v2"/>
                </g>
              </g>
           </svg>
        </div>
        
        <h2 className="text-3xl md:text-4xl font-bold">Добро пожаловать в AI - Помощник!</h2>
        <p className="mt-4 text-base text-[var(--text-dark-secondary)] max-w-2xl mx-auto">
            Это ваш личный академический и творческий партнер. Мы помогаем студентам, специалистам и креативщикам достигать большего, предлагая мощные инструменты на базе ИИ.
        </p>
        
        <div className="mt-8 text-left max-w-xl mx-auto p-6 bg-gray-50/80 rounded-xl border border-gray-200 shadow-sm">
          <ul className="space-y-4 text-sm">
            <li className="flex items-start gap-3">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-check-circle-2 flex-shrink-0 text-[var(--accent)] mt-0.5"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="m9 12 2 2 4-4"/></svg>
              <span><strong>Для учебы:</strong> Создавайте сочинения, рефераты, эссе и решайте сложные задачи в интерактивном режиме с репетитором.</span>
            </li>
            <li className="flex items-start gap-3">
               <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-check-circle-2 flex-shrink-0 text-[var(--accent)] mt-0.5"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="m9 12 2 2 4-4"/></svg>
              <span><strong>Для работы:</strong> Разрабатывайте бизнес-планы, научные статьи, анализируйте документы и пишите код на разных языках.</span>
            </li>
            <li className="flex items-start gap-3">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-check-circle-2 flex-shrink-0 text-[var(--accent)] mt-0.5"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="m9 12 2 2 4-4"/></svg>
              <span><strong>Для творчества:</strong> Пишите книги и сценарии, получайте консультации от виртуальных экспертов и общайтесь с личными AI-ассистентами.</span>
            </li>
            <li className="flex items-start gap-3">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-check-circle-2 flex-shrink-0 text-[var(--accent)] mt-0.5"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="m9 12 2 2 4-4"/></svg>
              <span><strong>Для жизни:</strong> Получайте консультации со специалистами, составляйте астрологические прогнозы и проводите личностный анализ.</span>
            </li>
          </ul>
        </div>

        <p className="mt-8 text-sm text-[var(--text-dark-secondary)]">
            Чтобы начать, войдите с вашим кодом доступа или приобретите стартовый пакет.
        </p>

        <button 
            onClick={onBuyGenerations}
            className="mt-6 bg-[var(--accent)] text-white font-semibold py-3 px-8 rounded-lg transition-all hover:bg-[var(--accent-light)] text-base shadow-lg"
        >
            Перейти к покупке
        </button>
      </div>
    );
  }

  const resultDisplayProps = {
      isLoggedIn, remainingGenerations, useGeneration, onBuyGenerations, result, setResult, onSaveGeneration, onGenerationStateChange, hasMirra, onShareWithMirra, hasDary, onShareWithDary, initialDocType, initialAge, onInitialDocTypeHandled, audience, docType, onDocTypeChange: handleDocTypeChange, age, onAgeChange: setAge, adultCategory, onAdultCategoryChange: setAdultCategory, onStart: () => {}, onStartAstrology: handleStartAstrology, onStartBookWriting: handleStartBookWriting, onStartPersonalAnalysis: handleStartPersonalAnalysis, onStartDocAnalysis: handleStartDocAnalysis, onStartConsultation: handleStartConsultation, onStartTutor: handleStartTutor, onStartFileTask: handleStartFileTask, onStartBusiness: handleStartBusiness, onStartCreative: handleStartCreative, onStartScience: handleStartScience, onStartScienceFileTask: handleStartScienceFileTask, onStartCode: handleStartCode, onStartThesis: handleStartThesis, onStartAnalysis: handleStartAnalysis, onStartForecasting: handleStartForecasting, onStandardSubmit: handleStandardSubmit, onProgressUpdate: setProgressMessage, isDisabled: isLoading, astrologyStep, bookWritingStep, personalAnalysisStep, docAnalysisStep, consultationStep, tutorStep, fileTaskStep, businessStep, creativeStep, scienceStep, scienceFileStep, codeStep, thesisStep, analysisStep, forecastingStep, onAstrologySelect: handleAstrologySelect, onNatalSubmit: handleNatalSubmit, onHoroscopeSubmit: handleHoroscopeSubmit, bookPlan, onPlanSubmit: handlePlanSubmit, onGenerateBook: handleGenerateBook, onPersonalAnalysisSubmit: handlePersonalAnalysisSubmit, onDocAnalysisSubmit: handleDocAnalysisSubmit, onSpecialistSelect: handleSpecialistSelect, selectedSpecialist, chatMessages, onSendMessage: handleSendMessage, onSubjectSelect: handleSubjectSelect, selectedSubject, tutorChatMessages, onTutorSendMessage: handleTutorSendMessage, onFileTaskSubmit: handleFileTaskSubmit, businessPlan, onSwotSubmit: handleSwotSubmit, onCommercialProposalSubmit: handleCommercialProposalSubmit, onBusinessPlanSubmit: handleBusinessPlanSubmit, onGenerateBusinessPlan: handleGenerateBusinessPlan, onMarketingSubmit: handleMarketingSubmit, onRewritingSubmit: handleRewritingSubmit, onCreativeFileTaskSubmit: handleCreativeFileTaskSubmit, onAudioScriptTopicSubmit: handleAudioScriptTopicSubmit, onAudioScriptSubmit: handleAudioScriptSubmit, audioScriptRequest, articlePlan, onArticlePlanSubmit: handleArticlePlanSubmit, onGenerateArticle: handleGenerateArticle, onScienceFileTaskSubmit: handleScienceFileTaskSubmit, onThesisSubmit: handleThesisSubmit, onAnalysisSubmit: handleAnalysisSubmit, onForecastSubmit: handleForecastSubmit, onCodeSubmit: handleCodeAnalysisSubmit, onGenerateCode: handleGenerateCode, codeAnalysis, codeRequest, onCancelCodeAnalysis: () => { setCodeStep('form'); setCodeAnalysis(null); setCodeRequest(null); }
  };

  return (
    <div>
      <GenerationProgressModal 
        isOpen={shouldShowProgressModal} 
        title="Идет генерация..."
        progressMessage={progressMessage} 
      />
      
      <div>
        <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-5 gap-6">
            <div className="lg:col-span-1 2xl:col-span-2 bg-[var(--bg-card)] rounded-2xl shadow-[var(--shadow-deep)] p-6 text-[var(--text-dark-primary)]">
                <div className="flex flex-col h-full">
                    <AudienceSwitch activeAudience={audience} onAudienceChange={handleAudienceChange} isDisabled={isLoading} />
                    <div className="mt-4 flex-grow">
                        <TextGeneratorForm 
                            audience={audience}
                            docType={docType}
                            onDocTypeChange={handleDocTypeChange}
                            age={age}
                            onAgeChange={setAge}
                            adultCategory={adultCategory}
                            onAdultCategoryChange={setAdultCategory}
                            useGeneration={useGeneration}
                            onStart={() => {}}
                            onStartAstrology={handleStartAstrology}
                            onStartBookWriting={handleStartBookWriting}
                            onStartPersonalAnalysis={handleStartPersonalAnalysis}
                            onStartDocAnalysis={handleStartDocAnalysis}
                            onStartConsultation={handleStartConsultation}
                            onStartTutor={handleStartTutor}
                            onStartFileTask={handleStartFileTask}
                            onStartBusiness={handleStartBusiness}
                            onStartCreative={handleStartCreative}
                            onStartScience={handleStartScience}
                            onStartScienceFileTask={handleStartScienceFileTask}
                            onStartCode={handleStartCode}
                            onStartThesis={handleStartThesis}
                            onStartAnalysis={handleStartAnalysis}
                            onStartForecasting={handleStartForecasting}
                            onStandardSubmit={handleStandardSubmit}
                            onProgressUpdate={setProgressMessage}
                            isDisabled={isLoading}
                            astrologyStep={astrologyStep}
                            bookWritingStep={bookWritingStep}
                            personalAnalysisStep={personalAnalysisStep}
                            docAnalysisStep={docAnalysisStep}
                            consultationStep={consultationStep}
                            tutorStep={tutorStep}
                            fileTaskStep={fileTaskStep}
                            businessStep={businessStep}
                            creativeStep={creativeStep}
                            scienceStep={scienceStep}
                            scienceFileStep={scienceFileStep}
                            codeStep={codeStep}
                            thesisStep={thesisStep}
                            analysisStep={analysisStep}
                            forecastingStep={forecastingStep}
                        />
                    </div>
                </div>
            </div>
            
            <div className="lg:col-span-1 2xl:col-span-3 bg-[var(--bg-card)] rounded-2xl shadow-[var(--shadow-deep)] p-6 text-[var(--text-dark-primary)]">
                <ResultDisplay
                    {...resultDisplayProps}
                    onConvertToTable={handleConvertToTable}
                    result={null} // This panel only shows forms
                    isLoading={isLoading}
                    error={error}
                />
            </div>
        </div>

        {result && !isLoading && (
            <div className="mt-6">
                <div className="bg-[var(--bg-card)] rounded-2xl shadow-[var(--shadow-deep)] p-6 text-[var(--text-dark-primary)]">
                    <ResultViewer
                        result={result}
                        isLoggedIn={isLoggedIn}
                        hasMirra={hasMirra}
                        hasDary={hasDary}
                        useGeneration={useGeneration}
                        onSaveGeneration={onSaveGeneration}
                        onShareWithDary={onShareWithDary}
                        onShareWithMirra={onShareWithMirra}
                        onConvertToTable={handleConvertToTable}
                    />
                </div>
            </div>
        )}
      </div>
    </div>
  );
};