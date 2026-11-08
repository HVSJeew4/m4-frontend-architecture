import { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { axeViolations } from '@/test/axe';
import { Input } from './Input';

describe('Input', () => {
  it('is labelled by its label', () => {
    render(<Input label="Email" type="email" />);
    expect(screen.getByLabelText('Email')).toHaveAttribute('type', 'email');
  });

  it('links the error and hint with aria-describedby and marks itself invalid', () => {
    render(
      <Input label="Password" type="password" hint="At least 8 characters" error="Too short" />,
    );
    const input = screen.getByLabelText('Password');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAccessibleDescription('At least 8 characters Too short');
  });

  it('is not marked invalid without an error', () => {
    render(<Input label="Name" />);
    expect(screen.getByLabelText('Name')).not.toHaveAttribute('aria-invalid');
  });

  it('shows a visual asterisk for required fields but announces "required" from the attribute', () => {
    render(<Input label="Name" required />);
    expect(screen.getByRole('textbox', { name: 'Name' })).toBeRequired();
  });

  it('forwards its ref to the <input> (needed by React Hook Form)', () => {
    const ref = createRef<HTMLInputElement>();
    render(<Input label="Name" ref={ref} />);
    expect(ref.current).toBe(screen.getByLabelText('Name'));
  });

  it('can hide the label visually and still be named', () => {
    render(<Input label="Search" hideLabel />);
    expect(screen.getByRole('textbox', { name: 'Search' })).toBeInTheDocument();
  });

  it('has no axe violations with an error', async () => {
    const { container } = render(<Input label="Email" error="Invalid email address" />);
    expect(await axeViolations(container)).toEqual([]);
  });
});
