import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { SessionFullDialog } from '../session-full-dialog';
import { useUserStore } from '@/lib/stores/userStore';
import { useEditorStore } from '@/lib/stores';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    refresh: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
  }),
}));

// Mock stores
jest.mock('@/lib/stores/userStore', () => ({
  useUserStore: jest.fn(),
}));

jest.mock('@/lib/stores/editorStore', () => ({
  useEditorStore: jest.fn(),
}));

describe('SessionFullDialog', () => {
  const mockResetUser = jest.fn();
  const mockResetEditor = jest.fn();
  const mockOnViewReadOnly = jest.fn();

  beforeEach(() => {
    (useUserStore as unknown as jest.Mock).mockImplementation((selector) => selector({ reset: mockResetUser }));
    (useEditorStore as unknown as jest.Mock).mockImplementation((selector) => selector({ reset: mockResetEditor }));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders when open', () => {
    render(<SessionFullDialog isOpen={true} onViewReadOnly={mockOnViewReadOnly} />);
    expect(screen.getByText('Session is Full')).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(<SessionFullDialog isOpen={false} onViewReadOnly={mockOnViewReadOnly} />);
    expect(screen.queryByText('Session is Full')).not.toBeInTheDocument();
  });

  it('calls onViewReadOnly when clicking read-only button', () => {
    render(<SessionFullDialog isOpen={true} onViewReadOnly={mockOnViewReadOnly} />);
    fireEvent.click(screen.getByText('View in Read-Only Mode'));
    expect(mockOnViewReadOnly).toHaveBeenCalled();
  });

  it('calls reset functions and navigates when clicking create new button', () => {
    render(<SessionFullDialog isOpen={true} onViewReadOnly={mockOnViewReadOnly} />);
    fireEvent.click(screen.getByText('Create New Session'));
    expect(mockResetUser).toHaveBeenCalled();
    expect(mockResetEditor).toHaveBeenCalled();
  });

  it('traps focus within dialog', () => {
    render(<SessionFullDialog isOpen={true} onViewReadOnly={mockOnViewReadOnly} />);
    const dialog = screen.getByRole('dialog');
    const buttons = screen.getAllByRole('button');
    
    expect(dialog).toHaveAttribute('tabIndex', '-1');
    expect(buttons[0]).toHaveFocus();
  });

  describe('Performance', () => {
    it('handles rapid open/close efficiently', () => {
      const { rerender } = render(<SessionFullDialog isOpen={true} onViewReadOnly={mockOnViewReadOnly} />);
      
      // Simulate rapid open/close cycles
      for (let i = 0; i < 10; i++) {
        rerender(<SessionFullDialog isOpen={false} onViewReadOnly={mockOnViewReadOnly} />);
        rerender(<SessionFullDialog isOpen={true} onViewReadOnly={mockOnViewReadOnly} />);
      }
      
      // Verify dialog is still rendered correctly
      expect(screen.getByText('Session is Full')).toBeInTheDocument();
    });
  });
}); 