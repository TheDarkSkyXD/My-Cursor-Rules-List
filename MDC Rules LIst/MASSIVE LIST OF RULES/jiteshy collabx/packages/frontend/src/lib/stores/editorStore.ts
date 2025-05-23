import { create } from 'zustand';
import { DEFAULT_CONTENT, DEFAULT_LANGUAGE } from '@collabx/shared';

interface EditorState {
  content: string;
  language: string;
  error: string | null;
  setContent: (content: string) => void;
  setLanguage: (language: string) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

export const useEditorStore = create<EditorState>((set) => ({
  content: DEFAULT_CONTENT,
  language: DEFAULT_LANGUAGE,
  error: null,

  setContent: (content) => set({ content }),
  setLanguage: (language) => set({ language }),
  setError: (error) => set({ error }),

  reset: () =>
    set({
      content: DEFAULT_CONTENT,
      language: DEFAULT_LANGUAGE,
      error: null,
    }),
}));
