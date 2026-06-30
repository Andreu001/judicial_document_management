// communication-frontend/src/components/Messenger/MessengerApp.jsx
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { MessengerProvider, useMessenger } from './context/MessengerContext';
import Sidebar from './Sidebar/Sidebar';
import ChatView from './Chat/ChatView';
import RightPanel from './RightPanel/RightPanel';
import NewChatModal from './Modals/NewChatModal';
import BroadcastModal from './Modals/BroadcastModal';
import TaskModal from './Modals/TaskModal';
import DocumentExchangeModal from './Modals/DocumentExchangeModal';
import GlobalSearchModal from './Modals/GlobalSearchModal';
import styles from './MessengerApp.module.css';

// SVG иконки
const IconMinimize = () => (
  <svg width="12" height="2" viewBox="0 0 12 2" fill="none">
    <rect width="12" height="2" rx="1" fill="currentColor"/>
  </svg>
);

const IconMaximize = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
    <rect x="0.5" y="0.5" width="11" height="11" rx="1" stroke="currentColor"/>
  </svg>
);

const IconClose = () => (
  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
    <path d="M1 1L9 9M9 1L1 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

const IconRestore = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
    <rect x="3.5" y="0.5" width="8" height="8" rx="1" stroke="currentColor"/>
    <rect x="0.5" y="3.5" width="8" height="8" rx="1" stroke="currentColor"/>
  </svg>
);

const MessengerInner = ({ onClose }) => {
  const { activeChat, rightPanel } = useMessenger();

  const [isMaximized, setIsMaximized] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [position, setPosition] = useState({ x: -1, y: -1 });
  const [size, setSize] = useState({ w: 960, h: 640 });
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [resizing, setResizing] = useState(false);
  const [resizeDir, setResizeDir] = useState('');
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, w: 0, h: 0 });
  const [modal, setModal] = useState(null);
  const [contextMenu, setContextMenu] = useState(null);

  const windowRef = useRef(null);

  useEffect(() => {
    if (position.x === -1) {
      setPosition({
        x: Math.max(0, (window.innerWidth - 960) / 2),
        y: Math.max(0, (window.innerHeight - 640) / 2),
      });
    }
  }, [position.x]);

  const onTitleMouseDown = useCallback((e) => {
    if (isMaximized) return;
    e.preventDefault();
    setDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  }, [position, isMaximized]);

  useEffect(() => {
    if (!dragging) return;
    const onMove = (e) => {
      setPosition({
        x: Math.max(0, Math.min(window.innerWidth - 200, e.clientX - dragStart.x)),
        y: Math.max(0, Math.min(window.innerHeight - 40, e.clientY - dragStart.y)),
      });
    };
    const onUp = () => setDragging(false);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [dragging, dragStart]);

  const onResizeStart = useCallback((e, dir) => {
    e.preventDefault();
    e.stopPropagation();
    setResizing(true);
    setResizeDir(dir);
    setResizeStart({ x: e.clientX, y: e.clientY, w: size.w, h: size.h });
  }, [size]);

  useEffect(() => {
    if (!resizing) return;
    const onMove = (e) => {
      const dx = e.clientX - resizeStart.x;
      const dy = e.clientY - resizeStart.y;
      let newW = resizeStart.w;
      let newH = resizeStart.h;
      if (resizeDir.includes('e')) newW = Math.max(380, resizeStart.w + dx);
      if (resizeDir.includes('s')) newH = Math.max(400, resizeStart.h + dy);
      setSize({ w: newW, h: newH });
    };
    const onUp = () => setResizing(false);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [resizing, resizeStart, resizeDir]);

  const toggleMaximize = () => setIsMaximized(!isMaximized);
  const toggleMinimize = () => setIsMinimized(!isMinimized);

  if (isMinimized) {
    return (
      <div
        className={styles.window}
        style={{
          width: 280, height: 40, bottom: 0, right: 20, top: 'auto', left: 'auto',
          borderRadius: '8px 8px 0 0',
        }}
      >
        <div className={styles.titleBar} onMouseDown={onTitleMouseDown}>
          <div className={styles.titleBarLeft}>Коммуникационная платформа</div>
          <div className={styles.titleBarRight}>
            <button className={styles.titleBtn} onClick={toggleMinimize}><IconMaximize /></button>
            <button className={`${styles.titleBtn} ${styles.close}`} onClick={onClose}><IconClose /></button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className={styles.overlay} />
      <div
        ref={windowRef}
        className={`${styles.window} ${isMaximized ? styles.maximized : ''}`}
        style={isMaximized ? {} : {
          left: position.x, top: position.y,
          width: size.w, height: size.h,
        }}
      >
        <div className={styles.titleBar} onMouseDown={onTitleMouseDown} onDoubleClick={toggleMaximize}>
          <div className={styles.titleBarLeft}>
            Коммуникационная платформа
            {activeChat && <span>— {activeChat.title || 'Чат'}</span>}
          </div>
          <div className={styles.titleBarRight}>
            <button className={styles.titleBtn} onClick={toggleMinimize}><IconMinimize /></button>
            <button className={styles.titleBtn} onClick={toggleMaximize}>
              {isMaximized ? <IconRestore /> : <IconMaximize />}
            </button>
            <button className={`${styles.titleBtn} ${styles.close}`} onClick={onClose}><IconClose /></button>
          </div>
        </div>

        <div className={styles.body}>
          <Sidebar
            onNewChat={() => setModal('newChat')}
            onBroadcast={() => setModal('broadcast')}
            onSearch={() => setModal('search')}
          />
          <ChatView
            onNewTask={() => setModal('task')}
            onDocumentExchange={() => setModal('exchange')}
          />
          {rightPanel && <RightPanel />}
        </div>

        {!isMaximized && (
          <>
            <div style={{
              position: 'absolute', right: 0, bottom: 0, width: 14, height: 14,
              cursor: 'se-resize',
            }} onMouseDown={(e) => onResizeStart(e, 'se')} />
            <div style={{
              position: 'absolute', right: 0, top: 0, bottom: 14, width: 4,
              cursor: 'e-resize',
            }} onMouseDown={(e) => onResizeStart(e, 'e')} />
            <div style={{
              position: 'absolute', left: 0, right: 14, bottom: 0, height: 4,
              cursor: 's-resize',
            }} onMouseDown={(e) => onResizeStart(e, 's')} />
          </>
        )}
      </div>

      {modal === 'newChat' && <NewChatModal onClose={() => setModal(null)} />}
      {modal === 'broadcast' && <BroadcastModal onClose={() => setModal(null)} />}
      {modal === 'task' && <TaskModal onClose={() => setModal(null)} />}
      {modal === 'exchange' && <DocumentExchangeModal onClose={() => setModal(null)} />}
      {modal === 'search' && <GlobalSearchModal onClose={() => setModal(null)} />}

      {contextMenu && (
        <div
          className={styles.contextMenu}
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onClick={() => setContextMenu(null)}
        >
          {contextMenu.items.map((item, i) => (
            <div
              key={i}
              className={`${styles.contextMenuItem} ${item.danger ? styles.danger : ''}`}
              onClick={() => { item.action(); setContextMenu(null); }}
            >
              {item.label}
            </div>
          ))}
        </div>
      )}
    </>
  );
};

const MessengerApp = ({ onClose }) => (
  <MessengerProvider>
    <MessengerInner onClose={onClose} />
  </MessengerProvider>
);

export default MessengerApp;