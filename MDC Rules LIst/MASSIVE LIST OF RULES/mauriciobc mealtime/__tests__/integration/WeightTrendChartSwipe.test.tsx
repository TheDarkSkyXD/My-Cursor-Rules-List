import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { WeightTrendChart } from '../../components/cats/WeightTrendChart';

describe('WeightTrendChart Swipe Gestures', () => {
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

  it('changes range when swiped left or right', async () => {
    render(
      <WeightTrendChart
        weights={mockWeights}
        feedings={mockFeedings}
      />
    );
    // Default is 30 days
    expect(screen.getByRole('button', { name: /30 days/i })).toHaveAttribute('aria-pressed', 'true');
    const swipeArea = screen.getByTestId('trend-swipe-area');
    // Simulate swipe left (to 60 days) with mouse events
    fireEvent.mouseDown(swipeArea, { clientX: 200 });
    fireEvent.mouseMove(swipeArea, { clientX: 50 });
    fireEvent.mouseUp(swipeArea, { clientX: 50 });
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /60 days/i })).toHaveAttribute('aria-pressed', 'true');
    });
    // Simulate swipe right (back to 30 days)
    fireEvent.mouseDown(swipeArea, { clientX: 50 });
    fireEvent.mouseMove(swipeArea, { clientX: 200 });
    fireEvent.mouseUp(swipeArea, { clientX: 200 });
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /30 days/i })).toHaveAttribute('aria-pressed', 'true');
    });
  });
}); 