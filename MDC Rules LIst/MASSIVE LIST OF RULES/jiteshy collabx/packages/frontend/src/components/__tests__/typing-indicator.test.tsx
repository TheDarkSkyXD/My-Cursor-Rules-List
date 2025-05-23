import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { TypingIndicator } from '../typing-indicator';
import { UserTypingStatus, User } from '@collabx/shared';

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, className, ...props }: any) => <div className={className} {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => children,
}));

describe('TypingIndicator', () => {
  const mockUser = (username: string): User => ({
    id: `user-${username}`,
    username,
    color: '#000000',
    lastActive: Date.now(),
    sessionId: 'test-session',
  });

  const createTypingStatus = (username: string, isTyping: boolean): UserTypingStatus => ({
    user: mockUser(username),
    isTyping,
    lastTyped: Date.now(),
  });

  it('should not render when no users are typing', () => {
    const typingUsers = new Map<string, UserTypingStatus>();
    render(<TypingIndicator typingUsers={typingUsers} currentUsername="currentUser" />);
    expect(screen.queryByText(/typing/)).toBeNull();
  });

  it('should not render when only current user is typing', () => {
    const typingUsers = new Map<string, UserTypingStatus>();
    typingUsers.set('user-currentUser', createTypingStatus('currentUser', true));
    render(<TypingIndicator typingUsers={typingUsers} currentUsername="currentUser" />);
    expect(screen.queryByText(/typing/)).toBeNull();
  });

  it('should show single user typing message', () => {
    const typingUsers = new Map<string, UserTypingStatus>();
    typingUsers.set('user-otherUser', createTypingStatus('otherUser', true));
    render(<TypingIndicator typingUsers={typingUsers} currentUsername="currentUser" />);
    expect(screen.getByText('otherUser is typing...')).toBeInTheDocument();
  });

  it('should show two users typing message', () => {
    const typingUsers = new Map<string, UserTypingStatus>();
    typingUsers.set('user-user1', createTypingStatus('user1', true));
    typingUsers.set('user-user2', createTypingStatus('user2', true));
    render(<TypingIndicator typingUsers={typingUsers} currentUsername="currentUser" />);
    expect(screen.getByText('user1 and user2 are typing...')).toBeInTheDocument();
  });

  it('should show multiple users typing message', () => {
    const typingUsers = new Map<string, UserTypingStatus>();
    typingUsers.set('user-user1', createTypingStatus('user1', true));
    typingUsers.set('user-user2', createTypingStatus('user2', true));
    typingUsers.set('user-user3', createTypingStatus('user3', true));
    render(<TypingIndicator typingUsers={typingUsers} currentUsername="currentUser" />);
    expect(screen.getByText('3 people are typing...')).toBeInTheDocument();
  });

  it('should handle empty usernames gracefully', () => {
    const typingUsers = new Map<string, UserTypingStatus>();
    typingUsers.set('user-empty', createTypingStatus('', true));
    render(<TypingIndicator typingUsers={typingUsers} currentUsername="currentUser" />);
    expect(screen.getByText((content) => content.includes('typing...'))).toBeInTheDocument();
  });

  it('should apply correct styling classes', () => {
    const typingUsers = new Map<string, UserTypingStatus>();
    typingUsers.set('user-otherUser', createTypingStatus('otherUser', true));
    render(<TypingIndicator typingUsers={typingUsers} currentUsername="currentUser" />);
    const indicator = screen.getByText('otherUser is typing...');
    expect(indicator).toHaveClass(
      'fixed',
      'md:absolute',
      'bottom-4',
      'md:top-4',
      'md:bottom-auto',
      'right-4',
      'text-xs',
      'text-zinc-600',
      'dark:text-zinc-100',
      'bg-zinc-100',
      'dark:bg-zinc-800',
      'px-2',
      'py-1',
      'rounded-sm',
      'shadow-sm'
    );
  });
}); 