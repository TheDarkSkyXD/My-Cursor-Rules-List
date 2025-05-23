'use client';

import { useEffect, useRef, Suspense, useMemo, useCallback } from 'react';
import dynamic from 'next/dynamic';
import type { editor as MonacoEditorType } from 'monaco-editor';
import type { EditorProps } from '@monaco-editor/react';
import { useEditorStore } from '@/lib/stores';
import { useUserStore } from '@/lib/stores/userStore';
import { DEFAULT_CONTENT, DEFAULT_LANGUAGE, MessageType } from '@collabx/shared';
import { useTheme } from 'next-themes';
import { EditorShimmer } from './editor-shimmer';
import { TypingIndicator } from './typing-indicator';
import { createDebouncedHandler } from '@/lib/utils/debounce';

// Dynamically import Monaco editor
const Editor = dynamic(() => import('@monaco-editor/react').then((mod) => mod.Editor), {
  ssr: false,
});

// Memoize theme definitions
const lightTheme: MonacoEditorType.IStandaloneThemeData = {
  base: 'vs' as const,
  inherit: true,
  rules: [] as MonacoEditorType.ITokenThemeRule[],
  colors: {
    'editor.background': '#ffffff',
    'editorGutter.background': '#f4f4f5',
    'editorLineNumber.foreground': '#9f9fa9',
    'editorLineNumber.activeForeground': '#52525c',
  },
};

const darkTheme: MonacoEditorType.IStandaloneThemeData = {
  base: 'vs-dark' as const,
  inherit: true,
  rules: [] as MonacoEditorType.ITokenThemeRule[],
  colors: {
    'editor.background': '#18181b',
    'editorGutter.background': '#27272a',
    'editorLineNumber.foreground': '#52525c',
    'editorLineNumber.activeForeground': '#9f9fa9',
  },
};

interface MonacoEditorProps {
  sessionId: string;
  username: string;
  sendMessage: (type: MessageType, payload: { content?: string; isTyping?: boolean }) => void;
  readOnly?: boolean;
}

