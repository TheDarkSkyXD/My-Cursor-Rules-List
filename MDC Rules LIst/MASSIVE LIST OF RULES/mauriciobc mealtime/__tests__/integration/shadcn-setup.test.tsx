import React from 'react';
import { render, screen } from '@testing-library/react';
import { Avatar, AvatarFallback } from '../../components/ui/avatar';

describe('ShadCN/ui setup', () => {
  it('renders Avatar component with fallback', () => {
    render(
      <Avatar>
        <AvatarFallback>AB</AvatarFallback>
      </Avatar>
    );
    expect(screen.getByText('AB')).toBeInTheDocument();
  });
}); 