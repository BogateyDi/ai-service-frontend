
import React from 'react';
import { toast } from 'react-hot-toast';

interface PurchaseSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  code: string | null;
}

export const PurchaseSuccessModal: React.FC<PurchaseSuccessModalProps> = ({ isOpen, onClose, code }) => {
  if (!isOpen || !code) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    toast.success('Код скопирован!');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-[100] flex justify-center items-center p-4" aria-modal="true" role="dialog" onClick={onClose}>
      <div 
        className="bg-[var(--bg-card)] rounded-2xl shadow-[var(--shadow-deep)] max-w-md w-full overflow-hidden border-2 border-[var(--bg-dark)] flex flex-col p-6 sm:p-8 text-center items-center"
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside
      >
        <div className="w-16 h-16 mb-4 flex items-center justify-center bg-[var(--accent-soft)] rounded-full text-[var(--accent)]">
          <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
          </svg>
        </div>
        
        <h2 className="text-2xl md:text-3xl font-bold text-[var(--text-dark-primary)]">Покупка успешна!</h2>
        
        <p className="mt-4 text-base text-[var(--text-dark-secondary)]">
          Ваш уникальный код доступа готов. Это ваш <strong>постоянный ключ для входа</strong> в систему. Обязательно сохраните его в надежном месте.
        </p>

        <div className="my-6 w-full p-4 bg-gray-100 border-2 border-dashed border-gray-300 rounded-xl flex items-center justify-between gap-4">
            <span className="text-2xl font-bold text-[var(--accent)] tracking-widest font-mono select-all">{code}</span>
            <button 
                onClick={handleCopy}
                className="flex-shrink-0 bg-gray-200 text-[var(--text-dark-primary)] font-semibold p-3 rounded-lg transition-colors hover:bg-gray-300 flex items-center justify-center"
                aria-label="Скопировать код"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
            </button>
        </div>

        <button 
            onClick={onClose}
            className="w-full max-w-xs bg-[var(--accent)] text-white font-semibold py-3 px-6 rounded-lg transition-colors hover:bg-[var(--accent-light)]"
        >
          Понятно
        </button>
      </div>
    </div>
  );
};
