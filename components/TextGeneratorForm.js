import React, { useState, useCallback, useEffect } from 'react';
import { 
    STUDENT_DOC_TYPES_STANDARD,
    STUDENT_DOC_TYPES_INTERACTIVE,
    CHILDREN_AGES, 
    ADULT_CATEGORIES, 
    DOC_TYPES_BY_ADULT_CATEGORY,
    ANALYSIS_DOC_TYPES
} from '../constants.js';
import { DocumentType } from '../types.js';
import { VerticalSelector } from './VerticalSelector.js';
import { toast } from 'react-hot-toast';

export const TextGeneratorForm = ({ 
    audience, 
    docType,
    onDocTypeChange,
    age,
    onAgeChange,
    adultCategory,
    onAdultCategoryChange,
    useGeneration, 
    onStart, 
    onStartAstrology,
    onStartBookWriting,
    onStartPersonalAnalysis,
    onStartDocAnalysis,
    onStartConsultation,
    onStartTutor,
    onStartFileTask,
    onStartBusiness,
    onStartCreative,
    onStartScience,
    onStartScienceFileTask,
    onStartCode,
    onStartThesis,
    onStartAnalysis,
    onStartForecasting,
    onStandardSubmit,
    onProgressUpdate, 
    isDisabled,
    astrologyStep,
    bookWritingStep,
    personalAnalysisStep,
    docAnalysisStep,
    consultationStep,
    tutorStep,
    fileTaskStep,
    businessStep,
    creativeStep,
    scienceStep,
    scienceFileStep,
    codeStep,
    thesisStep,
    analysisStep,
    forecastingStep,
}) => {
  // Shared state
  const [topic, setTopic] = useState('');

  const isAstrologyMode = docType === DocumentType.ASTROLOGY;
  const isBookWritingMode = docType === DocumentType.BOOK_WRITING;
  const isPersonalAnalysisMode = docType === DocumentType.PERSONAL_ANALYSIS;
  const isDocAnalysisMode = docType === DocumentType.DOCUMENT_ANALYSIS;
  const isConsultationMode = docType === DocumentType.CONSULTATION;
  const isTutorMode = docType === DocumentType.TUTOR;
  const isHomeworkMode = docType === DocumentType.DO_HOMEWORK;
  const isControlWorkMode = docType === DocumentType.SOLVE_CONTROL_WORK;
  const isFileTaskMode = isHomeworkMode || isControlWorkMode;
  const isBusinessMode = [DocumentType.SWOT_ANALYSIS, DocumentType.COMMERCIAL_PROPOSAL, DocumentType.BUSINESS_PLAN, DocumentType.MARKETING_COPY].includes(docType);
  const isCreativeMode = [DocumentType.TEXT_REWRITING, DocumentType.SCRIPT, DocumentType.AUDIO_SCRIPT].includes(docType);
  const isScienceMode = [DocumentType.ACADEMIC_ARTICLE, DocumentType.GRANT_PROPOSAL].includes(docType);
  const isScienceFileTaskMode = [DocumentType.TECH_IMPROVEMENT, DocumentType.SCIENTIFIC_RESEARCH].includes(docType);
  const isCodeMode = docType === DocumentType.CODE_GENERATION;
  const isThesisMode = docType === DocumentType.THESIS;
  const isAnalysisMode = ANALYSIS_DOC_TYPES.includes(docType);
  const isForecastingMode = docType === DocumentType.FORECASTING;

  
  const isSpecialMode = isAstrologyMode || isBookWritingMode || isPersonalAnalysisMode || isDocAnalysisMode || isConsultationMode || isTutorMode || isFileTaskMode || isBusinessMode || isCreativeMode || isScienceMode || isCodeMode || isThesisMode || isScienceFileTaskMode || isAnalysisMode || isForecastingMode;

  // Reset state when audience changes
  useEffect(() => {
    setTopic('');
    if (audience === 'children') {
      onAgeChange(CHILDREN_AGES[6]); // Reset to default age 12
    }
  }, [audience, onAgeChange]);
  
  // Effect to automatically trigger special modes
  useEffect(() => {
    if (isAstrologyMode && astrologyStep === 'none') onStartAstrology();
    else if (isBookWritingMode && bookWritingStep === 'none') onStartBookWriting();
    else if (isPersonalAnalysisMode && personalAnalysisStep === 'none') onStartPersonalAnalysis();
    else if (isDocAnalysisMode && docAnalysisStep === 'none') onStartDocAnalysis();
    else if (isConsultationMode && consultationStep === 'none') onStartConsultation();
    else if (isTutorMode && tutorStep === 'none') onStartTutor();
    else if (isFileTaskMode && fileTaskStep === 'none') onStartFileTask();
    else if (isBusinessMode && businessStep === 'none') onStartBusiness();
    else if (isCreativeMode && creativeStep === 'none') onStartCreative();
    else if (isScienceMode && scienceStep === 'none') onStartScience();
    else if (isScienceFileTaskMode && scienceFileStep === 'none') onStartScienceFileTask();
    else if (isCodeMode && codeStep === 'none') onStartCode();
    else if (isThesisMode && thesisStep === 'none') onStartThesis();
    else if (isAnalysisMode && analysisStep === 'none') onStartAnalysis();
    else if (isForecastingMode && forecastingStep === 'none') onStartForecasting();
  }, [docType, onStartAstrology, onStartBookWriting, onStartPersonalAnalysis, onStartDocAnalysis, onStartConsultation, onStartTutor, onStartFileTask, onStartBusiness, onStartCreative, onStartScience, onStartScienceFileTask, onStartCode, onStartThesis, onStartAnalysis, onStartForecasting, astrologyStep, bookWritingStep, personalAnalysisStep, docAnalysisStep, consultationStep, tutorStep, fileTaskStep, businessStep, creativeStep, scienceStep, scienceFileStep, codeStep, thesisStep, analysisStep, forecastingStep, isAstrologyMode, isBookWritingMode, isPersonalAnalysisMode, isDocAnalysisMode, isConsultationMode, isTutorMode, isFileTaskMode, isBusinessMode, isCreativeMode, isScienceMode, isScienceFileTaskMode, isCodeMode, isThesisMode, isAnalysisMode, isForecastingMode]);
  
  // Reset topic only when docType changes, but NOT if it's a special mode
  useEffect(() => {
    if (!isSpecialMode) {
        setTopic('');
    }
  }, [docType, isSpecialMode]);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    if (isDisabled || isSpecialMode) {
        return;
    }

    if (!topic.trim()) {
        toast.error('Пожалуйста, укажите тему.');
        return;
    }
    
    const generationAge = audience === 'children' ? age : 18;
    onStandardSubmit(topic, generationAge);

  }, [topic, age, audience, isDisabled, isSpecialMode, onStandardSubmit]);
  
  const childrenAgeDisplayItems = CHILDREN_AGES.map(String);

  const handleFirstSelectorSelect = (selectedValue) => {
    if (audience === 'children') {
        const newAge = parseInt(selectedValue, 10);
        if (!isNaN(newAge)) {
            onAgeChange(newAge);
        }
    } else {
        onAdultCategoryChange(selectedValue);
        // When category changes, reset docType to the first in the new category's list
        onDocTypeChange(DOC_TYPES_BY_ADULT_CATEGORY[selectedValue][0]);
    }
  };
  
  const handleSecondSelectorSelect = (value) => {
    onDocTypeChange(value);
  };
  
  let placeholderText = 'Например: Влияние Римской империи на современный мир';
  let buttonText = 'Сгенерировать';
  let shouldDisableButton = isDisabled || isSpecialMode;
  let shouldDisableTextarea = isDisabled || isSpecialMode;

  if (isAstrologyMode) {
      placeholderText = 'Параметры для астрологического прогноза задаются в окне справа.';
      buttonText = 'Перейти к выбору услуги';
  } else if (isBookWritingMode) {
      placeholderText = 'Параметры для вашей книги настраиваются в окне справа.';
      buttonText = 'Начать создание книги';
  } else if (isPersonalAnalysisMode) {
      placeholderText = 'Параметры для личностного анализа задаются в окне справа.';
      buttonText = 'Перейти к анализу';
  } else if (isDocAnalysisMode) {
      placeholderText = 'Загрузка документов для расшифровки производится в окне справа.';
      buttonText = 'Перейти к загрузке';
  } else if (isConsultationMode) {
      placeholderText = 'Выберите специалиста для консультации в окне справа.';
      buttonText = 'Начать консультацию';
  } else if (isTutorMode) {
      placeholderText = 'Выберите предмет для занятия с репетитором в окне справа.';
      buttonText = 'Начать занятие';
  } else if (isFileTaskMode) {
      placeholderText = 'Загрузка файлов с заданием производится в окне справа.';
      buttonText = 'Перейти к загрузке файлов';
  } else if (isBusinessMode) {
      placeholderText = 'Параметры для бизнес-задачи задаются в окне справа.';
      buttonText = 'Перейти к задаче';
  } else if (isCreativeMode) {
      if (docType === DocumentType.SCRIPT) {
        placeholderText = 'Загрузка сценария или идей для анализа производится в окне справа.';
        buttonText = 'Перейти к загрузке';
      } else if (docType === DocumentType.AUDIO_SCRIPT) {
        placeholderText = 'Параметры для аудио-сценария задаются в окне справа.';
        buttonText = 'Начать создание скрипта';
      } else { // TEXT_REWRITING
        placeholderText = 'Параметры для переработки текста задаются в окне справа.';
        buttonText = 'Перейти к редактору';
      }
  } else if (isScienceMode) {
      const isGrant = docType === DocumentType.GRANT_PROPOSAL;
      placeholderText = isGrant ? 'Параметры для грантовой заявки задаются в окне справа.' : 'Параметры для научной статьи задаются в окне справа.';
      buttonText = isGrant ? 'Начать работу над грантом' : 'Начать работу над статьей';
  } else if (isThesisMode) {
      placeholderText = 'Параметры для дипломной работы задаются в окне справа.';
      buttonText = 'Начать работу над дипломом';
  } else if (isCodeMode) {
      placeholderText = 'Описание задачи для генерации кода вводится в окне справа.';
      buttonText = 'Перейти к написанию кода';
  } else if (isScienceFileTaskMode) {
    placeholderText = 'Загрузка файлов для анализа производится в окне справа.';
    buttonText = 'Перейти к загрузке';
  } else if (isAnalysisMode) {
    placeholderText = 'Загрузка файлов для анализа производится в окне справа.';
    buttonText = 'Перейти к загрузке';
  } else if (isForecastingMode) {
    placeholderText = 'Параметры для прогноза задаются в окне справа.';
    buttonText = 'Перейти к прогнозу';
  }


  const firstSelectorItems = audience === 'children' ? childrenAgeDisplayItems : ADULT_CATEGORIES;
  const firstSelectorSelectedValue = audience === 'children' ? String(age) : adultCategory;


  return (
    <form onSubmit={handleSubmit} className="flex flex-col h-full">
       <div className="space-y-4 flex flex-col h-full">
           <div className="flex flex-col sm:flex-row gap-4 justify-center items-stretch">
             <div className="w-full sm:w-1/2">
                <VerticalSelector
                  items={firstSelectorItems}
                  selectedValue={firstSelectorSelectedValue}
                  onSelect={handleFirstSelectorSelect}
                  isDisabled={isDisabled}
                  title={audience === 'children' ? 'Возраст' : 'Категория'}
                />
            </div>
            <div className="w-full sm:w-1/2">
                {audience === 'children' ? (
                  <div className="flex flex-col h-full justify-between">
                     <VerticalSelector
                      items={STUDENT_DOC_TYPES_STANDARD}
                      selectedValue={docType}
                      onSelect={handleSecondSelectorSelect}
                      isDisabled={isDisabled}
                      title="Написание работ"
                    />
                     <VerticalSelector
                      items={STUDENT_DOC_TYPES_INTERACTIVE}
                      selectedValue={docType}
                      onSelect={handleSecondSelectorSelect}
                      isDisabled={isDisabled}
                      title="Интерактивная помощь"
                    />
                  </div>
                ) : (
                   <VerticalSelector
                    items={DOC_TYPES_BY_ADULT_CATEGORY[adultCategory] || []}
                    selectedValue={docType}
                    onSelect={handleSecondSelectorSelect}
                    isDisabled={isDisabled || !(DOC_TYPES_BY_ADULT_CATEGORY[adultCategory] || []).includes(docType)}
                    title="Формат"
                  />
                )}
            </div>
          </div>
          
          {audience === 'children' &&
            <>
              <div className="pt-2">
                <div className="relative">
                  <textarea
                    id="topic"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    maxLength={200}
                    placeholder={placeholderText}
                    disabled={shouldDisableTextarea}
                    className="w-full h-40 bg-gray-50 border-2 border-[var(--bg-dark)] rounded-lg shadow-sm pl-5 pr-14 py-3 focus:outline-none disabled:opacity-50 resize-none transition-colors"
                  />
                  <div className="absolute bottom-2 right-3 text-xs text-[var(--text-dark-secondary)]/70 select-none">
                    {topic.length} / 200
                  </div>
                </div>
              </div>

              <button 
                type="submit" 
                disabled={shouldDisableButton}
                className="w-full flex justify-center items-center gap-2 bg-[var(--accent)] text-white font-semibold py-3 px-4 rounded-lg transition-all duration-300 hover:bg-[var(--accent-light)] disabled:bg-gray-400 disabled:cursor-not-allowed flex-shrink-0"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>
                {buttonText}
              </button>
              
              <div className="flex-grow" />
            </>
          }
       </div>
    </form>
  );
};