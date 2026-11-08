import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Alert } from './Alert';

describe('Alert', () => {
  it.each([
    ['error', 'alert', 'Error'],
    ['warning', 'alert', 'Warning'],
    ['success', 'status', 'Success'],
    ['info', 'status', 'Information'],
  ] as const)('%s uses role="%s" and states its type in text', (variant, role, label) => {
    render(<Alert variant={variant} title="Heads up" />);
    expect(screen.getByRole(role)).toHaveTextContent(`${label}: Heads up`);
  });

  it('can be dismissed', async () => {
    const onDismiss = vi.fn();
    render(<Alert title="Saved" onDismiss={onDismiss} />);
    await userEvent.click(screen.getByRole('button', { name: 'Dismiss' }));
    expect(onDismiss).toHaveBeenCalledOnce();
  });
});
