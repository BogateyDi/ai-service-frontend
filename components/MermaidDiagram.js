
import React, { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';
import { toast } from 'react-hot-toast';

// Generate a unique ID for each diagram
let idCounter = 0;
const generateId = () => `mermaid-diagram-${idCounter++}`;

mermaid.initialize({
    startOnLoad: false,
    theme: 'neutral',
    securityLevel: 'loose',
    themeVariables: {
        background: '#ffffff',
        primaryColor: '#f8f9fa',
        primaryTextColor: '#1f2937',
        primaryBorderColor: '#a9b1bb',
        lineColor: '#4c5866',
        secondaryColor: '#dde2e8',
        tertiaryColor: '#dde2e8',
        fontSize: '14px',
    }
});

/**
 * Procedurally preprocesses the Mermaid chart string to fix common AI-generated syntax errors.
 * Specifically targets the issue where 'title' is on the same line as the diagram definition.
 * This version uses a more robust regex to handle various title formats.
 * @param chartText The raw chart string from the AI.
 * @returns A corrected chart string.
 */
const preprocessChart = (chartText: string): string => {
    // Return early for invalid input
    if (!chartText || typeof chartText !== 'string') {
        return '';
    }

    const lines = chartText.split('\n');
    // Find the first line that actually contains diagram code
    const firstLineIndex = lines.findIndex(line => line.trim() !== '');
    if (firstLineIndex === -1) {
        return chartText; // No content to process
    }

    const firstLine = lines[firstLineIndex];

    // Regex to find a diagram type keyword at the start of the line
    const diagramTypeRegex = /^\s*(graph|pie|flowchart|sequenceDiagram|gantt|classDiagram(?:-v2)?|stateDiagram-v2|erDiagram|journey|requirementDiagram|gitGraph)/i;
    
    // More robust regex to find 'title' and capture its content (quoted or unquoted)
    const titleRegex = /title\s+((?:"[^"]*")|(?:'[^']*')|(?:[^\s]+))/i;

    // Check if the first content line contains both a diagram type and a title
    if (diagramTypeRegex.test(firstLine) && titleRegex.test(firstLine)) {
        const titleMatch = firstLine.match(titleRegex);
        if (titleMatch) {
            const fullTitleStatement = titleMatch[0]; // e.g., 'title "My Title"'
            const titleContent = titleMatch[1];       // e.g., '"My Title"' or 'MyTitle'

            // Remove the full title statement from the first line
            const diagramTypePart = firstLine.replace(fullTitleStatement, '').trim();
            
            // Reconstruct the corrected title line, ensuring 'title' is lowercase
            const correctedTitleLine = 'title ' + titleContent;

            // Replace the original faulty line with just the diagram type part
            lines[firstLineIndex] = diagramTypePart;
            // Insert the corrected title on the next line, correctly indented
            // Using a standard 4-space indent
            lines.splice(firstLineIndex + 1, 0, `    ${correctedTitleLine}`);
            
            return lines.join('\n');
        }
    }

    return chartText; // No changes needed
};


interface MermaidDiagramProps {
  chart: string;
  onConvertToTable: () => void;
}

export const MermaidDiagram: React.FC<MermaidDiagramProps> = ({ chart, onConvertToTable }) => {
    const ref = useRef<HTMLDivElement>(null);
    const [id] = useState(generateId());
    const [svg, setSvg] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [rawChartCode, setRawChartCode] = useState(chart);

    useEffect(() => {
        let isMounted = true;
        setSvg(null);
        setError(null);
        
        const finalChart = preprocessChart(chart);
        setRawChartCode(finalChart); // Store the processed chart for the copy button

        const renderDiagram = async () => {
            try {
                if (finalChart) {
                    await mermaid.parse(finalChart);
                    const { svg: renderedSvg } = await mermaid.render(id, finalChart);
                    if (isMounted) {
                        setSvg(renderedSvg);
                    }
                }
            } catch (e) {
                console.error("Mermaid render/parse error:", e);
                if (isMounted) {
                    let errorMessage = 'Не удалось построить диаграмму. Похоже, AI сгенерировал код с ошибкой.';
                    if (e instanceof Error && e.message) {
                        const match = e.message.match(/Parse error on line \d+:\n(.*)\n/);
                        errorMessage = match?.[1] ? `Ошибка синтаксиса: ${match[1].trim()}` : 'Ошибка синтаксиса в сгенерированной диаграмме.';
                    }
                    setError(errorMessage);
                }
            }
        };

        if (chart) {
             renderDiagram();
        }
        
        return () => {
            isMounted = false;
        };
    }, [chart, id]);
    
    const copyToClipboard = () => {
        navigator.clipboard.writeText(error ? chart : rawChartCode);
        toast.success('Код диаграммы скопирован!');
    }

    return (
        <div className="not-prose my-4 p-4 bg-white border border-gray-200 rounded-lg shadow-sm overflow-x-auto relative">
            <div className="absolute top-2 right-2 z-10 flex items-center gap-2">
                {error && (
                    <button
                        onClick={onConvertToTable}
                        className="flex items-center gap-1.5 bg-blue-100 text-blue-800 text-xs font-semibold py-1 px-2 rounded-md transition-colors hover:bg-blue-200 border border-blue-200"
                        aria-label="Конвертировать в таблицу"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 3h16a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z"/><path d="M4 9h16"/><path d="M10 3v18"/></svg>
                        В таблицу
                    </button>
                )}
                 <button
                    onClick={copyToClipboard}
                    className="flex items-center gap-1.5 bg-gray-100 text-gray-600 text-xs font-semibold py-1 px-2 rounded-md transition-colors hover:bg-gray-200 border border-gray-200"
                    aria-label="Скопировать код диаграммы"
                >
                   <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.72"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.72-1.72"/></svg>
                    Код
                </button>
            </div>

            {error ? (
                <div className="text-red-700 bg-red-50 p-4 rounded-lg mt-8">
                    <p className="font-bold">Ошибка построения диаграммы</p>
                    <p className="text-sm mt-1 font-mono bg-red-100 p-2 rounded">{error}</p>
                     <p className="text-xs mt-3 text-gray-600">
                        Похоже, AI сгенерировал код с ошибкой. Попробуйте конвертировать диаграмму в таблицу (стоимость 1 генерация).
                    </p>
                </div>
            ) : svg ? (
                <div ref={ref} dangerouslySetInnerHTML={{ __html: svg }} />
            ) : (
                 <div className="flex items-center justify-center h-48 text-gray-400">
                    <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    <span>Загрузка диаграммы...</span>
                </div>
            )}
        </div>
    );
};