export function MonacoEditor({ sendMessage, readOnly = false, username }: MonacoEditorProps) {
  const { content, language, setContent } = useEditorStore();
  const typingUsers = useUserStore((state) => state.typingUsers);
  const { theme } = useTheme();
  const editorRef = useRef<MonacoEditorType.IStandaloneCodeEditor | null>(null);
  const isTypingRef = useRef<boolean>(false);

  // Create debounced handlers for different events
  const contentChangeHandler = useMemo(
    () => createDebouncedHandler<string>(
      (value) => {
        sendMessage(MessageType.CONTENT_CHANGE, { content: value });
      },
      300 // 300ms debounce for content changes
    ),
    [sendMessage]
  );

  const typingStartHandler = useMemo(
    () => createDebouncedHandler<void>(
      () => {
        isTypingRef.current = true;
        sendMessage(MessageType.TYPING_STATUS, { isTyping: true });
      },
      100 // 100ms debounce for typing status start
    ),
    [sendMessage]
  );

  const typingEndHandler = useMemo(
    () => createDebouncedHandler<void>(
      () => {
        if (isTypingRef.current) {
          isTypingRef.current = false;
          sendMessage(MessageType.TYPING_STATUS, { isTyping: false });
        }
      },
      1000 // 1000ms delay for typing status end
    ),
    [sendMessage]
  );

  useEffect(() => {
    import('@monaco-editor/react').then(({ loader }) => {
      loader.init().then((monaco) => {
        monaco.editor.defineTheme('custom-theme', lightTheme);
        monaco.editor.defineTheme('custom-dark-theme', darkTheme);
      });
    });
  }, []);

  const focusEditor = useCallback(() => {
    if (editorRef.current) {
      editorRef.current.focus();
    }
  }, []);

  useEffect(() => {
    focusEditor();
  }, [focusEditor]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Jump to Editor: Cmd/Ctrl + Shift + E
      if ((event.metaKey || event.ctrlKey) && event.shiftKey && event.key === 'e') {
        event.preventDefault();
        focusEditor();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [focusEditor]);

  const handleEditorDidMount = useCallback((editor: MonacoEditorType.IStandaloneCodeEditor) => {
    editorRef.current = editor;
  }, []);

  const handleEditorChange = useCallback(
    (value: string | undefined) => {
      if (!value) return;

      // Update content in store immediately for responsive UI
      setContent(value);

      // Debounce content change events
      contentChangeHandler.trigger(value);

      // Debounce typing status (isTyping: true)
      // Only send isTyping: true if not already typing
      if (!isTypingRef.current) {
        typingStartHandler.trigger();
      }

      // Reset the typing end timer on every keystroke
      typingEndHandler.cancel();
      typingEndHandler.trigger();
    },
    [setContent, contentChangeHandler, typingStartHandler, typingEndHandler]
  );

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      contentChangeHandler.cancel();
      typingStartHandler.cancel();
      typingEndHandler.cancel();
    };
  }, [contentChangeHandler, typingStartHandler, typingEndHandler]);

  const editorOptions = useMemo(
    (): MonacoEditorType.IStandaloneEditorConstructionOptions => ({
      readOnly,
      minimap: { enabled: false },
      fontSize: 14,
      lineNumbers: 'on' as const,
      scrollBeyondLastLine: false,
      automaticLayout: true,
      wordWrap: 'on',
      renderWhitespace: 'selection',
      cursorStyle: 'line',
      cursorBlinking: 'blink',
      cursorSmoothCaretAnimation: 'on',
      smoothScrolling: true,
      padding: { top: 8, bottom: 48 },
      selectOnLineNumbers: true,
      lineNumbersMinChars: 4,
      lineDecorationsWidth: 0,
      scrollbar: {
        vertical: 'visible',
        horizontal: 'visible',
        useShadows: false,
        verticalScrollbarSize: 10,
        horizontalScrollbarSize: 10,
        arrowSize: 30,
      },
      folding: true,
      foldingStrategy: 'auto',
      renderLineHighlight: 'none',
      hideCursorInOverviewRuler: true,
      overviewRulerBorder: false,
      overviewRulerLanes: 0,
      largeFileOptimizations: true,
      bracketPairColorization: {
        enabled: false,
      },
      renderValidationDecorations: 'on',
      renderFinalNewline: 'off',
      renderLineHighlightOnlyWhenFocus: true,
      fastScrollSensitivity: 5,
      mouseWheelScrollSensitivity: 1,
      maxTokenizationLineLength: 20000,
    }),
    [readOnly],
  );

  const editorProps = useMemo<EditorProps>(
    () => ({
      height: '100%',
      defaultLanguage: DEFAULT_LANGUAGE,
      defaultValue: DEFAULT_CONTENT,
      value: content,
      language: language,
      theme: theme === 'dark' ? 'custom-dark-theme' : 'custom-theme',
      onMount: handleEditorDidMount,
      onChange: handleEditorChange,
      options: editorOptions,
    }),
    [content, language, theme, handleEditorDidMount, handleEditorChange, editorOptions],
  );

  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.updateOptions({
        readOnly,
        minimap: { enabled: false },
        fontSize: 14,
        lineNumbers: 'on' as const,
        roundedSelection: false,
        scrollBeyondLastLine: false,
        automaticLayout: true,
        theme: 'vs-dark',
        wordWrap: 'on',
        renderWhitespace: 'selection',
        scrollbar: {
          vertical: 'visible',
          horizontal: 'visible',
        },
      });
    }
  }, [editorRef, readOnly]);

  return (
    <div className="h-full w-full relative">
      <Suspense fallback={<EditorShimmer />}>
        <Editor {...editorProps} />
      </Suspense>
      <TypingIndicator typingUsers={typingUsers} currentUsername={username} />
    </div>
  );
}
