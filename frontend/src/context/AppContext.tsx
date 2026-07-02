'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '@/services/api';
import { Driver, Bus } from '@/types';

type Theme = 'light' | 'dark';
type Lang = 'ru' | 'uz';

interface Translations {
  [key: string]: {
    ru: string;
    uz: string;
  };
}

export const translations: Translations = {
  logoTitle: { ru: 'My', uz: 'My' },
  logoSub: { ru: ' Bus Station', uz: ' Bus Station' },
  lightTheme: { ru: 'Светлая', uz: 'Kunduzgi' },
  darkTheme: { ru: 'Тёмная', uz: 'Tungi rejim' },
  exit: { ru: 'Выйти', uz: 'Chiqish' },
  loginTitle: { ru: 'Вход в систему', uz: 'Tizimga kirish' },
  registerTitle: { ru: 'Регистрация', uz: 'Roʻyxatdan oʻtish' },
  usernameLabel: { ru: 'Имя пользователя (Username)', uz: 'Foydalanuvchi nomi (Username)' },
  passwordLabel: { ru: 'Пароль', uz: 'Parol' },
  confirmPasswordLabel: { ru: 'Подтвердите пароль', uz: 'Parolni tasdiqlang' },
  emailLabel: { ru: 'E-mail', uz: 'E-mail' },
  loginBtn: { ru: 'Войти', uz: 'Kirish' },
  registerBtn: { ru: 'Зарегистрироваться', uz: 'Roʻyxatdan oʻtish' },
  authSuccess: { ru: 'Регистрация успешна! Теперь вы можете войти.', uz: 'Roʻyxatdan oʻtish muvaffaqiyatli! Endi kirishingiz mumkin.' },
  
  navSchedule: { ru: '📊 Расписание', uz: '📊 Jadvallar' },
  navFines: { ru: '⚠️ Штрафы', uz: '⚠️ Jarimalar' },
  navDrivers: { ru: '👨‍✈️ Все водители', uz: '👨‍✈️ Haydovchilar' },
  navBuses: { ru: '🚌 Все автобусы', uz: '🚌 Avtobuslar' },
  navTech: { ru: '🔧 Тех. обслуживание', uz: '🔧 Texnik koʻrik' },
  navSalary: { ru: '💰 Зарплата', uz: '💰 Oylik maosh' },
  navHours: { ru: '⏱️ Рабочее время', uz: '⏱️ Ish vaqti' },

  scheduleTitle: { ru: 'Расписание рейсов', uz: 'Yoʻnalishlar jadvali' },
  scheduleSub: { ru: 'Контроль автобусов по четным и нечетным дням', uz: 'Avtobuslarning juft va toq kunlar grafigi nazorati' },
  selectDate: { ru: 'Выберите дату (Календарь)', uz: 'Sanani tanlang (Kalendar)' },
  evenDay: { ru: 'Bugun: Juft kun grafigi', uz: 'Bugun: Juft kun grafigi' }, // wait, Uzbek wording
  oddDay: { ru: 'Bugun: Toq kun grafigi', uz: 'Bugun: Toq kun grafigi' },
  todayEven: { ru: 'Bugun: Juft kun grafigi', uz: 'Bugun: Juft kun grafigi' },
  todayOdd: { ru: 'Bugun: Toq kun grafigi', uz: 'Bugun: Toq kun grafigi' },
  
  metricOnline: { ru: 'Автобусов на линии', uz: 'Avtobuslar yoʻnalishda' },
  metricDrivers: { ru: 'Всего водителей', uz: 'Jami haydovchilar' },
  metricRoutes: { ru: 'Маршруты', uz: 'Yoʻnalishlar' },
  metricRepair: { ru: 'В ремонте / Блок', uz: 'Taʼmirlashda / Blok' },

  colDriver: { ru: 'Водитель', uz: 'Haydovchi' },
  colBusNum: { ru: 'Гос. номер', uz: 'Davlat raqami' },
  colRoute: { ru: 'Маршрут', uz: 'Yoʻnalish' },
  colShift: { ru: 'Смена (Время)', uz: 'Smena (Vaqt)' },
  colDayType: { ru: 'Тип дня', uz: 'Kun turi' },
  colStatus: { ru: 'Статус', uz: 'Holat' },
  colActions: { ru: 'Действия', uz: 'Harakatlar' },
  
  statusOnRoute: { ru: 'Yo\'nalishda', uz: 'Yoʻnalishda' },
  statusResting: { ru: 'Dam olmoqda', uz: 'Dam olmoqda' },
  statusBlocked: { ru: 'Bloklangan', uz: 'Bloklangan' },

  btnEditShift: { ru: 'Сменани о\'zgartirish', uz: 'Smenani oʻzgartirish' },
  btnEdit: { ru: 'Редактировать', uz: 'Tahrirlash' },
  btnDelete: { ru: 'Удалить', uz: 'Oʻchirish' },
  btnSave: { ru: 'Сохранить', uz: 'Saqlash' },
  btnCancel: { ru: 'Отмена', uz: 'Bekor qilish' },
  
  addFineTitle: { ru: 'Добавить новый штраф', uz: 'Yangi jarima qoʻshish' },
  labelFineDate: { ru: 'Дата нарушения:', uz: 'Qoidabuzarlik sanasi:' },
  labelFineAmount: { ru: 'Сумма штрафа (сум):', uz: 'Jarima summasi (soʻm):' },
  labelFineReason: { ru: 'Причина:', uz: 'Sababi:' },
  btnAdd: { ru: 'Добавить', uz: 'Qoʻshish' },
  
  addDriver: { ru: '+ Добавить водителя', uz: '+ Haydovchi qoʻshish' },
  addBus: { ru: '+ Добавить автобус', uz: '+ Avtobus qoʻshish' },
  tiresTab: { ru: 'Шины', uz: 'Shinalar' },
  brakesTab: { ru: 'Тормоза', uz: 'Tormozlar' },
  kmLeft: { ru: 'Qolgan resurs', uz: 'Qolgan resurs' },
  kmLeftLabel: { ru: 'km left', uz: 'km qoldi' },
  statusLabel: { ru: 'Holati', uz: 'Holati' },
  
  salaryFixed: { ru: 'Фиксированный Оклад', uz: 'Kafolatlangan oylik' },
  salaryFines: { ru: 'Штрафы / Вычеты', uz: 'Jarimalar / Ushlanmalar' },
  salaryTotal: { ru: 'Итого к выдаче', uz: 'Jami toʻlov' },
  salaryPay: { ru: 'То\'lash', uz: 'Toʻlash' },

  hoursGraph: { ru: 'График (Дни)', uz: 'Grafik (Kunlar)' },
  hoursStart: { ru: 'Начало смены', uz: 'Smena boshi' },
  hoursEnd: { ru: 'Конец смены', uz: 'Smena oxiri' },
  hoursWorked: { ru: 'Отработано', uz: 'Ishlangan vaqt' },
  hoursUnit: { ru: 'soat', uz: 'soat' }
};

