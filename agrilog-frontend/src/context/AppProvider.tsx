'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

type Theme = 'light' | 'dark';
type Language = 'vi' | 'en';

interface AppContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  timezone: string;
  setTimezone: (tz: string) => void;
  t: (key: string) => string;
}

const translations: Record<Language, Record<string, string>> = {
  vi: {
    'settings.title': 'Cài đặt',
    'settings.subtitle': 'Quản lý tài khoản và tùy chỉnh hệ thống',
    'settings.account': 'Tài khoản',
    'settings.password': 'Mật khẩu',
    'settings.notifications': 'Thông báo',
    'settings.language': 'Ngôn ngữ',
    'settings.appearance': 'Giao diện',
    'settings.security': 'Bảo mật',
    'dashboard.title': 'Dashboard',
    'diary.cultivation': 'Nhật ký canh tác',
    'diary.fertilizer': 'Nhật ký phân bón',
    'diary.pesticide': 'Nhật ký thuốc BVTV',
    'inventory': 'Kho vật tư',
    'marketplace': 'Marketplace',
    'tasks': 'Lịch công việc',
    'reports': 'Báo cáo',
    'billing': 'Gói dịch vụ',
    'logout': 'Đăng xuất',
  },
  en: {
    'settings.title': 'Settings',
    'settings.subtitle': 'Manage account and customize system preferences',
    'settings.account': 'Account',
    'settings.password': 'Password',
    'settings.notifications': 'Notifications',
    'settings.language': 'Language',
    'settings.appearance': 'Appearance',
    'settings.security': 'Security',
    'dashboard.title': 'Dashboard',
    'diary.cultivation': 'Cultivation Diary',
    'diary.fertilizer': 'Fertilizer Diary',
    'diary.pesticide': 'Pesticide Diary',
    'inventory': 'Inventory',
    'marketplace': 'Marketplace',
    'tasks': 'Task Schedule',
    'reports': 'Reports',
    'billing': 'Subscription Plans',
    'logout': 'Logout',
  }
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: React.ReactNode }) => {
  const [theme, setThemeState] = useState<Theme>('light');
  const [language, setLanguageState] = useState<Language>('vi');
  const [timezone, setTimezoneState] = useState<string>('GMT+7');

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as Theme;
    const savedLang = localStorage.getItem('language') as Language;
    const savedTz = localStorage.getItem('timezone');
    
    if (savedTheme) {
      setThemeState(savedTheme);
      document.body.setAttribute('data-theme', savedTheme);
    }
    
    if (savedLang) {
      setLanguageState(savedLang);
    }
    
    if (savedTz) {
      setTimezoneState(savedTz);
    }
  }, []);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem('theme', newTheme);
    document.body.setAttribute('data-theme', newTheme);
  };

  const setLanguage = (newLang: Language) => {
    setLanguageState(newLang);
    localStorage.setItem('language', newLang);
  };

  const setTimezone = (newTz: string) => {
    setTimezoneState(newTz);
    localStorage.setItem('timezone', newTz);
  };

  const t = (key: string): string => {
    return translations[language][key] || translations['vi'][key] || key;
  };

  return (
    <AppContext.Provider value={{ theme, setTheme, language, setLanguage, timezone, setTimezone, t }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
