// context/MessengerContext.jsx
import React, { createContext, useContext, useState, useCallback } from 'react';

const MessengerContext = createContext();

export const MessengerProvider = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  const openMessenger = useCallback(() => {
    setIsOpen(true);
    setIsMinimized(false);
  }, []);

  const closeMessenger = useCallback(() => {
    setIsOpen(false);
  }, []);

  const minimizeMessenger = useCallback(() => {
    setIsMinimized(true);
  }, []);

  const maximizeMessenger = useCallback(() => {
    setIsMinimized(false);
  }, []);

  const toggleMessenger = useCallback(() => {
    if (isOpen && !isMinimized) {
      setIsMinimized(true);
    } else if (isOpen && isMinimized) {
      setIsMinimized(false);
    } else {
      setIsOpen(true);
      setIsMinimized(false);
    }
  }, [isOpen, isMinimized]);

  return (
    <MessengerContext.Provider value={{
      isOpen,
      isMinimized,
      openMessenger,
      closeMessenger,
      minimizeMessenger,
      maximizeMessenger,
      toggleMessenger,
    }}>
      {children}
    </MessengerContext.Provider>
  );
};

export const useMessenger = () => {
  const context = useContext(MessengerContext);
  if (!context) {
    throw new Error('useMessenger must be used within MessengerProvider');
  }
  return context;
};