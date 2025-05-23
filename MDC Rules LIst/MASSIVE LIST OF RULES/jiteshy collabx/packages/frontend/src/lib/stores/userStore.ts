import { create } from 'zustand';
import { User, UserCursor, UserSelection, UserTypingStatus } from '@collabx/shared';

interface UserState {
  users: User[];
  cursors: UserCursor[];
  selections: UserSelection[];
  typingUsers: Map<string, UserTypingStatus>;
  addUser: (user: User) => void;
  removeUser: (userId: string) => void;
  updateCursor: (cursor: UserCursor) => void;
  removeCursor: (userId: string) => void;
  updateSelection: (selection: UserSelection) => void;
  removeSelection: (userId: string) => void;
  updateTypingStatus: (userId: string, status: UserTypingStatus) => void;
  removeTypingStatus: (userId: string) => void;
  reset: () => void;
}

export const useUserStore = create<UserState>((set) => ({
  users: [],
  cursors: [],
  selections: [],
  typingUsers: new Map(),

  addUser: (user) => {
    set((state) => {
      // Check if user already exists
      if (state.users.some((u) => u.id === user.id)) {
        return state;
      }
      return { users: [...state.users, user] };
    });
  },

  removeUser: (userId) => {
    set((state) => ({
      users: state.users.filter((u) => u.id !== userId),
      cursors: state.cursors.filter((c) => c.user.id !== userId),
      selections: state.selections.filter((s) => s.user.id !== userId),
      typingUsers: new Map(Array.from(state.typingUsers.entries()).filter(([id]) => id !== userId)),
    }));
  },

  updateCursor: (cursor) => {
    set((state) => ({
      cursors: [...state.cursors.filter((c) => c.user.id !== cursor.user.id), cursor],
    }));
  },

  removeCursor: (userId) => {
    set((state) => ({
      cursors: state.cursors.filter((c) => c.user.id !== userId),
    }));
  },

  updateSelection: (selection) => {
    set((state) => ({
      selections: [...state.selections.filter((s) => s.user.id !== selection.user.id), selection],
    }));
  },

  removeSelection: (userId) => {
    set((state) => ({
      selections: state.selections.filter((s) => s.user.id !== userId),
    }));
  },

  updateTypingStatus: (userId, status) => {
    set((state) => ({
      typingUsers: new Map(state.typingUsers).set(userId, status),
    }));
  },

  removeTypingStatus: (userId) => {
    set((state) => ({
      typingUsers: new Map(Array.from(state.typingUsers.entries()).filter(([id]) => id !== userId)),
    }));
  },

  reset: () =>
    set({
      users: [],
      cursors: [],
      selections: [],
      typingUsers: new Map(),
    }),
}));
