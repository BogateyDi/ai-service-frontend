


import React, { useState, useCallback, useEffect } from 'react';
import { Header } from './components/Header';
import { GeneratorView } from './components/GeneratorView';
import { PricingView } from './components/PricingView';
import { AssistantView } from './components/AssistantView';
import { TermsOfUseModal } from './components/TermsOfUseModal';
import { PurchaseSuccessModal } from './components/PurchaseSuccessModal';
import { AppView, GenerationPackage, UserAccount, ChatMessage, GenerationRecord, DocumentType, GenerationResult, FavoriteService } from './types';
import { Toaster, toast } from 'react-hot-toast';
import { Footer } from './components/Footer';
import { sendStatelessMessage } from './services/geminiService';
import { GenerationProgressModal } from './components/GenerationProgressModal';


const CHAT_HISTORY_LIMIT = 50;
const GENERATION_HISTORY_LIMIT = 20;
const DEFAULT_STORAGE_LIMIT_BYTES = 1 * 1024 * 1024; // 1 MB

// New component for the background effect
const MatrixBackground: React.FC<{ isAnimating: boolean }> = ({ isAnimating }) => {
    const [columns, setColumns] = useState<{ id: number; chars: string; style: React.CSSProperties }[]>([]);

    useEffect(() => {
        if (typeof window === 'undefined') return;

        const characters = 'アァカサタナハマヤャラワガザダバパイィキシチニヒミリヰギジヂビピウゥクスツヌフムユュルグズブヅプエェケセテネヘメレヱゲゼデベペオォコソトノホモヨョロヲゴゾドボポヴッн0123456789';
        const columnWidth = 20;
        const columnCount = Math.floor(window.innerWidth / columnWidth);
        const newColumns = [];

        for (let i = 0; i < columnCount; i++) {
            const randomChars = Array.from({ length: Math.floor(Math.random() * 20) + 30 })
                .map(() => characters[Math.floor(Math.random() * characters.length)])
                .join('');
            const duration = Math.random() * 60 + 80;
            const delay = Math.random() * -25;

            newColumns.push({
                id: i,
                chars: randomChars,
                style: {
                    animationDuration: `${duration}s`,
                    animationDelay: `${delay}s`,
                    left: `${(i / columnCount) * 100}%`,
                    width: `${columnWidth}px`
                },
            });
        }
        setColumns(newColumns);
    }, []);

    return (
        <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            overflow: 'hidden',
            zIndex: -1,
            pointerEvents: 'none'
        }}>
           <style>{`
              @keyframes matrix-fall {
                  from { transform: translateY(-100%); }
                  to { transform: translateY(100vh); }
              }
              .matrix-column-bg {
                  position: absolute;
                  top: 0;
                  writing-mode: vertical-rl;
                  text-orientation: mixed;
                  white-space: nowrap;
                  user-select: none;
                  animation-name: matrix-fall;
                  animation-timing-function: linear;
                  animation-iteration-count: infinite;
                  color: rgba(255, 255, 255, 0.15);
                  font-family: 'Courier New', Courier, monospace;
                  font-size: 1rem;
                  animation-play-state: paused;
              }
              .matrix-column-bg.animating {
                animation-play-state: running;
              }
          `}</style>
          {columns.map(col => (
            <div key={col.id} style={col.style} className={`matrix-column-bg ${isAnimating ? 'animating' : ''}`}>
              {col.chars}
            </div>
          ))}
        </div>
    );
};


