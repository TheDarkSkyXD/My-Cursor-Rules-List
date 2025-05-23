import { render, screen, fireEvent } from '@testing-library/react';
import { SessionCard } from '../session-card';
import { User } from '@collabx/shared';
import { expect } from '@jest/globals';

// Mock window.location
const mockLocation = new URL('http://localhost:3000');
Object.defineProperty(window, 'location', {
  value: mockLocation,
  writable: true,
});

describe('SessionCard', () => {
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
    sessionId: 'test-session',
    username: 'testuser',
    users: mockUsers,
    copySessionLink: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the session card with correct title and URL', () => {
    render(<SessionCard {...defaultProps} />);
    const title = screen.getByText('Current Session');
    const url = screen.getByText('http://localhost:3000/test-session');
    expect(title).toBeDefined();
    expect(url).toBeDefined();
  });

  it('handles copy button click', () => {
    render(<SessionCard {...defaultProps} />);
    const copyButton = screen.getByRole('button');
    fireEvent.click(copyButton);
    expect(defaultProps.copySessionLink.mock.calls.length).toBe(1);
  });

  it('displays user information correctly', () => {
    render(<SessionCard {...defaultProps} />);

    // Check active collaborators count
    const count = screen.getByText('(2/5)');
    expect(count).toBeDefined();

    // Check user avatars and roles
    const avatars = document.querySelectorAll('div[style*="background-color"]');
    expect(avatars.length).toBe(2);

    // Check user labels
    const currentUser = screen.getByText('testuser');
    const currentUserIdentifier = screen.getByText('(You)');
    const currentUserLabel = screen.getByText('Current User');
    const collaboratorLabel = screen.getByText('Collaborator');
    expect(currentUser).toBeDefined();
    expect(currentUserIdentifier).toBeDefined();
    expect(currentUserLabel).toBeDefined();
    expect(collaboratorLabel).toBeDefined();
  });

  describe('Edge Cases', () => {
    it('handles empty users array', () => {
      render(<SessionCard {...defaultProps} users={[]} />);

      const count = screen.getByText('(0/5)');
      expect(count).toBeDefined();

      const avatars = document.querySelectorAll('div[style*="background-color"]');
      expect(avatars.length).toBe(0);
    });

    it('handles long usernames', () => {
      const longUsername = 'a'.repeat(50);
      const usersWithLongName = [
        {
          ...mockUsers[0],
          username: longUsername,
        },
      ];

      render(<SessionCard {...defaultProps} users={usersWithLongName} />);

      const username = screen.getByText(`${longUsername}`);
      expect(username).toBeDefined();
    });

    it('handles special characters in usernames', () => {
      const specialUsername = 'user@#$%^&*()';
      const usersWithSpecialName = [
        {
          ...mockUsers[0],
          username: specialUsername,
        },
      ];

      render(<SessionCard {...defaultProps} users={usersWithSpecialName} />);

      const username = screen.getByText(`${specialUsername}`);
      expect(username).toBeDefined();
    });
  });

  describe('Performance', () => {
    it('renders efficiently', () => {
      const startTime = performance.now();

      render(<SessionCard {...defaultProps} />);

      const endTime = performance.now();
      expect(endTime - startTime).toBeLessThan(100); // Should render within 100ms
    });

    it('handles rapid re-renders efficiently', () => {
      const startTime = performance.now();

      const { rerender } = render(<SessionCard {...defaultProps} />);
      for (let i = 0; i < 100; i++) {
        rerender(<SessionCard {...defaultProps} />);
      }

      const endTime = performance.now();
      expect(endTime - startTime).toBeLessThan(1000); // Should handle 100 re-renders within 1s
    });
  });
});
