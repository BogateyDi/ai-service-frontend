import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import { AppView } from '../types.js';

interface HeaderProps {
  onNavigate: (view: AppView) => void;
  onSelectAssistant: (assistant: 'mirra' | 'dary') => void;
  onShowTerms: () => void;
  onLogin: (code: string) => void;
  onLogout: () => void;
  currentUserCode: string | null;
  remainingGenerations: number;
  hasMirra: boolean;
  hasDary: boolean;
}

const NavButton: React.FC<{ onClick: () => void, children: React.ReactNode }> = ({ onClick, children }) => (
    <button onClick={onClick} className="text-sm font-medium text-[var(--text-light-secondary)] hover:text-[var(--text-light-primary)] transition-colors whitespace-nowrap">
        {children}
    </button>
);

const NavSeparator: React.FC = () => <div className="w-px h-4 bg-gray-600" />;

export const Header: React.FC<HeaderProps> = ({ onNavigate, onSelectAssistant, onShowTerms, onLogin, onLogout, currentUserCode, remainingGenerations, hasMirra, hasDary }) => {
  const [code, setCode] = useState('');

  const handleLoginClick = () => {
    if (!code.trim()) {
        toast.error('Пожалуйста, введите код доступа.');
        return;
    }
    onLogin(code.trim().toUpperCase());
    setCode('');
  };

  const navLinks = [];
  if (hasMirra) {
    navLinks.push({ key: 'mirra', component: <NavButton onClick={() => onSelectAssistant('mirra')}><span className="text-[var(--accent-gold)] font-semibold transition-all hover:brightness-110">Миррая</span></NavButton> });
  }
  if (hasDary) {
    navLinks.push({ key: 'dary', component: <NavButton onClick={() => onSelectAssistant('dary')}><span className="text-[var(--accent-gold)] font-semibold transition-all hover:brightness-110">Дарий</span></NavButton> });
  }
  navLinks.push({ key: 'generator', component: <NavButton onClick={() => onNavigate(AppView.GENERATOR)}>Генератор</NavButton> });
  navLinks.push({ key: 'pricing', component: <NavButton onClick={() => onNavigate(AppView.PRICING)}>Купить</NavButton> });
  navLinks.push({ key: 'terms', component: <NavButton onClick={onShowTerms}>Условия</NavButton> });


  return (
    <header className="fixed top-4 left-0 right-0 z-50 px-2 sm:px-4">
      <style>{`
        @keyframes head-sway-header { 0% { transform: rotate(0); } 25% { transform: rotate(-5deg); } 75% { transform: rotate(5deg); } 100% { transform: rotate(0); } }
        .robot-head-group-header { animation: head-sway-header 2.5s ease-in-out infinite; transform-origin: center 14px; }
        @keyframes eye-scan-header { 0%, 100% { transform: translateX(0); } 40% { transform: translateX(-1px); } 90% { transform: translateX(1px); } }
        .robot-eyes-header { animation: eye-scan-header 2s ease-in-out infinite; }
      `}</style>
      <nav className="container mx-auto max-w-4xl p-3 flex flex-wrap items-center justify-between gap-y-3 bg-black rounded-2xl border-2 border-[var(--border-color-dark)] shadow-[var(--shadow-deep)]">
        
        {/* --- LEFT GROUP (Logo on mobile, Logo+Navs on desktop) --- */}
        <div className="flex items-center gap-4">
            {/* Logo */}
            <div className="flex items-center gap-2">
                 <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--accent-gold)]">
                    <g className="robot-head-group-header">
                      <path d="M12 8V4H8"/>
                      <rect width="16" height="12" x="4" y="8" rx="2"/>
                      <g className="robot-eyes-header">
                        <path d="M15 13v2"/>
                        <path d="M9 13v2"/>
                      </g>
                    </g>
                 </svg>
                 <h1 className="text-lg md:text-xl font-bold text-white hidden sm:block">
                    AI - Помощник
                 </h1>
            </div>
            {/* Nav Links (Desktop only) */}
            <div className="hidden md:flex items-center gap-3">
               {navLinks.map((link, index) => (
                    <React.Fragment key={link.key}>
                        {link.component}
                        {index < navLinks.length - 1 && <NavSeparator />}
                    </React.Fragment>
               ))}
            </div>
        </div>

        {/* --- RIGHT GROUP (User Controls) --- */}
        <div className="flex items-center gap-2">
            {currentUserCode ? (
              <>
                <div className="flex items-center gap-2 bg-[var(--border-color-dark)]/50 text-[var(--accent-gold)] px-3 py-1.5 rounded-full border border-[var(--border-color-dark)]">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-sparkles opacity-80"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/><path d="M5 3v4"/><path d="M19 17v4"/><path d="M3 5h4"/><path d="M17 19h4"/></svg>
                    <span className="font-semibold text-sm">
                        {remainingGenerations}
                    </span>
                </div>
                <button
                    onClick={onLogout}
                    className="bg-gray-600 text-white font-semibold text-sm rounded-full px-5 py-2 transition-transform hover:scale-105"
                >
                    Выйти
                </button>
              </>
            ) : (
              <>
                <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    onKeyUp={(e) => { if (e.key === 'Enter') handleLoginClick(); }}
                    placeholder="Код доступа"
                    className="bg-[var(--bg-light)] text-white placeholder-gray-400 text-sm rounded-full px-4 py-2 w-32 md:w-40 border border-transparent focus:border-[var(--accent-gold)] focus:outline-none transition"
                    aria-label="Код доступа"
                />
                <button
                    onClick={handleLoginClick}
                    className="bg-[var(--accent-gold)] text-black font-semibold text-sm rounded-full px-5 py-2 transition-transform hover:scale-105"
                >
                    Войти
                </button>
              </>
            )}
        </div>
        
        {/* --- BOTTOM ROW (Nav Links for Mobile) --- */}
        <div className="w-full md:hidden flex justify-center items-center gap-2 sm:gap-3 pt-3 border-t border-[var(--border-color-dark)] flex-wrap">
           {navLinks.map((link, index) => (
                <React.Fragment key={link.key}>
                    {link.component}
                    {index < navLinks.length - 1 && <NavSeparator />}
                </React.Fragment>
           ))}
        </div>
      </nav>
    </header>
  );
};