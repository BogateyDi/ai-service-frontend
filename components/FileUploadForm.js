import React, { useState } from 'react';
import { toast } from 'react-hot-toast';

export default function FileUploadForm({
  title, description, promptLabel, promptPlaceholder, buttonText, cost, maxFiles, maxFileSizeMB, acceptedFileTypes, accentColor, icon,
  remainingGenerations, onSubmit
}) {
    const [files, setFiles] = useState([]);
    const [prompt, setPrompt] = useState('');
    const [isDragging, setIsDragging] = useState(false);

    const maxSizeBytes = maxFileSizeMB * 1024 * 1024;
    
    const accentTextClass = `text-[var(--${accentColor})]`;
    const accentBorderClass = `border-[var(--${accentColor})]`;
    const accentSoftBgClass = `bg-[var(--${accentColor}-soft)]`;
    const accentBgClass = `bg-[var(--${accentColor})]`;
    const accentHoverBgClass = `hover:bg-[var(--${accentColor}-dark)]`;
    const focusAccentBorderClass = `focus:border-[var(--${accentColor})]`;

    const handleFileValidation = (incomingFiles) => {
        if (!incomingFiles) return;
        
        let newFiles = Array.from(incomingFiles);
        let errors = [];

        newFiles = newFiles.filter(file => {
            if (files.some(f => f.name === file.name)) {
                return false;
            }
            if (files.length + newFiles.length > maxFiles) {
                 errors.push(`Превышен лимит в ${maxFiles} файлов.`);
                 return false;
            }
            if (file.size > maxSizeBytes) {
                errors.push(`Файл "${file.name}" слишком большой (макс. ${maxFileSizeMB} МБ).`);
                return false;
            }
            return true;
        });
        
        if (errors.length > 0) {
            toast.error(errors.join('\n'));
        }

        if (newFiles.length > 0) {
            setFiles(prev => [...prev, ...newFiles].slice(0, maxFiles));
        }
    };

    const handleFileChange = (e) => handleFileValidation(e.target.files);
    const handleDragEvents = (e, isEntering) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(isEntering);
    };
    const handleDrop = (e) => {
        handleDragEvents(e, false);
        handleFileValidation(e.dataTransfer.files);
    };
    const removeFile = (index) => {
        setFiles(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (files.length === 0) {
            toast.error("Пожалуйста, загрузите хотя бы один файл.");
            return;
        }
        if (remainingGenerations < cost) {
             toast.error(`Недостаточно генераций. Требуется: ${cost}.`);
             return;
        }
        onSubmit(files, prompt);
    };

    return (
        <form onSubmit={handleSubmit} className="flex flex-col h-full p-2">
            <h3 className="text-xl font-semibold mb-2 text-center">{title}</h3>
            <p className="text-sm text-center text-[var(--text-dark-secondary)] mb-4">{description}</p>
            
            <div className="flex-grow flex flex-col gap-4">
                <div 
                    onDragEnter={(e) => handleDragEvents(e, true)}
                    onDragLeave={(e) => handleDragEvents(e, false)}
                    onDragOver={(e) => handleDragEvents(e, true)}
                    onDrop={handleDrop}
                    className={`mt-1 flex flex-col justify-center items-center p-4 border-2 border-dashed rounded-xl transition-colors duration-300 min-h-[150px]
                    ${isDragging ? `${accentSoftBgClass} ${accentBorderClass}` : 'bg-gray-50 border-gray-300'}`}
                >
                    <input id="file-upload-generic" type="file" className="sr-only" onChange={handleFileChange} accept={acceptedFileTypes} multiple disabled={files.length >= maxFiles}/>
                    <label htmlFor="file-upload-generic" className="flex flex-col items-center justify-center cursor-pointer w-full h-full text-center">
                        {icon}
                        <p className="mt-2 text-sm text-[var(--text-dark-secondary)]">
                            <span className={`font-semibold ${accentTextClass}`}>Выберите файлы</span> или перетащите сюда
                        </p>
                        <p className="text-xs text-[var(--text-dark-secondary)]/70">{`До ${maxFiles} файлов, до ${maxFileSizeMB}MB каждый`}</p>
                    </label>
                </div>

                {files.length > 0 && (
                    <div className="flex-shrink-0 max-h-[120px] overflow-y-auto space-y-2 p-2 bg-gray-100 rounded-lg">
                        {files.map((file, i) => (
                            <div key={i} className="flex items-center justify-between text-sm bg-white p-2 rounded">
                                <span className="truncate text-gray-700 w-4/5">{file.name}</span>
                                <button type="button" onClick={() => removeFile(i)} className="text-red-500 hover:text-red-700 ml-2 font-bold">&times;</button>
                            </div>
                        ))}
                    </div>
                )}
                
                <div>
                    <label htmlFor="generic-prompt" className="block text-sm font-medium text-[var(--text-dark-secondary)] mb-1">{promptLabel}</label>
                    <textarea id="generic-prompt" value={prompt} onChange={e => setPrompt(e.target.value)} rows={2} placeholder={promptPlaceholder} className={`w-full bg-gray-50 border-2 border-gray-200 rounded-lg p-3 focus:outline-none ${focusAccentBorderClass} resize-none`}/>
                </div>
            </div>
            
            <div className="flex-shrink-0 pt-4 text-center">
                <p className="text-sm text-[var(--text-dark-secondary)] mb-3">Стоимость: <span className="font-bold">{cost}</span> генерации</p>
                <button type="submit" disabled={files.length ===