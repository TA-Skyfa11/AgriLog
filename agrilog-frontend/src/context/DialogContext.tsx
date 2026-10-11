'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import styles from '@/css/dialog.module.css';

interface DialogOptions {
  title?: string;
  message: string;
  type: 'confirm' | 'prompt';
  defaultValue?: string;
}

export type DialogTitleOption = string | { title?: string };

interface DialogContextType {
  confirm: (message: string, titleOrOptions?: DialogTitleOption) => Promise<boolean>;
  prompt: (message: string, defaultValue?: string, titleOrOptions?: DialogTitleOption) => Promise<string | null>;
}

const DialogContext = createContext<DialogContextType | undefined>(undefined);

export function DialogProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<DialogOptions | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [resolvePromise, setResolvePromise] = useState<((value: any) => void) | null>(null);

  const extractTitle = (titleOrOptions?: DialogTitleOption): string | undefined => {
    if (typeof titleOrOptions === 'string') return titleOrOptions;
    if (titleOrOptions && typeof titleOrOptions === 'object') return titleOrOptions.title;
    return undefined;
  };

  const confirm = (message: string, titleOrOptions?: DialogTitleOption): Promise<boolean> => {
    return new Promise((resolve) => {
      const title = extractTitle(titleOrOptions);
      setOptions({ message, title, type: 'confirm' });
      setResolvePromise(() => resolve);
      setIsOpen(true);
    });
  };

  const prompt = (message: string, defaultValue?: string, titleOrOptions?: DialogTitleOption): Promise<string | null> => {
    return new Promise((resolve) => {
      const title = extractTitle(titleOrOptions);
      setOptions({ message, title, type: 'prompt', defaultValue });
      setInputValue(defaultValue || '');
      setResolvePromise(() => resolve);
      setIsOpen(true);
    });
  };

  const handleCancel = () => {
    setIsOpen(false);
    if (resolvePromise) {
      resolvePromise(options?.type === 'prompt' ? null : false);
    }
  };

  const handleConfirm = () => {
    setIsOpen(false);
    if (resolvePromise) {
      resolvePromise(options?.type === 'prompt' ? inputValue : true);
    }
  };

  return (
    <DialogContext.Provider value={{ confirm, prompt }}>
      {children}
      {isOpen && options && (
        <div className={styles.overlay} onClick={handleCancel}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h3 className={styles.title}>
              {options.title || (options.type === 'prompt' ? 'Nhập thông tin' : 'Xác nhận')}
            </h3>
            <p className={styles.message}>{options.message}</p>
            
            {options.type === 'prompt' && (
              <input
                type="text"
                autoFocus
                className={styles.input}
                value={inputValue}
                placeholder="Nhập nội dung..."
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleConfirm();
                  if (e.key === 'Escape') handleCancel();
                }}
              />
            )}
            
            <div className={styles.actions}>
              <button type="button" className={styles.btnCancel} onClick={handleCancel}>
                Hủy
              </button>
              <button 
                type="button" 
                className={options.type === 'prompt' ? styles.btnPrimary : styles.btnConfirm} 
                onClick={handleConfirm}
              >
                {options.type === 'prompt' ? 'Xác nhận' : 'Đồng ý'}
              </button>
            </div>
          </div>
        </div>
      )}
    </DialogContext.Provider>
  );
}

export function useDialog() {
  const context = useContext(DialogContext);
  if (context === undefined) {
    throw new Error('useDialog must be used within a DialogProvider');
  }
  return context;
}
