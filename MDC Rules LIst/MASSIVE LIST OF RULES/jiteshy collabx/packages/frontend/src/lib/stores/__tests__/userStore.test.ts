import { useUserStore } from '../userStore';
import { User } from '@collabx/shared';

describe('userStore', () => {
  beforeEach(() => {
    useUserStore.getState().reset();
  });

  it('should not duplicate users when adding the same user multiple times', () => {
    const user: User = {
      id: '1',
      username: 'testuser',
      color: '#ff0000',
      lastActive: Date.now(),
      sessionId: 'test-session',
    };

    // Add user multiple times
    useUserStore.getState().addUser(user);
    useUserStore.getState().addUser(user);
    useUserStore.getState().addUser(user);

    const users = useUserStore.getState().users;
    expect(users.length).toBe(1);
    expect(users[0].id).toBe('1');
  });

  it('should properly handle user removal and addition after refresh', () => {
    const user1: User = {
      id: '1',
      username: 'user1',
      color: '#ff0000',
      lastActive: Date.now(),
      sessionId: 'test-session',
    };

    const user2: User = {
      id: '2',
      username: 'user2',
      color: '#00ff00',
      lastActive: Date.now(),
      sessionId: 'test-session',
    };

    // Simulate first window
    useUserStore.getState().addUser(user1);
    useUserStore.getState().addUser(user2);

    // Simulate second window
    useUserStore.getState().addUser(user1);
    useUserStore.getState().addUser(user2);

    // Simulate refresh of first window
    useUserStore.getState().removeUser(user1.id);
    useUserStore.getState().addUser(user1);

    const users = useUserStore.getState().users;
    expect(users.length).toBe(2);
    expect(users.find(u => u.id === '1')).toBeDefined();
    expect(users.find(u => u.id === '2')).toBeDefined();
  });
}); 