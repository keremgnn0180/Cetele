import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import StartupHealthGate from '../src/renderer/components/StartupHealthGate.jsx';

test('renders children when startup health is ok', async () => {
  window.api = {
    health: {
      check: async () => ({ ok: true, checks: { Database: { ok: true } } })
    }
  };

  render(
    <StartupHealthGate>
      <div>App Ready</div>
    </StartupHealthGate>
  );

  await waitFor(() => expect(screen.getByText('App Ready')).toBeInTheDocument());
});
