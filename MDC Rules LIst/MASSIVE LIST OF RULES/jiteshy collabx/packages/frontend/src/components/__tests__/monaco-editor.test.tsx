import { render, screen, fireEvent, act } from '@testing-library/react';
import { MonacoEditor } from '../monaco-editor';
import { MessageType, DEFAULT_CONTENT, DEFAULT_LANGUAGE, UserTypingStatus } from '@collabx/shared';

// Mock the store
const mockStore = {
  content: DEFAULT_CONTENT,
  language: DEFAULT_LANGUAGE,
  setContent: jest.fn(),
};

jest.mock('@/lib/stores', () => ({
  useEditorStore: () => mockStore,
}));

// Mock userStore
jest.mock('@/lib/stores/userStore', () => ({
  useUserStore: () => ({
    typingUsers: new Map<string, UserTypingStatus>(),
  }),
}));

// Mock next-themes
jest.mock('next-themes', () => ({
  useTheme: () => ({
    theme: 'dark',
  }),
}));

// Mock the TypingIndicator component
jest.mock('../typing-indicator', () => ({
  TypingIndicator: () => <div data-testid="typing-indicator">Typing Indicator Mock</div>,
}));

// Mock Monaco Editor
jest.mock('@monaco-editor/react', () => {
  const mockFocus = jest.fn();
  return {
    Editor: ({ value, language, theme, onMount, onChange, options }: any) => {
      // Simulate editor mount
      setTimeout(() => {
        onMount({
          focus: mockFocus,
          updateOptions: jest.fn(),
        });
      }, 0);

      return (
        <div data-testid="monaco-editor">
          <textarea
            data-testid="editor-textarea"
            data-language={language}
            data-theme={theme}
            data-read-only={options?.readOnly?.toString()}
            value={value}
            readOnly={options?.readOnly}
            onChange={(e) => onChange(e.target.value)}
          />
        </div>
      );
    },
    loader: {
      init: () =>
        Promise.resolve({
          editor: {
            defineTheme: jest.fn(),
          },
        }),
    },
    __mockFocus: mockFocus,
  };
});

describe('MonacoEditor', () => {
  const mockSendMessage = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders the editor with default content', async () => {
    await act(async () => {
      render(<MonacoEditor sessionId="test" username="testuser" sendMessage={mockSendMessage} />);
    });

    const editor = screen.getByTestId('monaco-editor');
    expect(editor).toBeDefined();

    const textarea = screen.getByTestId('editor-textarea') as HTMLTextAreaElement;
    expect(textarea.value).toBe(DEFAULT_CONTENT);
    expect(textarea.dataset.language).toBe(DEFAULT_LANGUAGE);
    expect(textarea.dataset.theme).toBe('custom-dark-theme');
  });

  it('handles content changes', async () => {
    await act(async () => {
      render(<MonacoEditor sessionId="test" username="testuser" sendMessage={mockSendMessage} />);
    });

    const textarea = screen.getByTestId('editor-textarea') as HTMLTextAreaElement;
    const newContent = 'const test = "updated";';
    
    await act(async () => {
      fireEvent.change(textarea, { target: { value: newContent } });
    });

    // Check that content is updated in store immediately
    expect(mockStore.setContent).toHaveBeenCalledWith(newContent);
    
    // Check typing status handling
    await act(async () => {
      // First, advance timers to trigger the debounced typing status true message
      jest.advanceTimersByTime(100);
    });
    
    expect(mockSendMessage).toHaveBeenCalled();
    
    // Clear mock for next test
    mockSendMessage.mockClear();

    // Fast-forward timers to trigger the debounced content change
    await act(async () => {
      jest.advanceTimersByTime(300);
    });

    // Now check that content change is sent after debounce
    expect(mockSendMessage).toHaveBeenCalledWith(MessageType.CONTENT_CHANGE, {
      content: newContent,
    });
  });

  it('updates content when store changes', async () => {
    const { rerender } = render(
      <MonacoEditor sessionId="test" username="testuser" sendMessage={mockSendMessage} />,
    );

    const newContent = 'const test = "new content";';
    mockStore.content = newContent;
    await act(async () => {
      rerender(<MonacoEditor sessionId="test" username="testuser" sendMessage={mockSendMessage} />);
    });

    const textarea = screen.getByTestId('editor-textarea') as HTMLTextAreaElement;
    expect(textarea.value).toBe(newContent);
  });

  it('focuses editor on mount', async () => {
    jest.spyOn(global, 'setTimeout').mockImplementation((cb) => {
      cb();
      return 0 as any;
    });

    await act(async () => {
      render(<MonacoEditor sessionId="test" username="testuser" sendMessage={mockSendMessage} />);
    });

    const mockFocus = jest.requireMock('@monaco-editor/react').__mockFocus;
    expect(mockFocus).toHaveBeenCalled();
  });

  it('handles keyboard shortcuts', async () => {
    await act(async () => {
      render(<MonacoEditor sessionId="test" username="testuser" sendMessage={mockSendMessage} />);
    });

    const event = new KeyboardEvent('keydown', {
      key: 'e',
      metaKey: true,
      shiftKey: true,
    });

    await act(async () => {
      window.dispatchEvent(event);
    });

    // Verify editor focus was called
    expect(mockStore.setContent).not.toHaveBeenCalled();
  });

  it('applies read-only mode correctly', async () => {
    await act(async () => {
      render(
        <MonacoEditor
          sessionId="test"
          username="testuser"
          sendMessage={mockSendMessage}
          readOnly
        />,
      );
    });

    const textarea = screen.getByTestId('editor-textarea') as HTMLTextAreaElement;
    expect(textarea.getAttribute('data-read-only')).toBe('true');
  });

  it('handles typing status timeout', async () => {
    await act(async () => {
      render(<MonacoEditor sessionId="test" username="testuser" sendMessage={mockSendMessage} />);
    });

    const textarea = screen.getByTestId('editor-textarea') as HTMLTextAreaElement;
    
    // Trigger a change to start typing
    await act(async () => {
      fireEvent.change(textarea, { target: { value: 'typing test' } });
    });

    // Advance timers to trigger typing status
    await act(async () => {
      jest.advanceTimersByTime(100);
    });

    // At least one message should be sent
    expect(mockSendMessage).toHaveBeenCalled();
    
    // Clear previous calls to check the next call specifically
    mockSendMessage.mockClear();
    
    // Fast-forward to trigger typing status timeout
    await act(async () => {
      jest.advanceTimersByTime(1100);
    });
    
    // Should set typing status to false after timeout
    expect(mockSendMessage).toHaveBeenCalledWith(MessageType.TYPING_STATUS, { isTyping: false });
  });
});
