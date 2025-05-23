import { useEffect, useRef, useCallback, useState } from 'react';
import { SocketService } from '@/lib/services/socket';
import { useEditorStore } from '@/lib/stores/editorStore';
import { useUserStore } from '@/lib/stores/userStore';
import { MessageType, UserCursor, UserSelection, UserTypingStatus, ValidationService } from '@collabx/shared';
import { SocketPayloads } from '@/lib/services/socket/types';

export const useWebSocket = (sessionId: string, username: string) => {
  const socketServiceRef = useRef<SocketService | null>(null);
  const [isSessionFull, setIsSessionFull] = useState(false);
  const { setContent, setLanguage, setError, reset: resetEditor } = useEditorStore();
  const { 
    addUser, 
    removeUser, 
    updateCursor, 
    updateSelection, 
    updateTypingStatus,
    removeTypingStatus,
    reset: resetUser 
  } = useUserStore();

  const handleError = useCallback(
    (message: string) => {
      setError(message);
    },
    [setError],
  );

  // Create store handlers once
  const storeHandlers = useCallback(
    () => ({
      setContent,
      setLanguage,
      setError,
      resetEditor,
      addUser,
      removeUser,
      updateCursor: (sharedCursor: UserCursor) => {
        const cursor: UserCursor = {
          position: sharedCursor.position,
          user: sharedCursor.user,
        };
        updateCursor(cursor);
      },
      updateSelection: (sharedSelection: UserSelection) => {
        const selection: UserSelection = {
          selection: sharedSelection.selection,
          user: sharedSelection.user,
        };
        updateSelection(selection);
      },
      updateTypingStatus: (userId: string, status: UserTypingStatus) => {
        updateTypingStatus(userId, status);
      },
      removeTypingStatus: (userId: string) => {
        removeTypingStatus(userId);
      },
      resetUser,
      onSessionFull: () => setIsSessionFull(true),
    }),
    [
      setContent,
      setLanguage,
      setError,
      resetEditor,
      addUser,
      removeUser,
      updateCursor,
      updateSelection,
      updateTypingStatus,
      removeTypingStatus,
      resetUser,
    ],
  );

  useEffect(() => {
    if (!sessionId) {
      console.warn('Missing sessionId for socket connection');
      return;
    }

    // Validate session ID before establishing connection
    const validationError = ValidationService.validateSessionId(sessionId);
    if (validationError) {
      console.warn('Invalid session ID:', validationError);
      return;
    }

    // Clean up existing socket service if it exists
    if (socketServiceRef.current) {
      socketServiceRef.current.disconnect();
      socketServiceRef.current = null;
    }

    // Create new socket service
    socketServiceRef.current = new SocketService(sessionId, username, handleError, storeHandlers());

    // Connect socket
    socketServiceRef.current.connect();

    // Cleanup function
    return () => {
      if (socketServiceRef.current) {
        socketServiceRef.current.disconnect();
        socketServiceRef.current = null;
      }
    };
  }, [sessionId, username, handleError, storeHandlers]);

  const sendMessage = useCallback((type: MessageType, payload: any) => {
    if (socketServiceRef.current) {
      socketServiceRef.current.sendMessage(type, payload as SocketPayloads[MessageType]);
    }
  }, []);

  return { sendMessage, isSessionFull, setIsSessionFull };
};
