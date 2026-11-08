import { describe, expect, it } from 'vitest';
import { loginSchema } from './loginSchema';
import { userSchema } from './userSchema';

const VALID = { name: 'Ada Lovelace', email: 'ada@example.com', role: 'editor', isActive: true };

const messages = (result: {
  success: boolean;
  error?: { issues: { path: PropertyKey[]; message: string }[] };
}) => Object.fromEntries((result.error?.issues ?? []).map((i) => [i.path.join('.'), i.message]));

describe('userSchema (the brief’s schema)', () => {
  it('accepts a valid user', () => {
    expect(userSchema.parse(VALID)).toEqual(VALID);
  });

  it('trims the name before checking its length', () => {
    expect(userSchema.parse({ ...VALID, name: '  Ada  ' }).name).toBe('Ada');
    expect(messages(userSchema.safeParse({ ...VALID, name: '  A ' }))).toEqual({
      name: 'Name must be at least 2 characters',
    });
  });

  it('trims and lower-cases the email, so "Ada@Example.COM " and "ada@example.com" are the same user', () => {
    expect(userSchema.parse({ ...VALID, email: '  Ada@Example.COM ' }).email).toBe(
      'ada@example.com',
    );
  });

  it('rejects an invalid email with the brief’s message', () => {
    expect(messages(userSchema.safeParse({ ...VALID, email: 'ada@' }))).toEqual({
      email: 'Invalid email address',
    });
  });

  it.each(['owner', '', 'Admin'])('rejects the role %j', (role) => {
    expect(userSchema.safeParse({ ...VALID, role }).success).toBe(false);
  });

  it.each(['admin', 'user', 'editor'])('accepts the role %s', (role) => {
    expect(userSchema.safeParse({ ...VALID, role }).success).toBe(true);
  });

  it('requires isActive to be a real boolean', () => {
    expect(userSchema.safeParse({ ...VALID, isActive: 'true' }).success).toBe(false);
  });
});

describe('loginSchema', () => {
  it('needs a valid email and a password of 8+ characters', () => {
    expect(
      loginSchema.safeParse({ email: 'admin@adminflow.test', password: '12345678' }).success,
    ).toBe(true);
    expect(messages(loginSchema.safeParse({ email: 'nope', password: '1234567' }))).toEqual({
      email: 'Enter a valid email address',
      password: 'Password must be at least 8 characters',
    });
  });
});
