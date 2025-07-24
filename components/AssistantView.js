import React, { useState, useEffect, useRef, useMemo } from 'react';
import { toast } from 'react-hot-toast';
import { MirraAvatar } from './MirraAvatar.js';
import { DaryAvatar } from './DariaAvatar.js';
import { VerticalSelector } from './VerticalSelector.js';
import { STUDENT_DOC_TYPES_STANDARD, STUDENT_DOC_TYPES_INTERACTIVE, ADULT_CATEGORIES, DOC_TYPES_BY_ADULT_CATEGORY, CHILDREN_AGES } from '../constants.js';


const formatBytes = (bytes, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};


// --- ADMIN DASHBOARD ---
const AdminDashboard = ({ userAccounts, setUserAccounts, onExitAdminMode, currentUserCode, onLogout }) => {
    const [editGenerations, setEditGenerations] = useState({});
    const [editLimits, setEditLimits] = useState({});
    const [searchTerm, setSearchTerm] = useState('');
    const [sortConfig, setSortConfig] = useState({ key: 'code', direction: 'ascending' });
    
    const TOTAL_SERVER_CAPACITY_BYTES = 100 * 1024 * 1024; // 100 MB

    const stats = useMemo(() => {
        const accounts = Array.from(userAccounts.values());
        const totalStorage = accounts.reduce((sum, acc) => {
            return sum + new TextEncoder().encode(JSON.stringify(acc)).length;
        }, 0);
        return {
            totalUsers: accounts.length,
            totalGenerations: accounts.reduce((sum, acc) => sum + acc.generations, 0),
            totalMirra: accounts.filter(acc => acc.hasMirra).length,
            totalDary: accounts.filter(acc => acc.hasDary).length,
            totalStorage: totalStorage,
            storagePercentage: Math.round((totalStorage / TOTAL_SERVER_CAPACITY_BYTES) * 100)
        };
    }, [userAccounts]);

    const sortedAndFilteredUsers = useMemo(() => {
        let items = Array.from(userAccounts.entries()).map(([code, account]) => ({
            code,
            account,
            dataSize: new TextEncoder().encode(JSON.stringify(account)).length
        }));

        if (searchTerm) {
            items = items.filter(item => item.code.toLowerCase().includes(searchTerm.toLowerCase()));
        }

        if (sortConfig) {
            items.sort((a, b) => {
                let aValue, bValue;
                switch (sortConfig.key) {
                    case 'generations': aValue = a.account.generations; bValue = b.account.generations; break;
                    case 'dataSize': aValue = a.dataSize; bValue = b.dataSize; break;
                    case 'maxStorageSize': aValue = a.account.maxStorageSize || 0; bValue = b.account.maxStorageSize || 0; break;
                    case 'code': default: aValue = a.code.toLowerCase(); bValue = b.code.toLowerCase(); break;
                }
                if (aValue < bValue) return sortConfig.direction === 'ascending' ? -1 : 1;
                if (aValue > bValue) return sortConfig.direction === 'ascending' ? 1 : -1;
                return 0;
            });
        }
        return items;
    }, [userAccounts, searchTerm, sortConfig]);

    const requestSort = (key) => {
        let direction = 'ascending';
        if (sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    const getSortArrow = (key) => {
        if (sortConfig.key !== key) return null;
        return sortConfig.direction === 'ascending' ? ' ▲' : ' ▼';
    };
    
    const handleUpdateGenerations = (code) => {
        const amount = parseInt(editGenerations[code] || '0', 10);
        if (isNaN(amount)) {
            toast.error("Некорректное число.");
            return;
        }

        setUserAccounts(prev => {
            const newAccounts = new Map(prev);
            const account = newAccounts.get(code);
            if (account) {
                const newGenerations = Math.max(0, account.generations + amount);
                newAccounts.set(code, { ...account, generations: newGenerations });
                toast.success(`Баланс ${code} обновлен на ${amount}. Новый баланс: ${newGenerations}`);
            }
            return newAccounts;
        });
        setEditGenerations(prev => ({ ...prev, [code]: '' }));
    };
    
    const handleUpdateLimit = (code) => {
        const limitMb = parseFloat(editLimits[code] || '0');
        if (isNaN(limitMb) || limitMb < 0) {
            toast.error("Некорректный лимит.");
            return;
        }
        const limitBytes = limitMb * 1024 * 1024;

        setUserAccounts(prev => {
            const newAccounts = new Map(prev);
            const account = newAccounts.get(code);
            if (account) {
                newAccounts.set(code, { ...account, maxStorageSize: limitBytes });
                toast.success(`Лимит для ${code} обновлен до ${limitMb} МБ.`);
            }
            return newAccounts;
        });
        setEditLimits(prev => ({ ...prev, [code]: '' }));
    };

    const handleToggleAssistant = (code, assistant) => {
        setUserAccounts(prev => {
            const newAccounts = new Map(prev);
            const account = newAccounts.get(code);
            if (account) {
                const key = assistant === 'mirra' ? 'hasMirra' : 'hasDary';
                const hasAssistant = !account[key];
                newAccounts.set(code, { ...account, [key]: hasAssistant });
                toast.success(`Доступ к ${assistant === 'mirra' ? 'Миррае' : 'Дарию'} для ${code} ${hasAssistant ? 'выдан' : 'отозван'}.`);
            }
            return newAccounts;
        });
    };

    const handleDeleteUser = (code) => {
        if (window.confirm(`Вы уверены, что хотите удалить пользователя с кодом ${code}? Это действие необратимо.`)) {
            setUserAccounts(prev => {
                const newAccounts = new Map(prev);
                newAccounts.delete(code);
                return newAccounts;
            });
            toast.success(`Пользователь ${code} удален.`);
            if (code === currentUserCode) {
                onLogout();
            }
        }
    };

    const StatCard = ({ title, value, icon, subtitle }) => (
      <div className="bg-gray-800 p-4 rounded-lg flex items-center gap-4">
        <div className="text-gray-400">{icon}</div>
        <div>
          <div className="text-gray-400 text-sm">{title}</div>
          <div className="text-white text-2xl font-bold">{value}</div>
           {subtitle}
        </div>
      </div>
    );
    
    return (
        <div className="bg-gray-900 text-white rounded-lg p-4 flex flex-col h-full overflow-hidden">
            <div className="flex justify-between items-center mb-4 flex-shrink-0">
                <h3 className="text-xl font-bold">Панель администратора</h3>
                <button onClick={onExitAdminMode} className="bg-red-600 text-white px-3 py-1.5 rounded-md text-sm font-semibold hover:bg-red-700 transition-colors">Выйти</button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-4 flex-shrink-0">
                <StatCard title="Всего пользователей" value={stats.totalUsers} icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>} />
                <StatCard title="Всего генераций" value={stats.totalGenerations.toLocaleString('ru-RU')} icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>} />
                <StatCard title="Владельцев Мирраи" value={stats.totalMirra} icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-pink-400"><path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M15 13v2"/><path d="M9 13v2"/></svg>} />
                <StatCard title="Владельцев Дария" value={stats.totalDary} icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-400"><path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M15 13v2"/><path d="M9 13v2"/></svg>} />
                <StatCard title="Всего занято" value={formatBytes(stats.totalStorage)} subtitle={<div className="text-gray-400 text-xs mt-1">({stats.storagePercentage}%)</div>} icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>} />
                <StatCard title="Емкость сервера" value={formatBytes(TOTAL_SERVER_CAPACITY_BYTES)} icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="8" x="2" y="2" rx="2" ry="2"/><rect width="20" height="8" x="2" y="14" rx="2" ry="2"/><line x1="6" x2="6.01" y1="6" y2="6"/><line x1="6" x2="6.01" y1="18" y2="18"/></svg>} />
            </div>
             <div className="mb-4 flex-shrink-0">
                <input
                    type="text"
                    placeholder="Поиск по коду..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 text-white placeholder-gray-400"
                />
            </div>
            <div className="flex-grow overflow-auto">
                <table className="w-full text-sm text-left text-gray-300">
                    <thead className="text-xs text-gray-400 uppercase bg-gray-800 sticky top-0">
                        <tr>
                            <th scope="col" className="px-2 py-3 cursor-pointer" onClick={() => requestSort('code')}>Код{getSortArrow('code')}</th>
                            <th scope="col" className="px-2 py-3 cursor-pointer" onClick={() => requestSort('generations')}>Генерации{getSortArrow('generations')}</th>
                            <th scope="col" className="px-2 py-3 cursor-pointer" onClick={() => requestSort('dataSize')}>Память{getSortArrow('dataSize')}</th>
                            <th scope="col" className="px-2 py-3 cursor-pointer" onClick={() => requestSort('maxStorageSize')}>Лимит (МБ){getSortArrow('maxStorageSize')}</th>
                            <th scope="col" className="px-2 py-3 text-center">Ассистенты</th>
                            <th scope="col" className="px-2 py-3 text-center">Действия</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sortedAndFilteredUsers.map(({ code, account, dataSize }) => (
                            <tr key={code} className="bg-gray-800/50 border-b border-gray-700 hover:bg-gray-700/50">
                                <td className="px-2 py-2 font-mono font-medium text-white">{code}</td>
                                <td className="px-2 py-2">
                                    <div className="flex items-center gap-1">
                                        <span className="font-bold text-base w-12 text-right">{account.generations}</span>
                                        <input 
                                            type="number" 
                                            value={editGenerations[code] || ''}
                                            onChange={(e) => setEditGenerations(prev => ({...prev, [code]: e.target.value}))}
                                            className="bg-gray-700 border border-gray-600 rounded-md p-1 w-20 text-white"
                                            placeholder="+/-"
                                        />
                                        <button onClick={() => handleUpdateGenerations(code)} className="bg-green-600 text-white rounded-md p-1.5 text-xs hover:bg-green-700">OK</button>
                                    </div>
                                </td>
                                <td className="px-2 py-2 text-xs">
                                    {formatBytes(dataSize)} / <span className="text-gray-400">{formatBytes(account.maxStorageSize || 0)}</span>
                                </td>
                                <td className="px-2 py-2">
                                    <div className="flex items-center gap-1">
                                        <input 
                                            type="number" 
                                            value={editLimits[code] || ''}
                                            onChange={(e) => setEditLimits(prev => ({...prev, [code]: e.target.value}))}
                                            className="bg-gray-700 border border-gray-600 rounded-md p-1 w-20 text-white"
                                            placeholder={`${((account.maxStorageSize || 0) / (1024 * 1024)).toFixed(1)}`}
                                        />
                                        <button onClick={() => handleUpdateLimit(code)} className="bg-green-600 text-white rounded-md p-1.5 text-xs hover:bg-green-700">OK</button>
                                    </div>
                                </td>
                                <td className="px-2 py-2 text-center">
                                    <div className="flex items-center justify-center gap-2">
                                        <button onClick={() => handleToggleAssistant(code, 'mirra')} className={`px-2 py-1 text-xs rounded ${account.hasMirra ? 'bg-pink-500 text-white' : 'bg-gray-600 text-gray-300'}`}>M</button>
                                        <button onClick={() => handleToggleAssistant(code, 'dary')} className={`px-2 py-1 text-xs rounded ${account.hasDary ? 'bg-blue-500 text-white' : 'bg-gray-600 text-gray-300'}`}>D</button>
                                    </div>
                                </td>
                                <td className="px-2 py-2 text-center">
                                    <button onClick={() => handleDeleteUser(code)} className="text-red-500 hover:text-red-400 font-bold p-1">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};


const ToggleButton = ({isToggled, onClick, children, icon}) => (
    <button
        onClick={onClick}
        className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-full transition-all border-2 ${isToggled ? 'bg-[var(--accent)] text-white border-[var(--accent)]' : 'bg-gray-600 text-gray-200 border-gray-600 hover:bg-gray-500 hover:border-gray-500'}`}
    >
        {icon}
        {children}
        <span className="font-bold hidden sm:inline">{isToggled ? 'Вкл' : 'Выкл'}</span>
    </button>
);

const ActionButton = ({ onClick, children, icon}) => (
    <button
        onClick={onClick}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-full transition-colors border-2 bg-gray-600 text-gray-200 border-gray-600 hover:border-gray-500 hover:bg-gray-500"
    >
        {icon}
        {children}
    </button>
);

const FavoriteServiceButton = ({ service, onNavigate, onRemove }) => (
    <div className="relative group">
        <button
            onClick={() => onNavigate(service)}
            className="flex items-center gap-1.5 pl-3 pr-2 py-1.5 text-xs font-semibold rounded-full transition-colors border-2 bg-gray-600 text-gray-200 border-gray-600 hover:border-gray-500 hover:bg-gray-500"
        >
            <span className="truncate" style={{maxWidth: '100px'}}>{service.docType}{service.age ? ` (${service.age})` : ''}</span>
        </button>
        <button 
            onClick={() => onRemove(service)}
            className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
            aria-label={`Удалить ${service.docType}`}
        >
            &times;
        </button>
    </div>
);


const MessageContentWithCopyButton = ({ text }) => {
    const referralRegex = /(https:\/\/aipomochnik\.ru\?ref=[A-Z0-9]{10})/;
    const parts = text.split(referralRegex);
    
    if (parts.length <= 1) {
        return <>{text}</>;
    }

    const handleCopy = (url) => {
        navigator.clipboard.writeText(url);
        toast.success('Реферальная ссылка скопирована!');
    };

    return (
        <>
            {parts.map((part, index) => {
                if (index % 2 === 1) { 
                    return (
                        <div key={index} className="my-2 flex items-center gap-2 p-2 pr-3 bg-gray-200 rounded-lg border border-gray-300 w-full max-w-full">
                            <span className="font-mono text-sm text-gray-700 break-all flex-grow">{part}</span>
                            <button
                                onClick={() => handleCopy(part)}
                                className="flex-shrink-0 bg-white text-[var(--text-dark-primary)] font-semibold p-2 rounded-md shadow-sm transition-colors hover:bg-gray-100 border border-gray-300"
                                aria-label="Скопировать ссылку"
                            >
                               <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
                            </button>
                        </div>
                    );
                }
                return <span key={index}>{part}</span>;
            })}
        </>
    );
};

const AddFavoriteModal = ({ onClose, onAddFavorite }) => {
    const [audience, setAudience] = useState('children');
    const [adultCategory, setAdultCategory] = useState(ADULT_CATEGORIES[0]);
    const [selectedDocType, setSelectedDocType] = useState(STUDENT_DOC_TYPES_STANDARD[0]);
    const [age, setAge] = useState(CHILDREN_AGES[6]); // default 12

    useEffect(() => {
        if (audience === 'children') {
            setSelectedDocType(STUDENT_DOC_TYPES_STANDARD[0]);
        } else {
            setSelectedDocType(DOC_TYPES_BY_ADULT_CATEGORY[adultCategory][0]);
        }
    }, [audience, adultCategory]);
    
    const handlePin = () => {
        const service = {
            docType: selectedDocType,
        };
        if (audience === 'children') {
            service.age = age;
        }
        onAddFavorite(service);
        onClose();
    };

    return (
        <div className="absolute inset-0 bg-black/40 z-20 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full flex flex-col p-6" onClick={e => e.stopPropagation()}>
                <h3 className="text-xl font-bold text-center">Закрепить новый сервис</h3>
                <p className="text-sm text-center text-gray-500 mt-1 mb-6">Он появится в панели быстрого доступа.</p>

                <div className="relative flex items-center bg-gray-100 rounded-xl w-full p-1 border border-gray-200 shadow-sm mb-4">
                    <div className="absolute top-1 h-[calc(100%-8px)] w-[calc(50%-4px)] bg-[var(--accent)] shadow-md rounded-lg transition-transform duration-300 ease-in-out" style={{ transform: audience === 'children' ? 'translateX(4px)' : 'translateX(calc(100% + 4px))' }}/>
                    <div className="relative flex w-full z-10">
                        <button type="button" onClick={() => setAudience('children')} className={`w-1/2 px-4 py-2 text-sm font-medium rounded-lg transition-colors duration-300 focus:outline-none ${audience === 'children' ? 'text-white' : 'text-gray-600 hover:text-black'}`}>Дети</button>
                        <button type="button" onClick={() => setAudience('adults')} className={`w-1/2 px-4 py-2 text-sm font-medium rounded-lg transition-colors duration-300 focus:outline-none ${audience === 'adults' ? 'text-white' : 'text-gray-600 hover:text-black'}`}>Взрослые</button>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    {audience === 'children' ? (
                        <>
                            <VerticalSelector title="Возраст" items={CHILDREN_AGES.map(String)} selectedValue={String(age)} onSelect={(val) => setAge(Number(val))} />
                            <div className="flex flex-col gap-2">
                                <VerticalSelector title="Написание работ" items={STUDENT_DOC_TYPES_STANDARD} selectedValue={selectedDocType} onSelect={(val) => setSelectedDocType(val)} />
                                <VerticalSelector title="Интерактив" items={STUDENT_DOC_TYPES_INTERACTIVE} selectedValue={selectedDocType} onSelect={(val) => setSelectedDocType(val)} />
                            </div>
                        </>
                    ) : (
                        <>
                            <VerticalSelector title="Категория" items={ADULT_CATEGORIES} selectedValue={adultCategory} onSelect={setAdultCategory} />
                            <VerticalSelector title="Формат" items={DOC_TYPES_BY_ADULT_CATEGORY[adultCategory] || []} selectedValue={selectedDocType} onSelect={(val) => setSelectedDocType(val)} />
                        </>
                    )}
                </div>

                <div className="flex justify-end gap-3 mt-6">
                    <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">Отмена</button>
                    <button onClick={handlePin} className="px-4 py-2 text-sm font-medium text-white bg-[var(--accent)] rounded-lg hover:bg-[var(--accent-light)]">Закрепить</button>
                </div>
            </div>
        </div>
    );
};



export const AssistantView = ({
  assistantType, messages, onSendMessage, isLoading, isLoggedIn, settings, onToggleSetting,
  onRequestReferralCode, favoriteServices, onAddFavorite, onRemoveFavorite, onNavigateToService,
  currentUserCode, isAdminMode, onExitAdminMode, generationHistory, userAccounts, setUserAccounts, onLogout
}) => {
  const [input, setInput] = useState('');
  const [isFavModalOpen, setIsFavModalOpen] = useState(false);
  const messagesEndRef = useRef(null);
  const isMirra = assistantType === 'mirra';

  useEffect(() => {
    // Scroll to the latest message when the view becomes active or messages update.
    if (!isLoading) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading, assistantType]);

  const handleSend = (e) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      onSendMessage(input.trim());
      setInput('');
    }
  };

  const findGenerationRecord = (id) => {
      if (!id) return undefined;
      return generationHistory.find(r => r.id === id);
  };

  const handleDownloadAttachment = (record) => {
    const blob = new Blob([record.text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${record.title.replace(/[:]/g, '')}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success('Файл успешно скачан!');
  };

  if (!isLoggedIn) {
      return (
        <div className="bg-[var(--bg-card)] rounded-2xl shadow-[var(--shadow-deep)] p-8 text-center text-[var(--text-dark-primary)] max-w-2xl mx-auto -mt-16 relative z-10">
          <h2 className="text-2xl font-bold">Ассистент недоступен</h2>
          <p className="mt-2 text-base text-[var(--text-dark-secondary)]">Пожалуйста, войдите в систему или приобретите ассистента, чтобы начать общение.</p>
        </div>
      );
  }

  return (
    <div className="bg-[var(--bg-card)] rounded-2xl shadow-[var(--shadow-deep)] h-[80vh] flex flex-col text-[var(--text-dark-primary)] -mt-16 relative z-10">
      {isAdminMode ? (
          <AdminDashboard 
            userAccounts={userAccounts} 
            setUserAccounts={setUserAccounts} 
            onExitAdminMode={onExitAdminMode}
            currentUserCode={currentUserCode}
            onLogout={onLogout}
          />
      ) : (
        <>
          <div className="p-4 border-b-2 border-gray-200 flex-shrink-0">
            <div className="flex flex-wrap items-center justify-center gap-2">
                <ToggleButton isToggled={settings.internetEnabled} onClick={() => onToggleSetting('internetEnabled')} icon={<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>}>Интернет</ToggleButton>
                <ToggleButton isToggled={settings.memoryEnabled} onClick={() => onToggleSetting('memoryEnabled')} icon={<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg>}>Память</ToggleButton>
                
                {favoriteServices.map(service => (
                    <FavoriteServiceButton key={`${service.docType}-${service.age || ''}`} service={service} onNavigate={onNavigateToService} onRemove={onRemoveFavorite} />
                ))}

                {favoriteServices.length < 2 && (
                    <button 
                        onClick={() => setIsFavModalOpen(true)}
                        className="flex items-center justify-center w-8 h-8 rounded-full transition-colors border-2 bg-gray-600 text-gray-200 border-gray-600 hover:border-gray-500 hover:bg-gray-500"
                        aria-label="Закрепить новый сервис"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
                    </button>
                )}
                
                {isMirra && <ActionButton onClick={onRequestReferralCode} icon={<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>}>Реф. ссылка</ActionButton>}
            </div>
          </div>
          
          <div className="flex-grow overflow-y-auto py-2 px-1 sm:p-4 space-y-6 chat-scrollbar">
            {messages.map((msg, index) => {
              const record = findGenerationRecord(msg.sharedGenerationId);
              return (
                <div key={index} className={`flex items-start gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {msg.role === 'model' && (isMirra ? <MirraAvatar /> : <DaryAvatar />)}
                  
                  <div className={`flex flex-col gap-1 items-${msg.role === 'user' ? 'end' : 'start'}`}>
                      <div className={`w-fit max-w-full sm:max-w-md md:max-w-lg lg:max-w-xl p-3 px-4 rounded-2xl ${msg.role === 'user' ? 'bg-[var(--accent)] text-white rounded-br-lg' : 'bg-gray-100 text-gray-800 rounded-bl-lg'}`}>
                          <div className="whitespace-pre-wrap break-words"><MessageContentWithCopyButton text={msg.text} /></div>
                      </div>
                      {record && (
                        <div className="mt-1 flex items-center gap-2 p-2 pr-3 bg-gray-100 rounded-lg border border-gray-200 w-fit max-w-xs">
                           <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-white rounded-md border border-gray-200">
                             <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/></svg>
                           </div>
                           <div className="flex-grow overflow-hidden">
                              <p className="text-sm font-medium truncate text-gray-800">{record.title}</p>
                              <p className="text-xs text-gray-500">{formatBytes(new TextEncoder().encode(record.text).length)}</p>
                           </div>
                           <button onClick={() => handleDownloadAttachment(record)} className="flex-shrink-0 p-2 rounded-full hover:bg-gray-200 transition-colors">
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-600"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
                           </button>
                        </div>
                      )}
                  </div>

                  {msg.role === 'user' && (
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center text-lg text-white font-bold">
                        {isMirra ? <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> : <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>}
                    </div>
                  )}
                </div>
              )
            })}
            {isLoading && (
              <div className="flex items-start gap-3 justify-start">
                {isMirra ? <MirraAvatar /> : <DaryAvatar />}
                <div className="p-3 px-4 rounded-2xl bg-gray-100 rounded-bl-lg">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" style={{animationDelay: '0s'}}></span>
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></span>
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="flex-shrink-0 p-4 border-t-2 border-gray-200">
            <form onSubmit={handleSend}>
              <div className="relative flex-grow">
                 <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { handleSend(e); } }}
                  placeholder="Введите ваше сообщение..."
                  rows={1}
                  className="w-full bg-gray-100 border-2 border-gray-200 rounded-full py-3 px-5 focus:outline-none focus:border-[var(--accent)] resize-none max-h-24"
                  disabled={isLoading}
                />
              </div>
            </form>
          </div>
        </>
      )}
      {isFavModalOpen && <AddFavoriteModal onClose={() => setIsFavModalOpen(false)} onAddFavorite={onAddFavorite} />}
    </div>
  );
};