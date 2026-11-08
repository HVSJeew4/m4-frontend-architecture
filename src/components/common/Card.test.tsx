import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Card, CardBody, CardFooter, CardHeader } from './Card';

describe('Card', () => {
  it('renders header, body and footer as a section named by its title', () => {
    render(
      <Card aria-labelledby="t">
        <CardHeader
          titleId="t"
          title="Team"
          description="Who is on it"
          actions={<button type="button">Edit</button>}
        />
        <CardBody>Body text</CardBody>
        <CardFooter>Footer text</CardFooter>
      </Card>,
    );
    const section = screen.getByRole('region', { name: 'Team' });
    expect(section).toHaveTextContent('Who is on it');
    expect(section).toHaveTextContent('Body text');
    expect(section).toHaveTextContent('Footer text');
    expect(screen.getByRole('heading', { level: 2, name: 'Team' })).toBeInTheDocument();
  });

  it('lets the heading level be changed to keep the page outline right', () => {
    render(<CardHeader title="Nested" as="h3" />);
    expect(screen.getByRole('heading', { level: 3, name: 'Nested' })).toBeInTheDocument();
  });
});
