// src/hooks/useModalDialog.js
import { useState, useCallback } from 'react';
import ModalDialog from '../components/UI/Modal/ModalDialog';

const useModalDialog = () => {
  const [dialogState, setDialogState] = useState({
    isOpen: false,
    type: 'confirm',
    title: '',
    message: '',
    confirmText: 'Подтвердить',
    cancelText: 'Отмена',
    inputPlaceholder: '',
    inputValue: '',
    onConfirm: null,
    isDestructive: false
  });

  const showConfirm = useCallback((title, message, onConfirm, confirmText = 'Подтвердить', isDestructive = false) => {
    setDialogState({
      isOpen: true,
      type: 'confirm',
      title,
      message,
      confirmText,
      cancelText: 'Отмена',
      onConfirm,
      isDestructive,
      inputPlaceholder: '',
      inputValue: ''
    });
  }, []);

  const showPrompt = useCallback((title, message, onConfirm, inputPlaceholder = '', defaultValue = '', confirmText = 'Подтвердить') => {
    setDialogState({
      isOpen: true,
      type: 'prompt',
      title,
      message,
      confirmText,
      cancelText: 'Отмена',
      onConfirm,
      inputPlaceholder,
      inputValue: defaultValue,
      isDestructive: false
    });
  }, []);

  const showInfo = useCallback((title, message, onConfirm) => {
    setDialogState({
      isOpen: true,
      type: 'info',
      title,
      message,
      confirmText: 'OK',
      cancelText: '',
      onConfirm,
      isDestructive: false,
      inputPlaceholder: '',
      inputValue: ''
    });
  }, []);

  const showError = useCallback((title, message, onConfirm) => {
    setDialogState({
      isOpen: true,
      type: 'error',
      title,
      message,
      confirmText: 'OK',
      cancelText: '',
      onConfirm,
      isDestructive: false,
      inputPlaceholder: '',
      inputValue: ''
    });
  }, []);

  const closeDialog = useCallback(() => {
    setDialogState(prev => ({ ...prev, isOpen: false }));
  }, []);

  const handleConfirm = useCallback((inputValue) => {
    if (dialogState.onConfirm) {
      if (dialogState.type === 'prompt') {
        dialogState.onConfirm(inputValue);
      } else {
        dialogState.onConfirm();
      }
    }
    closeDialog();
  }, [dialogState, closeDialog]);

  const ModalDialogComponent = () => (
    <ModalDialog
      isOpen={dialogState.isOpen}
      onClose={closeDialog}
      onConfirm={handleConfirm}
      title={dialogState.title}
      message={dialogState.message}
      type={dialogState.type}
      confirmText={dialogState.confirmText}
      cancelText={dialogState.cancelText}
      inputPlaceholder={dialogState.inputPlaceholder}
      inputValue={dialogState.inputValue}
      isDestructive={dialogState.isDestructive}
    />
  );

  return {
    showConfirm,
    showPrompt,
    showInfo,
    showError,
    closeDialog,
    ModalDialog: ModalDialogComponent
  };
};

export default useModalDialog;