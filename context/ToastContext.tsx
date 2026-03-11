import React, { createContext, useContext, useState, ReactNode } from 'react';
import Toast from '../components/Toast';

interface ToastContextType {
  showError: (message: string) => void;
  showInfo: (message: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState('');
  const [type, setType] = useState<'error' | 'info'>('info');

  const showError = (msg: string) => {
    setMessage(msg);
    setType('error');
    setVisible(true);
  };

  const showInfo = (msg: string) => {
    setMessage(msg);
    setType('info');
    setVisible(true);
  };

  const hide = () => {
    setVisible(false);
  };

  return (
    <ToastContext.Provider value={{ showError, showInfo }}>
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
