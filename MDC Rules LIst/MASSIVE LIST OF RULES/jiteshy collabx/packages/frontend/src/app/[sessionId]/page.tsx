'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { MonacoEditor } from '@/components/monaco-editor';
import { useEditorStore, useUserStore } from '@/lib/stores';
import { getRandomUsername, MessageType, ValidationService } from '@collabx/shared';
import { toast } from 'sonner';
import { SessionCard } from '@/components/session-card';
import { Header } from '@/components/nav';
import { HeroSection } from '@/components/hero-section';
import { EditorHeader } from '@/components/editor-header';
import { Footer } from '@/components/Footer';
import { useWebSocket } from '@/hooks/useWebSocket';
import { SessionFullDialog } from '@/components/session-full-dialog';
import { InvalidSessionDialog } from '@/components/invalid-session-dialog';
import { useTheme } from 'next-themes';

export default function SessionPage() {
  const params = useParams();
  const sessionId = params.sessionId as string;
  const [username, setUsername] = useState<string | null>(null);
  const { language, setLanguage } = useEditorStore();
  const [readOnly, setReadOnly] = useState(false);
  const users = useUserStore((state) => state.users);
  const [isInvalidSession, setIsInvalidSession] = useState(false);
  const { sendMessage, isSessionFull, setIsSessionFull } = useWebSocket(sessionId, username || '');
  const { setTheme, theme } = useTheme();
  const typingUsers = useUserStore((state) => state.typingUsers);

  useEffect(() => {
    const randomUsername = getRandomUsername();
    setUsername(randomUsername);

    // Validate session ID before establishing connection
    const validationError = ValidationService.validateSessionId(sessionId);
    if (validationError) {
      setIsInvalidSession(true);
    }
  }, [sessionId]);

  const copySessionLink = useCallback(() => {
    const url = `${window.location.origin}/${sessionId}`;
    navigator.clipboard
      .writeText(url)
      .then(() => {
        toast.success('Session link copied to clipboard');
      })
      .catch(() => {
        toast.error('Failed to copy session link');
      });
  }, [sessionId]);

  const shareSessionLink = useCallback(() => {
    const url = `${window.location.origin}/${sessionId}`;
    
    if (navigator.share) {
      navigator.share({
        title: 'CollabX Session',
        text: 'Join my collaborative editing session on CollabX',
        url: url
      }).catch((error) => {
        console.error('Error sharing:', error);
      });
    } else {
      toast.error('Web Share API not supported in your browser');
    }
  }, [sessionId]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Copy Session Link: Cmd/Ctrl + Shift + C
      if ((event.metaKey || event.ctrlKey) && event.shiftKey && event.key === 'c') {
        event.preventDefault();
        copySessionLink();
      }

      // Share Session Link: Cmd/Ctrl + Shift + S
      if ((event.metaKey || event.ctrlKey) && event.shiftKey && event.key === 's') {
        event.preventDefault();
        shareSessionLink();
      }

      // Toggle Dark Mode: Cmd/Ctrl + Shift + L
      if ((event.metaKey || event.ctrlKey) && event.shiftKey && event.key === 'l') {
        event.preventDefault();
        setTheme(theme === 'dark' ? 'light' : 'dark');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [copySessionLink, shareSessionLink, setTheme, theme]);

  if (!username) {
    return null;
  }

  const handleViewReadOnly = () => {
    setIsSessionFull(false);
    setReadOnly(true);
  };

  return (
    <div className="flex flex-col h-screen">
      <div className="flex flex-col lg:flex-row">
        {/* Left Column */}
        <div className="w-full lg:w-1/3 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-700 flex flex-col lg:h-screen overflow-hidden">
          <div className="w-full md:w-4/5 m-auto lg:w-full">
            <Header />
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto scrollbar-hide">
            <div className="p-4 lg:pt-0 w-full md:w-4/5 m-auto lg:w-full">
              <div className="flex md:grid flex-col md:grid-cols-2 lg:flex lg:flex-col gap-4 lg:h-[calc(100vh-140px)]">
                <HeroSection />

                <SessionCard
                  sessionId={sessionId}
                  username={username}
                  users={users}
                  copySessionLink={copySessionLink}
                  shareSessionLink={shareSessionLink}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="relative lg:w-2/3 lg:pt-4 lg:pb-10 lg:pr-4 pb-4 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-700 lg:from-slate-700 lg:via-slate-700 lg:to-slate-700 flex min-h-[500px] lg:min-h-screen">
          {/* Editor Section */}
          <div className="flex-1 px-4 lg:px-0">
            <div className="bg-zinc-100 w-full md:w-4/5 m-auto lg:w-full border rounded-lg shadow-2xl overflow-hidden h-full flex flex-col dark:bg-zinc-800">
              <EditorHeader
                language={language}
                setLanguage={(newLanguage) => {
                  setLanguage(newLanguage);
                  sendMessage(MessageType.LANGUAGE_CHANGE, { language: newLanguage });
                }}
                users={users}
                username={username}
                readOnly={readOnly}
                typingUsers={typingUsers}
              />

              <div className="flex-1">
                <MonacoEditor
                  sessionId={sessionId}
                  username={username}
                  sendMessage={sendMessage}
                  readOnly={readOnly}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
      <SessionFullDialog isOpen={isSessionFull} onViewReadOnly={handleViewReadOnly} />
      <InvalidSessionDialog isOpen={isInvalidSession} onOpenChange={setIsInvalidSession} />
    </div>
  );
}
