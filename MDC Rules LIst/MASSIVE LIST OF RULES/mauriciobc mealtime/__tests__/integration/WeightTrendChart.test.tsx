import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { WeightTrendChart } from '../../components/cats/WeightTrendChart';

describe('WeightTrendChart', () => {
  const mockWeights = [
    { date: '2024-05-01', weight: 4.2 },
    { date: '2024-05-10', weight: 4.3 },
    { date: '2024-05-20', weight: 4.4 },
  ];
  const mockFeedings = [
    { date: '2024-05-01', count: 2 },
    { date: '2024-05-10', count: 3 },
    { date: '2024-05-20', count: 1 },
  ];

  it('renders weight timeline, toggle buttons, and feeding density badges', () => {
    render(
      <WeightTrendChart
        weights={mockWeights}
        feedings={mockFeedings}
      />
    );
    expect(screen.getByText(/weight trend/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /30 days/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /60 days/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /90 days/i })).toBeInTheDocument();
    expect(screen.getAllByText(/kg/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/feedings?/i).length).toBeGreaterThan(0);
  });

  it('toggles chart range when buttons are clicked', () => {
    render(
      <WeightTrendChart
        weights={mockWeights}
        feedings={mockFeedings}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: /60 days/i }));
    expect(screen.getByRole('button', { name: /60 days/i })).toHaveAttribute('aria-pressed', 'true');
  });
}); 