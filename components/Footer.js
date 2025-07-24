import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full bg-[var(--bg-dark)] text-[var(--text-light-secondary)] py-8 mt-12 rounded-t-3xl">
      <div className="container mx-auto px-4 md:px-8 flex flex-col md:flex-row justify-between items-center md:items-start gap-8 text-sm">
        
        {/* Column 1: Logo & Name (Left aligned on desktop) */}
        <div className="text-center md:text-left">
             <div className="flex items-center justify-center md:justify-start gap-2">
                 <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--accent-gold)]"><path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M2 14h2"/><path d="M20 14h2"/><path d="M15 13v2"/><path d="M9 13v2"/></svg>
                 <h3 className="text-lg font-bold text-white">
                    AI - Помощник
                 </h3>
            </div>
            <p className="mt-2 text-xs text-[var(--text-light-secondary)]/80">© {new Date().getFullYear()} AI - Помощник. Все права защищены.</p>
        </div>

        {/* Column 2: Important Notice (Center aligned on desktop) */}
        <div className="text-center max-w-xs">
           <h4 className="font-semibold text-base text-[var(--text-light-primary)] mb-2">Важное уведомление</h4>
          <p className="leading-relaxed text-xs text-[var(--text-light-secondary)]/80">
            Сервис является вспомогательным инструментом. Пользователь несет полную ответственность за проверку на плагиат и соответствие академическим требованиям.
          </p>
        </div>

        {/* Column 3: Partnership (Right aligned on desktop) */}
         <div className="text-center md:text-right">
          <h4 className="font-semibold text-base text-[var(--text-light-primary)] mb-2">Партнерство</h4>
          <p className="text-xs text-[var(--text-light-secondary)]/80">
            <a href="https://t.me/Olishna_gu" target="_blank" rel="noopener noreferrer" className="hover:text-[var(--text-light-primary)] transition-colors">
                @Olishna_gu
            </a>
          </p>
          <p className="text-xs text-[var(--text-light-secondary)]/80 mt-1">ИНН 246310275198</p>
        </div>

      </div>
    </footer>
  );
};