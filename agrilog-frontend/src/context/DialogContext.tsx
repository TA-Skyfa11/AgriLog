'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import styles from '@/css/dialog.module.css';

interface DialogOptions {
  message: string;
  type: 'confirm' | 'prompt';
  defaultValue?: string;
}

interface DialogContextType {
  confirm: (message: string) => Promise<boolean>;
  prompt: (message: string, defaultValue?: string) => Promise<string | null>;
}

const DialogContext = createContext<DialogContextType | undefined>(undefined);

export function DialogProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<DialogOptions | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [resolvePromise, setResolvePromise] = useState<((value: any) => void) | null>(null);

  const confirm = (message: string): Promise<boolean> => {
    return new Promise((resolve) => {
      setOptions({ message, type: 'confirm' });
      setResolvePromise(() => resolve);
      setIsOpen(true);
    });
  };

  const prompt = (message: string, defaultValue?: string): Promise<string | null> => {
    return new Promise((resolve) => {
      setOptions({ message, type: 'prompt', defaultValue });
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
        <div className={styles.overlay}>
          <div className={styles.modal}>
            <h3 className={styles.title}>Thông báo</h3>
            <p className={styles.message}>{options.message}</p>
            
            {options.type === 'prompt' && (
              <input
                type="text"
                autoFocus
                className={styles.input}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleConfirm();
                  if (e.key === 'Escape') handleCancel();
                }}
              />
            )}
            
            <div className={styles.actions}>
              <button className={styles.btnCancel} onClick={handleCancel}>
                Hủy
              </button>
              <button className={styles.btnConfirm} onClick={handleConfirm}>
                OK
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
