


import React, { useState, useMemo } from 'react';
import { toast } from 'react-hot-toast';
import { ThesisSectionInput } from '../types';

interface ThesisFormProps {
  onSubmit: (topic: string, field: string, sections: ThesisSectionInput[]) => void;
  remainingGenerations: number;
}

const THESIS_STRUCTURE: Omit<ThesisSectionInput, 'contentType' | 'pagesToGenerate' | 'content' | 'file'>[] = [
    { id: 'title_page', title: 'Титульный лист' },
    { id: 'assignment', title: 'Задание на дипломную работу' },
    { id: 'review', title: 'Рецензия' },
    { id: 'abstract', title: 'Аннотация / Автореферат' },
    { id: 'toc', title: 'Содержание (Оглавление)' },
    { id: 'abbreviations', title: 'Список сокращений и обозначений' },
    { id: 'intro', title: 'Введение' },
    { id: 'main_part', title: 'Основная часть (теоретическая, аналитическая, практическая)' },
    { id: 'conclusion', title: 'Заключение' },
    { id: 'references', title: 'Список использованных источников' },
    { id: 'appendices', title: 'Приложения' },
];

const SectionRow: React.FC<{
    section: ThesisSectionInput;
    onChange: (updatedSection: ThesisSectionInput) => void;
}> = ({ section, onChange }) => {
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] || null;
        if (file && file.size > 10 * 1024 * 1024) { // 10MB limit
            toast.error(`Файл "${file.name}" слишком большой (макс. 10 МБ).`);
            return;
        }
        onChange({ ...section, file, content: '', pagesToGenerate: 1 }); // Reset other fields
    };
    
    const handleContentTypeChange = (type: ThesisSectionInput['contentType']) => {
        onChange({ 
            ...section, 
            contentType: type,
            // Reset other fields when type changes
            file: type !== 'file' ? null : section.file, 
            content: type !== 'text' ? '' : section.content,
            pagesToGenerate: type !== 'generate' ? 1 : section.pagesToGenerate
        });
    };

    const ContentTypeButton: React.FC<{
        type: ThesisSectionInput['contentType'];
        currentType: ThesisSectionInput['contentType'];
        label: string;
    }> = ({ type, currentType, label }) => (
        <button
            type="button"
            onClick={() => handleContentTypeChange(type)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-full border-2 transition-all w-full
            ${currentType === type ? 'bg-[var(--accent)] text-white border-[var(--accent)]' : 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200'}`}
        >
            {label}
        </button>
    );

    return (
        <div className="p-4 bg-white rounded-md shadow-sm border border-gray-200 space-y-3">
            <h4 className="font-bold text-[var(--text-dark-primary)]">{section.title}</h4>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <ContentTypeButton type="generate" currentType={section.contentType} label="Сгенерировать" />
                <ContentTypeButton type="text" currentType={section.contentType} label="Свой текст" />
                <ContentTypeButton type="file" currentType={section.contentType} label="Из файла" />
                <ContentTypeButton type="skip" currentType={section.contentType} label="Пропустить" />
            </div>

            {section.contentType === 'generate' && (
                <div>
                    <label className="text-sm text-gray-600">Страниц для генерации:</label>
                    <input
                        type="number"
                        min="1"
                        max="20"
                        value={section.pagesToGenerate}
                        onChange={e => onChange({ ...section, pagesToGenerate: parseInt(e.target.value, 10) })}
                        className="w-full mt-1 bg-gray-50 border border-gray-300 rounded-lg p-2 focus:outline-none focus:border-[var(--accent)]"
                    />
                </div>
            )}

            {section.contentType === 'text' && (
                <div>
                    <label className="text-sm text-gray-600">Ваш текст для этого раздела:</label>
                    <textarea
                        value={section.content}
                        onChange={e => onChange({ ...section, content: e.target.value })}
                        rows={5}
                        className="w-full mt-1 bg-gray-50 border border-gray-300 rounded-lg p-2 resize-y focus:outline-none focus:border-[var(--accent)]"
                    />
                </div>
            )}

            {section.contentType === 'file' && (
                <div>
                    <label className="text-sm text-gray-600">Загрузить файл (до 10МБ):</label>
                    <input
                        type="file"
                        onChange={handleFileChange}
                        accept=".txt,.doc,.docx"
                        className="w-full text-sm mt-1 text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[var(--accent-soft)] file:text-[var(--accent)] hover:file:bg-[var(--accent-soft)]/80"
                    />
                    {section.file && <p className="text-xs mt-1 text-gray-500">Выбран файл: {section.file.name}</p>}
                </div>
            )}
        </div>
    );
};

export const ThesisForm: React.FC<ThesisFormProps> = ({ onSubmit, remainingGenerations }) => {
    const [topic, setTopic] = useState('');
    const [field, setField] = useState('');
    const [sections, setSections] = useState<ThesisSectionInput[]>(
        THESIS_STRUCTURE.map(s => ({
            ...s,
            contentType: 'skip',
            pagesToGenerate: 5,
            content: '',
            file: null,
        }))
    );

    const totalCost = useMemo(() => {
        return sections.reduce((acc, s) => {
            return acc + (s.contentType === 'generate' ? s.pagesToGenerate : 0);
        }, 0);
    }, [sections]);

    const handleSectionChange = (index: number, updatedSection: ThesisSectionInput) => {
        const newSections = [...sections];
        newSections[index] = updatedSection;
        setSections(newSections);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!topic.trim() || !field.trim()) {
            toast.error("Пожалуйста, укажите тему и научную область.");
            return;
        }
        if (totalCost > remainingGenerations) {
            toast.error(`Недостаточно генераций. Требуется: ${totalCost}, у вас: ${remainingGenerations}.`);
            return;
        }
        onSubmit(topic, field, sections);
    };

    return (
        <form onSubmit={handleSubmit} className="flex flex-col h-full text-left p-2">
            <h3 className="text-xl font-semibold mb-2 text-center">Дипломная работа</h3>
            <p className="text-sm text-center text-[var(--text-dark-secondary)] mb-4">Настройте структуру вашей работы и выберите, какие разделы генерировать.</p>
            
            <div className="flex-grow overflow-y-auto space-y-4 pr-2">
                <div className="p-4 bg-gray-50 rounded-md border border-gray-200 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-[var(--text-dark-secondary)] mb-1">Тема дипломной работы</label>
                        <input type="text" value={topic} onChange={e => setTopic(e.target.value)} placeholder="Введите полную тему вашей работы" className="w-full bg-white border border-gray-300 rounded-lg p-2 focus:outline-none focus:border-[var(--accent)]" required />
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-[var(--text-dark-secondary)] mb-1">Научная область</label>
                        <input type="text" value={field} onChange={e => setField(e.target.value)} placeholder="Например: 'Программная инженерия', 'Экономика', 'Психология'" className="w-full bg-white border border-gray-300 rounded-lg p-2 focus:outline-none focus:border-[var(--accent)]" required />
                    </div>
                </div>

                <div className="space-y-3">
                    {sections.map((section, index) => (
                        <SectionRow
                            key={section.id}
                            section={section}
                            onChange={(updatedSection) => handleSectionChange(index, updatedSection)}
                        />
                    ))}
                </div>
            </div>

            <div className="flex-shrink-0 pt-4 text-center">
                <p className="text-sm text-[var(--text-dark-secondary)] mb-3">
                    Общая стоимость генерации: <span className="font-bold">{totalCost}</span> генераций.
                </p>
                <button 
                    type="submit" 
                    className="w-full max-w-sm bg-[var(--accent-science)] text-white font-semibold py-3 px-4 rounded-lg transition-all hover:bg-[var(--accent-science-dark)] disabled:bg-gray-400"
                    disabled={totalCost > remainingGenerations || (!topic.trim() || !field.trim())}
                >
                    Сгенерировать работу
                </button>
            </div>
        </form>
    );
};