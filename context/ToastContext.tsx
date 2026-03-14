import React, { createContext, useContext, useState, ReactNode } from 'react';
import Toast from '../components/Toast';

interface ToastContextType {
  showError: (message: string) => void;
  showInfo: (message: string) => void;
  showSuccess: (message: string) => void;
  showToast: (message: string, type?: 'error' | 'info' | 'success') => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState('');
  const [type, setType] = useState<'error' | 'info' | 'success'>('info');

  const showToast = (msg: string, t: 'error' | 'info' | 'success' = 'info') => {
    setMessage(msg);
    setType(t);
    setVisible(true);
  };

  const showError = (msg: string) => showToast(msg, 'error');
  const showInfo = (msg: string) => showToast(msg, 'info');
  const showSuccess = (msg: string) => showToast(msg, 'success');

  const hide = () => {
    setVisible(false);
  };

  return (
    <ToastContext.Provider value={{ showError, showInfo, showSuccess, showToast }}>
      {children}
      <Toast visible={visible} message={message} type={type} onHide={hide} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
