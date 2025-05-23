import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { WeightTrendChart } from '../../components/cats/WeightTrendChart';

describe('WeightTrendChart Popover', () => {
  const mockWeights = [
    { date: '2024-05-01', weight: 4.2 },
    { date: '2024-05-10', weight: 4.3 },
  ];
  const mockFeedings = [
    { date: '2024-05-01', count: 2 },
    { date: '2024-05-10', count: 3 },
  ];

  it('shows popover with details when a weight entry is clicked', () => {
    render(
      <WeightTrendChart
        weights={mockWeights}
        feedings={mockFeedings}
      />
    );
    // Click the first weight entry
    fireEvent.click(screen.getByText('2024-05-01'));
    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeInTheDocument();
    expect(within(dialog).getByText(/date/i)).toBeInTheDocument();
    expect(within(dialog).getByText(/2024-05-01/)).toBeInTheDocument();
    expect(within(dialog).getByText(/weight/i)).toBeInTheDocument();
    expect(within(dialog).getByText(/4.2/)).toBeInTheDocument();
    expect(within(dialog).getByText(/feedings/i)).toBeInTheDocument();
    expect(within(dialog).getByText((content, node) => node.textContent === 'Feedings: 2')).toBeInTheDocument();
  });
}); 