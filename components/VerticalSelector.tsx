
import React from 'react';

interface VerticalSelectorProps {
  items: string[];
  selectedValue: string;
  onSelect: (value: string) => void;
  isDisabled?: boolean;
  title: string;
}

const BUTTON_HEIGHT = 38; // px

export const VerticalSelector: React.FC<VerticalSelectorProps> = ({
  items,
  selectedValue,
  onSelect,
  isDisabled = false,
  title,
}) => {
  const selectedIndex = items.indexOf(selectedValue);

  const highlightStyle: React.CSSProperties = {
    height: `${BUTTON_HEIGHT}px`,
    transform: selectedIndex > -1 ? `translateY(${selectedIndex * BUTTON_HEIGHT}px)` : 'translateY(0)',
    opacity: selectedIndex > -1 ? 1 : 0,
  };
  
  return (
    <div className="flex flex-col w-full">
        <h3 className="text-sm font-medium text-center text-[var(--text-dark-secondary)] mb-2">{title}</h3>
        <div
        className={`relative w-full bg-gray-100 rounded-xl p-1 border border-gray-200 shadow-sm ${isDisabled ? 'opacity-60 pointer-events-none' : ''}`}
        >
        <div
            className="absolute top-1 left-1 right-1 bg-[var(--accent)] shadow-md rounded-lg transition-transform duration-300 ease-in-out"
            style={highlightStyle}
        />
        <div className="relative flex flex-col w-full z-10">
            {items.map((item) => (
            <button
                key={item}
                type="button"
                onClick={() => onSelect(item)}
                disabled={isDisabled}
                className={`w-full px-4 text-sm font-medium rounded-lg transition-colors duration-300 focus:outline-none text-center`}
                style={{ height: `${BUTTON_HEIGHT}px` }}
            >
                <span className={`transition-colors duration-300 ${selectedValue === item ? 'text-white' : 'text-[var(--text-dark-secondary)] hover:text-[var(--text-dark-primary)]'}`}>
                 {item}
                </span>
            </button>
            ))}
        </div>
        </div>
    </div>
  );
};