export default function App() {
  const [userAccounts, setUserAccounts] = useState<Map<string, UserAccount>>(() => {
    try {
      const saved = localStorage.getItem('userAccounts');
      const parsedAccounts = saved ? JSON.parse(saved) : [];
      
      const validateChatHistory = (history: any[]): ChatMessage[] => {
         return (history || [])
            .filter(
                (msg: any): msg is ChatMessage => (msg.role === 'user' || msg.role === 'model') && typeof msg.text === 'string'
            )
            .map((msg: any) => {
                const newMsg: ChatMessage = { role: msg.role, text: msg.text };
                if (Array.isArray(msg.sources)) {
                    newMsg.sources = msg.sources.filter(
                        (s: any) => typeof s === 'object' && s !== null && typeof s.uri === 'string' && typeof s.title === 'string'
                    );
                }
                if (typeof msg.timestamp === 'number') {
                    newMsg.timestamp = msg.timestamp;
                }
                if (typeof msg.sharedGenerationId === 'string') {
                    newMsg.sharedGenerationId = msg.sharedGenerationId;
                }
                return newMsg;
            });
      };

      const validateFavoriteServices = (services: any): FavoriteService[] => {
        if (!Array.isArray(services)) return [];
        return services.map(s => {
            if (typeof s === 'string') { // Old format (string)
                return { docType: s as DocumentType };
            }
            if (typeof s === 'object' && s !== null && typeof s.docType === 'string') { // New format (object)
                const fav: FavoriteService = { docType: s.docType };
                if (typeof s.age === 'number') {
                    fav.age = s.age;
                }
                return fav;
            }
            return null;
        }).filter((s): s is FavoriteService => s !== null);
      };

      const accountsWithDefaults = parsedAccounts.map(([code, account]: [string, any]) => {
          const validatedMirraHistory = validateChatHistory(account.mirraChatHistory).slice(-CHAT_HISTORY_LIMIT);
          const validatedDaryHistory = validateChatHistory(account.daryChatHistory).slice(-CHAT_HISTORY_LIMIT);
          
          const validatedGenerationHistory = (account.generationHistory || []).filter(
              (rec: any): rec is GenerationRecord => typeof rec.id === 'string' && typeof rec.title === 'string' && typeof rec.docType === 'string' && typeof rec.timestamp === 'number' && typeof rec.text === 'string'
          ).slice(0, GENERATION_HISTORY_LIMIT);

          const validatedFavoriteServices = validateFavoriteServices(account.favoriteServices);

          const userAccount: UserAccount = {
              generations: typeof account === 'number' ? account : (account.generations || 0),
              referrerCode: account.referrerCode,
              generationHistory: validatedGenerationHistory,
              favoriteServices: validatedFavoriteServices,
              hasMirra: account.hasMirra || false,
              mirraChatHistory: validatedMirraHistory,
              mirraSettings: account.mirraSettings || { internetEnabled: true, memoryEnabled: true },
              hasDary: account.hasDary || false,
              daryChatHistory: validatedDaryHistory,
              darySettings: account.darySettings || { internetEnabled: true, memoryEnabled: true },
              maxStorageSize: account.maxStorageSize || DEFAULT_STORAGE_LIMIT_BYTES,
          };
          return [code, userAccount];
      });
      return saved ? new Map(accountsWithDefaults) : new Map();
    } catch (e) {
      console.error("Could not load user accounts from localStorage", e);
      return new Map();
    }
  });

  const [currentUserCode, setCurrentUserCode] = useState<string | null>(() => localStorage.getItem('currentUserCode') || null);
  const [remainingGenerations, setRemainingGenerations] = useState<number>(0);
  const [favoriteServices, setFavoriteServices] = useState<FavoriteService[]>([]);
  
  // Mirra State
  const [hasMirra, setHasMirra] = useState<boolean>(false);
  const [mirraChatHistory, setMirraChatHistory] = useState<ChatMessage[]>([]);
  const [mirraSettings, setMirraSettings] = useState({ internetEnabled: true, memoryEnabled: true });
  const [isMirraChatLoading, setIsMirraChatLoading] = useState<boolean>(false);

  // Dary State
  const [hasDary, setHasDary] = useState<boolean>(false);
  const [daryChatHistory, setDaryChatHistory] = useState<ChatMessage[]>([]);
  const [darySettings, setDarySettings] = useState({ internetEnabled: true, memoryEnabled: true });
  const [isDaryChatLoading, setIsDaryChatLoading] = useState<boolean>(false);

  const [view, setView] = useState<AppView>(AppView.GENERATOR);
  const [activeAssistant, setActiveAssistant] = useState<'mirra' | 'dary' | null>(null);

  const [isTermsModalOpen, setIsTermsModalOpen] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isPurchaseSuccessModalOpen, setIsPurchaseSuccessModalOpen] = useState<boolean>(false);
  const [lastPurchasedCode, setLastPurchasedCode] = useState<string | null>(null);

  // Global state for generation result to persist across views
  const [currentResult, setCurrentResult] = useState<GenerationResult | null>(null);
  
  // State to trigger navigation to a specific generator service
  const [initialGeneratorDocType, setInitialGeneratorDocType] = useState<DocumentType | null>(null);
  const [initialGeneratorAge, setInitialGeneratorAge] = useState<number | null>(null);

  // Admin Mode State
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [currentUserDataSize, setCurrentUserDataSize] = useState(0);

  // State for assistant processing modal
  const [assistantModalState, setAssistantModalState] = useState({ isOpen: false, title: '', message: '' });

  // Referral system: check for ref code in URL on first visit
  useEffect(() => {
    const hasAccount = localStorage.getItem('currentUserCode');
    const hasReferralCode = localStorage.getItem('referralCode');
    if (hasAccount || hasReferralCode) {
        return;
    }

    try {
        const urlParams = new URLSearchParams(window.location.search);
        const refCode = urlParams.get('ref');
        if (refCode && refCode.length === 10 && /^[A-Z0-9]+$/.test(refCode)) {
            localStorage.setItem('referralCode', refCode);
            toast('Вы перешли по реферальной ссылке! 🌟');
        }
    } catch (e) {
        console.error("Error processing referral link:", e);
    }
  }, []);
  
  // Update state when user logs in/out
  useEffect(() => {
    if (currentUserCode && userAccounts.has(currentUserCode)) {
      const account = userAccounts.get(currentUserCode)!;
      setRemainingGenerations(account.generations);
      setFavoriteServices(account.favoriteServices || []);
      // Mirra
      setHasMirra(account.hasMirra);
      setMirraChatHistory(account.mirraChatHistory);
      setMirraSettings(account.mirraSettings);
      // Dary
      setHasDary(account.hasDary);
      setDaryChatHistory(account.daryChatHistory);
      setDarySettings(account.darySettings);
      // Admin data
      const accountString = JSON.stringify(account);
      setCurrentUserDataSize(new TextEncoder().encode(accountString).length);

    } else {
      setRemainingGenerations(0);
      setFavoriteServices([]);
      setHasMirra(false);
      setMirraChatHistory([]);
      setMirraSettings({ internetEnabled: true, memoryEnabled: true });
      setHasDary(false);
      setDaryChatHistory([]);
      setDarySettings({ internetEnabled: true, memoryEnabled: true });
      setCurrentResult(null); // Clear result on logout
      setActiveAssistant(null); // Clear active assistant on logout
      setIsAdminMode(false); // Reset admin mode on logout
      setCurrentUserDataSize(0);
    }
  }, [currentUserCode, userAccounts]);

  // Persist user accounts to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('userAccounts', JSON.stringify(Array.from(userAccounts.entries())));
    } catch(e) { console.error("Could not save accounts to localStorage", e); }
  }, [userAccounts]);

  // Persist current user session to localStorage
  useEffect(() => {
    try {
      if (currentUserCode) {
        localStorage.setItem('currentUserCode', currentUserCode);
      } else {
        localStorage.removeItem('currentUserCode');
      }
    } catch (e) { console.error("Could not save current user to localStorage", e); }
  }, [currentUserCode]);

  const handleLogin = useCallback((code: string) => {
    if (userAccounts.has(code)) {
      setCurrentUserCode(code);
      toast.success('Вы успешно вошли в систему!');
    } else {
      toast.error('Неверный код доступа.');
    }
  }, [userAccounts]);

  const handleLogout = useCallback(() => {
    setCurrentUserCode(null);
    setIsAdminMode(false);
    toast('Вы вышли из системы.', { icon: '👋' });
    setView(AppView.GENERATOR);
  }, []);

  const updateUserAccount = useCallback((updateFn: (account: UserAccount) => UserAccount) => {
    if (!currentUserCode) return;
    setUserAccounts(prev => {
        const newAccounts = new Map(prev);
        const account = newAccounts.get(currentUserCode);
        if (account) {
            const updatedAccount = updateFn(account);

            // Storage limit check
            if (updatedAccount.maxStorageSize) {
                const dataSize = new TextEncoder().encode(JSON.stringify(updatedAccount)).length;
                if (dataSize > updatedAccount.maxStorageSize) {
                    toast.error('Достигнут лимит памяти. Пожалуйста, очистите историю или свяжитесь с поддержкой.', { duration: 5000 });
                    return prev; // Abort update
                }
            }
            
            newAccounts.set(currentUserCode, updatedAccount);
        }
        return newAccounts;
    });
  }, [currentUserCode]);
  
  const _registerNewUser = useCallback((initialGenerations: number, hasMirra: boolean, hasDary: boolean) => {
    const newCode = crypto.randomUUID().replace(/-/g, '').toUpperCase().slice(0, 10);
    const referralCode = localStorage.getItem('referralCode');

    const newAccount: UserAccount = {
      generations: initialGenerations,
      hasMirra,
      hasDary,
      mirraChatHistory: [],
      daryChatHistory: [],
      mirraSettings: { internetEnabled: true, memoryEnabled: true },
      darySettings: { internetEnabled: true, memoryEnabled: true },
      generationHistory: [],
      favoriteServices: [],
      maxStorageSize: DEFAULT_STORAGE_LIMIT_BYTES,
      ...(referralCode ? { referrerCode: referralCode } : {})
    };
    
    setUserAccounts(prev => {
      const updatedAccounts = new Map(prev);
      updatedAccounts.set(newCode, newAccount);
      
      if (referralCode && updatedAccounts.has(referralCode)) {
          const referrerAccount = updatedAccounts.get(referralCode)!;
          const bonus = (hasMirra || hasDary) ? 250 : initialGenerations;
          const updatedReferrerAccount: UserAccount = {
              ...referrerAccount,
              generations: referrerAccount.generations + bonus,
          };
          updatedAccounts.set(referralCode, updatedReferrerAccount);
          setTimeout(() => toast.success(`Бонус в ${bonus} генераций начислен вашему другу!`, { duration: 4000 }), 500);
          localStorage.removeItem('referralCode');
      }

      return updatedAccounts;
    });

    setCurrentUserCode(newCode);
    setLastPurchasedCode(newCode);
    setIsPurchaseSuccessModalOpen(true);
  }, []);

  const handlePurchase = useCallback((pkg: GenerationPackage) => {
    const REFERRAL_BONUS = pkg.generations;

    if (currentUserCode) { // Existing user topping up
      setUserAccounts(prev => {
          const updatedAccounts = new Map(prev);
          const account = updatedAccounts.get(currentUserCode);
          if (account) {
            const updatedAccount = { ...account, generations: account.generations + pkg.generations };
            updatedAccounts.set(currentUserCode, updatedAccount);

            if (account.referrerCode && updatedAccounts.has(account.referrerCode)) {
                const referrerAccount = updatedAccounts.get(account.referrerCode)!;
                const updatedReferrerAccount: UserAccount = {
                    ...referrerAccount,
                    generations: referrerAccount.generations + REFERRAL_BONUS,
                };
                updatedAccounts.set(account.referrerCode, updatedReferrerAccount);
                setTimeout(() => toast.success(`Ваш друг получил бонус ${REFERRAL_BONUS} генераций!`, { duration: 4000 }), 500);
            }
          }
          return updatedAccounts;
      });
      toast.success(`Баланс успешно пополнен на ${pkg.generations} генераций!`);
      setView(AppView.GENERATOR);
    } else { // New user registration
      _registerNewUser(pkg.generations, false, false);
    }
  }, [currentUserCode, _registerNewUser]);
  
  const handleAssistantPurchase = useCallback((assistant: 'mirra' | 'dary') => {
    const ASSISTANT_BONUS = 250;
    const isMirra = assistant === 'mirra';

    if (currentUserCode) { // Existing user buys an assistant
        const account = userAccounts.get(currentUserCode);
        if ((isMirra && account?.hasMirra) || (!isMirra && account?.hasDary)) {
            toast.error(`У вас уже есть ассистент "${isMirra ? 'Миррая' : 'Дарий'}".`);
            return;
        }

        setUserAccounts(prev => {
            const updatedAccounts = new Map(prev);
            const currentAccount = updatedAccounts.get(currentUserCode);
            if (currentAccount) {
                const updatedAccount: UserAccount = {
                    ...currentAccount,
                    generations: currentAccount.generations + ASSISTANT_BONUS,
                    hasMirra: currentAccount.hasMirra || isMirra,
                    hasDary: currentAccount.hasDary || !isMirra,
                };
                updatedAccounts.set(currentUserCode, updatedAccount);

                if (currentAccount.referrerCode && updatedAccounts.has(currentAccount.referrerCode)) {
                    const referrerAccount = updatedAccounts.get(currentAccount.referrerCode)!;
                    const updatedReferrerAccount: UserAccount = {
                        ...referrerAccount,
                        generations: referrerAccount.generations + ASSISTANT_BONUS,
                    };
                    updatedAccounts.set(currentAccount.referrerCode, updatedReferrerAccount);
                    setTimeout(() => toast.success(`Ваш друг получил бонус ${ASSISTANT_BONUS} генераций!`, { duration: 4000 }), 500);
                }
            }
            return updatedAccounts;
        });

        toast.success(`Ассистент "${isMirra ? 'Миррая' : 'Дарий'}" приобретен! Вам начислено ${ASSISTANT_BONUS} бонусных генераций.`);
        setView(AppView.ASSISTANT);
        setActiveAssistant(assistant);

    } else { // New user registration by buying an assistant
        _registerNewUser(ASSISTANT_BONUS, isMirra, !isMirra);
    }
  }, [currentUserCode, userAccounts, _registerNewUser]);

  const useGeneration = useCallback((cost: number = 1) => {
    if (!currentUserCode) {
        toast.error(`Пожалуйста, войдите или приобретите пакет для начала работы.`);
        return false;
    }

    const currentAccount = userAccounts.get(currentUserCode);

    if (currentAccount && currentAccount.generations >= cost) {
        const updatedAccount = { ...currentAccount, generations: currentAccount.generations - cost };
        const newAccounts = new Map(userAccounts);
        newAccounts.set(currentUserCode, updatedAccount);
        setUserAccounts(newAccounts);
        return true;
    } else {
        toast.error(`Недостаточно генераций. Требуется: ${cost}, у вас: ${currentAccount?.generations || 0}.`);
        return false;
    }
  }, [currentUserCode, userAccounts]);
  
  const addGenerationToHistory = useCallback((record: { docType: DocumentType; title: string; text: string; }) => {
      updateUserAccount(account => {
        const newRecord: GenerationRecord = {
            id: crypto.randomUUID(),
            timestamp: Date.now(),
            ...record,
        };
        const oldHistory = account.generationHistory || [];
        const newHistory = [newRecord, ...oldHistory].slice(0, GENERATION_HISTORY_LIMIT); // Keep last 20
        return { ...account, generationHistory: newHistory };
    });
  }, [updateUserAccount]);

  const handleToggleSetting = useCallback((assistant: 'mirra' | 'dary', setting: 'internetEnabled' | 'memoryEnabled') => {
      updateUserAccount(account => {
        const isMirra = assistant === 'mirra';
        const settingsKey = isMirra ? 'mirraSettings' : 'darySettings';
        const oldSettings = account[settingsKey];
        const newSettings = { ...oldSettings, [setting]: !oldSettings[setting] };
        
        toast.success(`Для ассистента "${isMirra ? 'Миррая' : 'Дарий'}" '${setting === 'internetEnabled' ? 'Интернет' : 'Память'}' ${newSettings[setting] ? 'включена' : 'выключена'}.`);
        return { ...account, [settingsKey]: newSettings };
    });
  }, [updateUserAccount]);
  
    const handleAddFavoriteService = useCallback((service: FavoriteService) => {
        updateUserAccount(account => {
            const currentFavorites = account.favoriteServices || [];
            if (currentFavorites.length >= 2) {
                toast.error('Можно добавить не более 2 избранных сервисов.');
                return account;
            }

            const isDuplicate = currentFavorites.some(fav => {
                const isSameDocType = fav.docType === service.docType;
                const isSameAge = fav.age === service.age; // handles undefined
                return isSameDocType && isSameAge;
            });

            if (isDuplicate) {
                toast.error('Этот сервис уже в избранном.');
                return account;
            }
            
            toast.success(`Сервис "${service.docType}" добавлен в избранное!`);
            return { ...account, favoriteServices: [...currentFavorites, service] };
        });
    }, [updateUserAccount]);

    const handleRemoveFavoriteService = useCallback((serviceToRemove: FavoriteService) => {
        updateUserAccount(account => {
            const currentFavorites = account.favoriteServices || [];
            const newFavorites = currentFavorites.filter(fav => {
                const isSameDocType = fav.docType === serviceToRemove.docType;
                const isSameAge = fav.age === serviceToRemove.age;
                return !(isSameDocType && isSameAge);
            });

            if (newFavorites.length < currentFavorites.length) {
                toast(`Сервис "${serviceToRemove.docType}" удален из избранного.`, { icon: '🗑️'});
            }

            return { ...account, favoriteServices: newFavorites };
        });
    }, [updateUserAccount]);

    const handleNavigateToGeneratorService = useCallback((service: FavoriteService) => {
        setInitialGeneratorDocType(service.docType);
        if (service.age) {
          setInitialGeneratorAge(service.age);
        }
        setView(AppView.GENERATOR);
    }, []);

  const handleRequestReferralCode = useCallback(() => {
    if (!currentUserCode) return;
    const detailedReferralText = `Конечно! ✨ Вот твоя персональная реферальная ссылка и правила нашей партнерской программы:\n\n` +
        `**1. Постоянная связь:** Когда твой друг регистрируется по твоей ссылке, он **навсегда** привязывается к твоему аккаунту.\n` +
        `**2. Бонусы за все покупки:** Ты будешь получать бонус в размере **100%** от **каждой** покупки твоего друга в генерациях!\n` +
        `   • Друг покупает Ассистента: ты получаешь **250** генераций.\n` +
        `   • Друг покупает пакет "Стартовый": ты получаешь **10** генераций.\n` +
        `   • Друг покупает пакет "Продвинутый": ты получаешь **200** генераций.\n` +
        `   • Друг покупает пакет "Эксперт": ты получаешь **1000** генераций.\n\n` +
        `Делись этой ссылкой и получайте бонусы вместе!\n\n` +
        `https://aipomochnik.ru?ref=${currentUserCode}`;
        
    const referralMessage: ChatMessage = {
        role: 'model',
        text: detailedReferralText,
        timestamp: Date.now(),
    };
    
    const newUiHistory = [...mirraChatHistory, referralMessage].slice(-CHAT_HISTORY_LIMIT);
    setMirraChatHistory(newUiHistory);

    if (mirraSettings.memoryEnabled) {
       updateUserAccount(account => ({ ...account, mirraChatHistory: newUiHistory }));
    }
  }, [currentUserCode, mirraChatHistory, mirraSettings.memoryEnabled, updateUserAccount]);

  const handleSendMessage = useCallback(async (assistant: 'mirra' | 'dary', message: ChatMessage) => {
    if (assistant === 'mirra' && message.text.trim().toUpperCase() === 'RA951599') {
        toast.success('Панель администратора активирована.');
        setIsAdminMode(true);
        return;
    }

    if (!currentUserCode) {
        toast.error('Пожалуйста, войдите, чтобы общаться с ассистентом.');
        return;
    }

    const currentAccount = userAccounts.get(currentUserCode);
    if (!currentAccount) return;

    const isMirra = assistant === 'mirra';
    const setLoading = isMirra ? setIsMirraChatLoading : setIsDaryChatLoading;
    const setHistory = isMirra ? setMirraChatHistory : setDaryChatHistory;
    
    const settings = currentAccount[isMirra ? 'mirraSettings' : 'darySettings'];
    const history = currentAccount[isMirra ? 'mirraChatHistory' : 'daryChatHistory'];
    
    const userMessage: ChatMessage = message;
    const optimisticHistory = [...history, userMessage];
    setHistory(optimisticHistory);
    setLoading(true);

    try {
        const historyForApi = settings.memoryEnabled ? history : [];
        
        let attachment: GenerationRecord | undefined;
        if (userMessage.sharedGenerationId) {
            attachment = (currentAccount.generationHistory || []).find(r => r.id === userMessage.sharedGenerationId);
        }

        const result = await sendStatelessMessage(assistant, historyForApi, userMessage.text, settings, attachment);
        
        const totalChars = message.text.length + result.text.length + (attachment?.text.length || 0);
        const cost = Math.max(1, Math.ceil(totalChars / 5000));

        let processedText = result.text;
        if (processedText.includes('{USER_CODE}')) {
            processedText = processedText.replace(/{USER_CODE}/g, currentUserCode);
        }
        const modelMessage: ChatMessage = { role: 'model', text: processedText, sources: result.sources, timestamp: Date.now() };

        setUserAccounts(prevAccounts => {
            const account = prevAccounts.get(currentUserCode);
            if (!account || account.generations < cost) {
                toast.error(`Недостаточно генераций. Требуется: ${cost}, у вас: ${account?.generations || 0}.`);
                setHistory(history); // Revert optimistic update
                return prevAccounts;
            }
            
            const finalHistory = [...optimisticHistory, modelMessage].slice(-CHAT_HISTORY_LIMIT);
            const historyKey = isMirra ? 'mirraChatHistory' : 'daryChatHistory';

            const updatedAccount: UserAccount = { 
                ...account,
                generations: account.generations - cost,
                [historyKey]: settings.memoryEnabled ? finalHistory : account[historyKey],
            };
            
            // Storage limit check
            if (updatedAccount.maxStorageSize) {
                const dataSize = new TextEncoder().encode(JSON.stringify(updatedAccount)).length;
                if (dataSize > updatedAccount.maxStorageSize) {
                    toast.error('Достигнут лимит памяти. Пожалуйста, очистите историю или свяжитесь с поддержкой.', { duration: 5000 });
                    setHistory(history); // Revert optimistic update
                    return prevAccounts;
                }
            }

            const newAccounts = new Map(prevAccounts);
            newAccounts.set(currentUserCode, updatedAccount);
            return newAccounts;
        });

    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : JSON.stringify(err);
        const isApiKeyError = (errorMessage.includes('API_KEY_INVALID') || errorMessage.includes('API key not valid'));
        
        if (isApiKeyError) {
             toast.error('Ошибка конфигурации: API ключ недействителен. Пожалуйста, обратитесь к администратору.', { duration: 6000 });
        } else {
            toast.error(errorMessage);
        }
        
        setHistory(history);
    } finally {
        setLoading(false);
    }
  }, [currentUserCode, userAccounts]);
  
  const shareGenerationWithAssistant = async (assistant: 'mirra' | 'dary', result: GenerationResult) => {
      const isMirra = assistant === 'mirra';
      if (!currentUserCode || (isMirra && !hasMirra) || (!isMirra && !hasDary)) {
          toast.error(`Ассистент "${isMirra ? 'Миррая' : 'Дарий'}" не приобретен.`);
          return;
      }
      
      // Download the result as a TXT file
      if (result?.text) {
          try {
              const blob = new Blob([result.text], { type: 'text/plain;charset=utf-8' });
              const url = URL.createObjectURL(blob);
              const link = document.createElement('a');
              
              const safeTitle = `${result.docType} ${result.text.slice(0, 30)}`.replace(/[\/\\?%*:|"<>]/g, '-').slice(0, 50);
              link.download = `${safeTitle}.txt`;
              
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
              URL.revokeObjectURL(url);
              toast('Результат сохранен на ваше устройство.', { icon: '📄' });
          } catch (e) {
              console.error("Failed to download file:", e);
              toast.error("Не удалось сохранить файл на устройство.");
          }
      }

      setAssistantModalState({
        isOpen: true,
        title: 'Отправка ассистенту',
        message: 'Ассистент знакомится с материалами и готовит ответ. Пожалуйста, подождите...',
      });

      let generationRecord: GenerationRecord;
      const currentAccount = userAccounts.get(currentUserCode!);
      const existingRecord = (currentAccount?.generationHistory || []).find(h => h.text === result.text);

      if (existingRecord) {
          generationRecord = existingRecord;
      } else {
          // This record is created here just for the message, the state is updated separately
          generationRecord = {
              id: crypto.randomUUID(),
              timestamp: Date.now(),
              docType: result.docType,
              title: `${result.docType}: ${result.text.slice(0, 40)}...`,
              text: result.text
          };
          const newRecordForState = generationRecord;
          updateUserAccount(account => {
              const newHistory = [newRecordForState, ...(account.generationHistory || [])].slice(0, GENERATION_HISTORY_LIMIT);
              return { ...account, generationHistory: newHistory };
          });
      }

      const userMessageText = isMirra ? `Привет, Миррая! Я хочу обсудить этот контент, который я только что сгенерировал(а).` : `Проанализируй следующий контент:`;

      const chatMessage: ChatMessage = {
          role: 'user',
          text: userMessageText,
          timestamp: Date.now(),
          sharedGenerationId: generationRecord.id,
      };

      setView(AppView.ASSISTANT);
      setActiveAssistant(assistant);

      try {
          await handleSendMessage(assistant, chatMessage);
      } catch (err) {
          console.error("Error sharing with assistant:", err);
      } finally {
          setAssistantModalState({ isOpen: false, title: '', message: '' });
      }
  };


  const headerContent: { [key in AppView]?: { title: string; subtitle?: string } } = {
    [AppView.GENERATOR]: {
      title: 'Ваш многофункциональный сервис',
    },
    [AppView.PRICING]: {
      title: 'Покупка генераций и ассистентов',
      subtitle: 'Выберите наиболее подходящий для вас вариант, чтобы расширить свои возможности.',
    },
    [AppView.ASSISTANT]: {
      title: activeAssistant === 'mirra' ? 'AI-Ассистент "Миррая"' : 'AI-Ассистент "Дарий"',
      subtitle: activeAssistant === 'mirra' 
        ? 'Ваш личный помощник, который помнит всё. Ведите дневник, сохраняйте идеи или просто общайтесь.'
        : 'Объективный и лаконичный AI-ассистент для получения точной информации без лишних слов.',
    }
  };
  const currentHeader = headerContent[view] || headerContent[AppView.GENERATOR]!;

  const handleSelectAssistant = (assistant: 'mirra' | 'dary') => {
      setView(AppView.ASSISTANT);
      setActiveAssistant(assistant);
      setIsAdminMode(false); // Ensure admin mode is off when switching assistants
  };
  
  const isChatLoading = isMirraChatLoading || isDaryChatLoading;
  const currentAccount = currentUserCode ? userAccounts.get(currentUserCode) : null;

  return (
    <div 
      className="min-h-screen font-sans flex flex-col"
      style={{ position: 'relative', zIndex: 0 }}
    >
      <MatrixBackground isAnimating={isGenerating || isChatLoading} />
      <Toaster position="top-center" reverseOrder={false} toastOptions={{
          style: { background: 'var(--bg-dark)', color: 'var(--text-light-primary)', border: '1px solid var(--border-color-dark)', },
          success: { iconTheme: { primary: 'var(--accent)', secondary: 'white' } },
          error: { iconTheme: { primary: '#f43f5e', secondary: 'white' } }
      }} />
      <GenerationProgressModal 
        isOpen={assistantModalState.isOpen}
        title={assistantModalState.title}
        progressMessage={assistantModalState.message}
      />
       <Header 
          onNavigate={setView}
          onSelectAssistant={handleSelectAssistant}
          onShowTerms={() => setIsTermsModalOpen(true)}
          onLogin={handleLogin}
          onLogout={handleLogout}
          currentUserCode={currentUserCode}
          remainingGenerations={remainingGenerations}
          hasMirra={hasMirra}
          hasDary={hasDary}
       />
      <div className="bg-[var(--bg-dark)] text-[var(--text-light-primary)] pt-40 md:pt-28 pb-8 md:pb-12 rounded-b-3xl">
         <div className="container mx-auto px-2 md:px-8 text-center">
             <h2 className="text-2xl md:text-3xl font-bold">{currentHeader.title}</h2>
             {currentHeader.subtitle && <p className="mt-2 text-sm text-[var(--text-light-secondary)] max-w-2xl mx-auto">{currentHeader.subtitle}</p>}
         </div>
      </div>
      
      <main className="container mx-auto p-2 md:px-8 mt-8 flex-grow">
        <div style={{ display: view === AppView.GENERATOR ? 'block' : 'none' }}>
            <GeneratorView
                isLoggedIn={!!currentUserCode}
                remainingGenerations={remainingGenerations}
                useGeneration={useGeneration}
                onBuyGenerations={() => setView(AppView.PRICING)}
                result={currentResult}
                setResult={setCurrentResult}
                onSaveGeneration={addGenerationToHistory}
                onGenerationStateChange={setIsGenerating}
                hasMirra={hasMirra}
                onShareWithMirra={(result) => shareGenerationWithAssistant('mirra', result)}
                hasDary={hasDary}
                onShareWithDary={(result) => shareGenerationWithAssistant('dary', result)}
                initialDocType={initialGeneratorDocType}
                initialAge={initialGeneratorAge}
                onInitialDocTypeHandled={() => {
                    setInitialGeneratorDocType(null);
                    setInitialGeneratorAge(null);
                }}
            />
        </div>
        <div style={{ display: view === AppView.PRICING ? 'block' : 'none' }}>
            <PricingView 
              onPurchase={handlePurchase} 
              onAssistantPurchase={handleAssistantPurchase}
              isLoggedIn={!!currentUserCode}
              hasMirra={hasMirra}
              hasDary={hasDary}
            />
        </div>
        <div style={{ display: view === AppView.ASSISTANT ? 'block' : 'none' }}>
          {activeAssistant && (
            <AssistantView 
              assistantType={activeAssistant}
              messages={activeAssistant === 'mirra' ? mirraChatHistory : daryChatHistory}
              onSendMessage={(message) => handleSendMessage(activeAssistant, { role: 'user', text: message, timestamp: Date.now() })}
              isLoading={activeAssistant === 'mirra' ? isMirraChatLoading : isDaryChatLoading}
              isLoggedIn={!!currentUserCode}
              settings={activeAssistant === 'mirra' ? mirraSettings : darySettings}
              onToggleSetting={(setting) => handleToggleSetting(activeAssistant, setting)}
              onRequestReferralCode={handleRequestReferralCode}
              favoriteServices={favoriteServices}
              onAddFavorite={handleAddFavoriteService}
              onRemoveFavorite={handleRemoveFavoriteService}
              onNavigateToService={handleNavigateToGeneratorService}
              currentUserCode={currentUserCode}
              isAdminMode={isAdminMode}
              onExitAdminMode={() => setIsAdminMode(false)}
              dataSize={currentUserDataSize}
              generationHistory={currentAccount?.generationHistory || []}
              userAccounts={userAccounts}
              setUserAccounts={setUserAccounts}
              onLogout={handleLogout}
            />
          )}
        </div>
      </main>
      <TermsOfUseModal isOpen={isTermsModalOpen} onClose={() => setIsTermsModalOpen(false)} />
      <PurchaseSuccessModal 
        isOpen={isPurchaseSuccessModalOpen} 
        onClose={() => setIsPurchaseSuccessModalOpen(false)}
        code={lastPurchasedCode} 
      />
      <Footer />
    </div>
  );
}