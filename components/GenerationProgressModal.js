
import React from 'react';

const MatrixRain: React.FC = () => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789アァカサタナハマヤャラワガザダバパイィキシチニヒミリヰギジヂビピウゥクスツヌフムユュルグズブヅプエェケセテネヘメレヱゲゼデベペオォコソトノホモヨョロヲゴゾドボポヴッн';
    const columns = Array.from({ length: 30 }).map((_, i) => {
        const randomChars = Array.from({ length: 40 }).map(() => characters[Math.floor(Math.random() * characters.length)]).join('');
        const duration = Math.random() * 10 + 10; // 10s to 20s
        const delay = Math.random() * -10; // start at different times
        return {
            id: i,
            chars: randomChars,
            style: {
                animationDuration: `${duration}s`,
                animationDelay: `${delay}s`,
            },
        };
    });

    return (
        <div className="absolute inset-0 z-0 flex justify-center overflow-hidden">
            <style>{`
                @keyframes fall {
                    from { transform: translateY(-100%); }
                    to { transform: translateY(100%); }
                }
                .matrix-column {
                    writing-mode: vertical-rl;
                    text-orientation: mixed;
                    white-space: nowrap;
                    user-select: none;
                    animation-name: fall;
                    animation-timing-function: linear;
                    animation-iteration-count: infinite;
                }
            `}</style>
            {columns.map(col => (
                <div key={col.id} style={col.style} className="matrix-column text-lg text-black/30 font-mono px-1">
                    {col.chars}
                </div>
            ))}
        </div>
    );
};


interface GenerationProgressModalProps {
  isOpen: boolean;
  title: string;
  progressMessage: string;
}

export const GenerationProgressModal: React.FC<GenerationProgressModalProps> = ({ isOpen, title, progressMessage }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-[100] flex justify-center items-center p-4" aria-modal="true" role="dialog">
      <div className="bg-[var(--bg-card)] rounded-2xl shadow-[var(--shadow-deep)] max-w-sm w-full overflow-hidden border-2 border-[var(--bg-dark)] flex flex-col">
        <style>{`
            @keyframes head-sway { 0% { transform: rotate(0); } 25% { transform: rotate(-6deg); } 75% { transform: rotate(6deg); } 100% { transform: rotate(0); } }
            .robot-head-group { animation: head-sway 2.5s ease-in-out infinite; transform-origin: center 14px; }
            @keyframes eye-scan { 0%, 100% { transform: translateX(0); } 40% { transform: translateX(-1.5px); } 90% { transform: translateX(1.5px); } }
            .robot-eyes { animation: eye-scan 2s ease-in-out infinite; }
            .mask-gradient-linear {
                mask-image: linear-gradient(to bottom, black 50%, transparent 100%);
                -webkit-mask-image: linear-gradient(to bottom, black 50%, transparent 100%);
            }
        `}</style>
        
        {/* Top visual part */}
        <div className="relative h-48 bg-gray-900/10 flex items-center justify-center mask-gradient-linear flex-shrink-0">
             <MatrixRain />
             {/* Robot Icon */}
             <div className="relative w-24 h-24 flex items-center justify-center">
                 <svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <g className="robot-head-group">
                        <path d="M12 8V4H8" stroke="var(--accent-gold)"/>
                        <rect width="16" height="12" x="4" y="8" rx="2" stroke="var(--accent-gold)"/>
                        <g className="robot-eyes">
                            <path d="M15 13v2" stroke="var(--accent-gold)"/>
                            <path d="M9 13v2" stroke="var(--accent-gold)"/>
                        </g>
                    </g>
                </svg>
             </div>
        </div>

        {/* Bottom text part */}
        <div className="p-6 sm:p-8 text-center flex flex-col items-center">
            <h2 className="text-xl md:text-2xl font-bold text-[var(--text-dark-primary)]">{title}</h2>
            <p className="mt-2 text-base text-[var(--accent)] animate-pulse min-h-[24px]">
                {progressMessage}
            </p>
            <div className="mt-6 w-full p-3 bg-yellow-50 text-yellow-800 rounded-lg border border-yellow-200 text-sm">
                <p className="font-semibold">Пожалуйста, не закрывайте окно.</p>
                <p className="text-xs mt-1">Данные генерации могут быть потеряны.</p>
            </div>
        </div>
      </div>
    </div>
  );
};
