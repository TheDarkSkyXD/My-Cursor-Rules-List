import { render, screen, fireEvent } from '@testing-library/react';
import { EditorHeader } from '../editor-header';
import { User } from '@collabx/shared';
import { expect } from '@jest/globals';

describe('EditorHeader', () => {
  const mockUsers: User[] = [
    {
      id: '1',
      username: 'testuser',
      color: '#ff0000',
      lastActive: Date.now(),
      sessionId: 'test-session',
    },
    {
      id: '2',
      username: 'collaborator',
      color: '#00ff00',
      lastActive: Date.now(),
      sessionId: 'test-session',
    },
  ];

  const defaultProps = {
    language: 'javascript',
    setLanguage: jest.fn(),
    readOnly: false,
    users: mockUsers,
    username: 'testuser',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the language selector', () => {
    render(<EditorHeader {...defaultProps} />);
    const selector = screen.getByRole('combobox');
    expect(selector).toBeDefined();
  });

  it('displays read-only message when in read-only mode', () => {
    render(<EditorHeader {...defaultProps} readOnly={true} />);
    const message = screen.getByText('Read-Only Mode');
    expect(message).toBeDefined();
  });

  it('displays user avatars', () => {
    render(<EditorHeader {...defaultProps} />);
    const avatars = document.querySelectorAll('.group');
    expect(avatars.length).toBe(2);
  });

  it('displays the correct user count', () => {
    render(<EditorHeader {...defaultProps} />);
    const userCount = screen.getByText('2 active');
    expect(userCount).toBeDefined();
  });

  it('updates user count when users change', () => {
    const { rerender } = render(<EditorHeader {...defaultProps} />);
    expect(screen.getByText('2 active')).toBeDefined();

    const updatedUsers = [
      ...mockUsers,
      {
        id: '3',
        username: 'newuser',
        color: '#0000ff',
        lastActive: Date.now(),
        sessionId: 'test-session',
      },
    ];

    rerender(<EditorHeader {...defaultProps} users={updatedUsers} />);
    expect(screen.getByText('3 active')).toBeDefined();
  });

  it('shows current user label on hover', () => {
    render(<EditorHeader {...defaultProps} />);

    // Find the current user's avatar
    const currentUserAvatar = document.querySelector('.group');
    expect(currentUserAvatar).toBeDefined();

    // Simulate hover
    fireEvent.mouseEnter(currentUserAvatar!);

    // Check for current user label
    const currentUserLabel = screen.getByText('(You)');
    expect(currentUserLabel).toBeDefined();
  });

  it('applies special border to current user avatar', () => {
    render(<EditorHeader {...defaultProps} />);

    // Find the current user's avatar
    const currentUserAvatar = document.querySelector('.group div[style*="background-color"]');
    expect(currentUserAvatar).toBeDefined();
    expect(currentUserAvatar?.className).toContain('border-zinc-800');
  });

  it('shows username in tooltip on hover', () => {
    render(<EditorHeader {...defaultProps} />);

    // Find the current user's avatar
    const currentUserAvatar = document.querySelector('.group');
    expect(currentUserAvatar).toBeDefined();

    // Simulate hover
    fireEvent.mouseEnter(currentUserAvatar!);

    // Check for username
    const username = screen.getByText('testuser');
    expect(username).toBeDefined();
    expect(username.className).toContain('font-medium');
  });

  describe('Edge Cases', () => {
    it('handles empty users array', () => {
      render(<EditorHeader {...defaultProps} users={[]} />);

      const avatars = screen.queryAllByRole('img', { hidden: true });
      expect(avatars).toHaveLength(0);

      const userList = document.querySelectorAll('.group');
      expect(userList.length).toBe(0);

      expect(screen.getByText('0 active')).toBeDefined();
    });

    it('handles long usernames', () => {
      const longUsername = 'a'.repeat(50);
      const usersWithLongName = [
        {
          ...mockUsers[0],
          username: longUsername,
        },
      ];

      render(<EditorHeader {...defaultProps} users={usersWithLongName} />);

      const avatar = document.querySelector('.group');
      expect(avatar).toBeDefined();

      // Simulate hover
      fireEvent.mouseEnter(avatar!);

      // Check for username
      const username = screen.getByText(longUsername);
      expect(username).toBeDefined();
    });
  });

  describe('Performance', () => {
    it('renders efficiently', () => {
      const startTime = performance.now();

      render(<EditorHeader {...defaultProps} />);

      const endTime = performance.now();
      expect(endTime - startTime).toBeLessThan(100); // Should render within 100ms
    });

    it('handles rapid re-renders efficiently', () => {
      const startTime = performance.now();

      const { rerender } = render(<EditorHeader {...defaultProps} />);
      for (let i = 0; i < 100; i++) {
        rerender(<EditorHeader {...defaultProps} />);
      }

      const endTime = performance.now();
      expect(endTime - startTime).toBeLessThan(1000); // Should handle 100 re-renders within 1s
    });
  });
});
