import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { Select } from './Select';

const OPTIONS = [
  { value: 'admin', label: 'Admin' },
  { value: 'editor', label: 'Editor' },
  { value: 'user', label: 'User' },
];

describe('Select', () => {
  it('single select: placeholder option first, then the options', () => {
    render(<Select label="Role" placeholder="All roles" options={OPTIONS} />);
    const select = screen.getByRole('combobox', { name: 'Role' });
    expect(Array.from((select as HTMLSelectElement).options, (o) => o.text)).toEqual([
      'All roles',
      'Admin',
      'Editor',
      'User',
    ]);
  });

  it('multi-select: picks several values and explains how', async () => {
    render(<Select label="Roles" options={OPTIONS} multiple placeholder="ignored" />);
    const select = screen.getByRole('listbox', { name: 'Roles' }) as HTMLSelectElement;
    expect(select).toHaveAccessibleDescription(/Ctrl/);
    expect(select.options).toHaveLength(3); // no placeholder in a multi-select

    await userEvent.selectOptions(select, ['admin', 'user']);
    expect(Array.from(select.selectedOptions, (o) => o.value)).toEqual(['admin', 'user']);
  });

  it('shows an error linked with aria-describedby', () => {
    render(<Select label="Role" options={OPTIONS} error="Choose a role" />);
    const select = screen.getByRole('combobox', { name: 'Role' });
    expect(select).toHaveAttribute('aria-invalid', 'true');
    expect(select).toHaveAccessibleDescription('Choose a role');
  });
});
