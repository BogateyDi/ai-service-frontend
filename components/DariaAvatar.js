
import React from 'react';

export const DaryAvatar: React.FC = () => {
  return (
    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center p-1 border-2 border-gray-300">
       <svg width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--bg-light)]">
            <path d="M12 8V4H8"/>
            <rect width="16" height="12" x="4" y="8" rx="2"/>
            <path d="M15 13v2"/>
            <path d="M9 13v2"/>
        </svg>
    </div>
  );
};
