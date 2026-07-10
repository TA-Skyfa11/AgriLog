'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

type Theme = 'light' | 'dark';
type Language = 'vi' | 'en';

export interface CartItem {
  product: any;
  quantity: number;
}

interface AppContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  timezone: string;
  setTimezone: (tz: string) => void;
  t: (key: string) => string;
  cart: CartItem[];
  addToCart: (product: any, quantity: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
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
  const [cart, setCart] = useState<CartItem[]>([]);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as Theme;
    const savedLang = localStorage.getItem('language') as Language;
    const savedTz = localStorage.getItem('timezone');
    const savedCart = localStorage.getItem('cart');
    
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

    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart));
      } catch (e) {
        console.error('Failed to parse cart', e);
      }
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

  const addToCart = (product: any, quantity: number) => {
    setCart(prev => {
      const existing = prev.find(item => item.product._id === product._id);
      let newCart;
      if (existing) {
        newCart = prev.map(item => 
          item.product._id === product._id ? { ...item, quantity: item.quantity + quantity } : item
        );
      } else {
        newCart = [...prev, { product, quantity }];
      }
      localStorage.setItem('cart', JSON.stringify(newCart));
      return newCart;
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => {
      const newCart = prev.filter(item => item.product._id !== productId);
      localStorage.setItem('cart', JSON.stringify(newCart));
      return newCart;
    });
  };

  const clearCart = () => {
    setCart([]);
    localStorage.removeItem('cart');
  };

  return (
    <AppContext.Provider value={{ theme, setTheme, language, setLanguage, timezone, setTimezone, t, cart, addToCart, removeFromCart, clearCart }}>
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
