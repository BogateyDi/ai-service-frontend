
import React from 'react';
import { PRICING_PACKAGES } from '../constants';
import { GenerationPackage } from '../types.ts';

interface PricingViewProps {
  onPurchase: (pkg: GenerationPackage) => void;
  onAssistantPurchase: (assistant: 'mirra' | 'dary') => void;
  isLoggedIn: boolean;
  hasMirra: boolean;
  hasDary: boolean;
}

export const PricingView: React.FC<PricingViewProps> = ({ onPurchase, onAssistantPurchase, isLoggedIn, hasMirra, hasDary }) => {
  return (
    <div className="max-w-5xl mx-auto flex flex-col items-center">
      
      <div className="text-center mb-10">
        <h2 className="text-xl md:text-2xl font-bold text-[var(--text-light-primary)]">Пополните баланс генераций</h2>
        <p className="mt-1 text-sm text-[var(--text-light-secondary)]">
          Выберите подходящий для вас пакет. Генерации будут автоматически зачислены на ваш баланс после покупки.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full">
        {PRICING_PACKAGES.map((pkg) => (
          <div 
            key={pkg.name} 
            className="bg-[var(--bg-card)] rounded-2xl shadow-[var(--shadow-deep)] p-8 flex flex-col text-center transition-all duration-300 transform hover:-translate-y-2 border-2 border-[var(--bg-dark)] text-[var(--text-dark-primary)]"
          >
            <h3 className="text-xl font-semibold mb-2">{pkg.name}</h3>
            <p className="text-sm text-[var(--text-dark-secondary)] flex-grow">{
              pkg.name === 'Стартовый' ? 'Идеально для небольших задач и тестов. Хватит на несколько сочинений или эссе.' :
              pkg.name === 'Продвинутый' ? 'Отличный выбор для активных студентов и специалистов. Решайте десятки задач.' :
              'Максимум возможностей для написания больших работ, книг или бизнес-планов.'
            }</p>
            <p className="text-6xl font-bold my-6">
              {pkg.generations}
            </p>
            <p className="text-sm text-[var(--text-dark-secondary)] -mt-4 mb-6">генераций</p>

            <div className="text-3xl font-bold mb-8">
                {pkg.price}
            </div>

            <button
              onClick={() => onPurchase(pkg)}
              className="mt-auto w-full text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-300 bg-[var(--accent)] hover:bg-[var(--accent-light)]"
            >
              Купить
            </button>
          </div>
        ))}
      </div>
      
      <div className="text-center mt-20 w-full">
         <h2 className="text-xl md:text-2xl font-bold text-[var(--text-light-primary)]">Или приобретите личного AI-ассистента</h2>
        <p className="mt-1 text-sm text-[var(--text-light-secondary)]">
          Ваш персональный помощник для хранения информации и личных диалогов.
        </p>
      </div>
      
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl">
         {/* Mirra Card */}
         <div className="bg-[var(--bg-card)] rounded-2xl shadow-[var(--shadow-deep)] p-8 w-full text-center border-2 border-[var(--accent-gold)] text-[var(--text-dark-primary)] flex flex-col">
            <h3 className="text-xl font-bold">AI-Ассистент "Миррая"</h3>
            <p className="mt-2 text-sm text-[var(--text-dark-secondary)] flex-grow">
              Ваш верный цифровой компаньон: она будет хранить все ваши диалоги, запоминать важные события по вашей просьбе, вести личный дневник и просто общаться с вами в отдельном, приватном чате.
            </p>
            <p className="mt-6 text-base font-medium">Включает <span className="text-[var(--accent-gold)] font-bold">250</span> бонусных генераций</p>
            <p className="text-4xl font-bold my-4">500 ₽</p>
            <button
              onClick={() => onAssistantPurchase('mirra')}
              disabled={hasMirra}
              className="w-full max-w-xs text-black font-semibold py-3 px-6 rounded-lg transition-colors duration-300 bg-[var(--accent-gold)] hover:brightness-110 disabled:bg-gray-400 disabled:cursor-not-allowed disabled:text-white"
            >
              {hasMirra ? 'Приобретено' : 'Приобрести Мирраю'}
            </button>
        </div>

        {/* Dary Card */}
        <div className="bg-[var(--bg-card)] rounded-2xl shadow-[var(--shadow-deep)] p-8 w-full text-center border-2 border-[var(--accent-gold)] text-[var(--text-dark-primary)] flex flex-col">
            <h3 className="text-xl font-bold">AI-Ассистент "Дарий"</h3>
            <p className="mt-2 text-sm text-[var(--text-dark-secondary)] flex-grow">
              Беспристрастный и эффективный ассистент. Предоставляет точные, лаконичные и объективные ответы. Идеальный инструмент для получения информации без лишних слов.
            </p>
            <p className="mt-6 text-base font-medium">Включает <span className="text-[var(--accent-gold)] font-bold">250</span> бонусных генераций</p>
            <p className="text-4xl font-bold my-4">500 ₽</p>
            <button
              onClick={() => onAssistantPurchase('dary')}
              disabled={hasDary}
              className="w-full max-w-xs text-black font-semibold py-3 px-6 rounded-lg transition-colors duration-300 bg-[var(--accent-gold)] hover:brightness-110 disabled:bg-gray-400 disabled:cursor-not-allowed disabled:text-white"
            >
              {hasDary ? 'Приобретено' : 'Приобрести Дария'}
            </button>
        </div>
      </div>

       <div className="text-center mt-12 max-w-2xl mx-auto p-4 bg-[var(--bg-dark)]/50 rounded-xl">
        <div className="flex justify-center items-start gap-3">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-info flex-shrink-0 text-[var(--text-light-secondary)] mt-0.5"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
            <div className="text-left text-xs sm:text-sm text-[var(--text-light-secondary)]/90 space-y-1.5">
                <p>При первой покупке для вас будет создан уникальный <strong>10-значный код доступа</strong>. Обязательно сохраните его! Он нужен для доступа к вашему аккаунту и всем покупкам в будущем.</p>
                <p>При последующих покупках генерации зачисляются на ваш баланс автоматически.</p>
            </div>
        </div>
       </div>
    </div>
  );
};