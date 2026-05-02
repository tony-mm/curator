import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';
import Landing from '../components/Landing';

describe('Landing', () => {
  it('renders the brand header', () => {
    render(
      <AuthProvider>
        <MemoryRouter>
          <Landing />
        </MemoryRouter>
      </AuthProvider>
    );

    expect(screen.getByText('Curator')).toBeInTheDocument();
  });
});