interface AppContextType {
  theme: Theme;
  lang: Lang;
  isAuthenticated: boolean;
  drivers: Driver[];
  buses: Bus[];
  toggleTheme: () => void;
  setLanguage: (lang: Lang) => void;
  login: (token: string, refresh?: string) => void;
  logout: () => void;
  refreshDrivers: () => Promise<void>;
  refreshBuses: () => Promise<void>;
  t: (key: string) => string;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>('dark');
  const [lang, setLang] = useState<Lang>('ru');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [buses, setBuses] = useState<Bus[]>([]);

  // Check auth and theme on load
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      setIsAuthenticated(true);
    }

    const savedTheme = localStorage.getItem('theme') as Theme;
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.setAttribute('data-theme', savedTheme);
    } else {
      document.documentElement.setAttribute('data-theme', 'dark');
    }

    const savedLang = localStorage.getItem('lang') as Lang;
    if (savedLang) {
      setLang(savedLang);
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  const setLanguage = (newLang: Lang) => {
    setLang(newLang);
    localStorage.setItem('lang', newLang);
  };

  const login = (token: string, refresh?: string) => {
    localStorage.setItem('accessToken', token);
    if (refresh) {
      localStorage.setItem('refreshToken', refresh);
    }
    setIsAuthenticated(true);
  };

  const logout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setIsAuthenticated(false);
    setDrivers([]);
    setBuses([]);
  };

  const refreshDrivers = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const response = await api.get('/drivers/');
      setDrivers(response.data);
    } catch (error) {
      console.error('Failed to fetch drivers', error);
    }
  }, [isAuthenticated]);

  const refreshBuses = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const response = await api.get('/buses/');
      setBuses(response.data);
    } catch (error) {
      console.error('Failed to fetch buses', error);
    }
  }, [isAuthenticated]);

  // Load lists once authenticated
  useEffect(() => {
    if (isAuthenticated) {
      refreshDrivers();
      refreshBuses();
    }
  }, [isAuthenticated, refreshDrivers, refreshBuses]);

  const t = (key: string): string => {
    if (translations[key]) {
      return translations[key][lang] || translations[key]['ru'];
    }
    return key;
  };

  return (
    <AppContext.Provider
      value={{
        theme,
        lang,
        isAuthenticated,
        drivers,
        buses,
        toggleTheme,
        setLanguage,
        login,
        logout,
        refreshDrivers,
        refreshBuses,
        t,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
