import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from './Button';
import { Card, CardBody, CardFooter, CardHeader } from './Card';

const meta = {
  title: 'Components/Card',
  component: Card,
  decorators: [(Story) => <div className="max-w-md">{Story()}</div>],
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithHeaderBodyFooter: Story = {
  render: () => (
    <Card aria-labelledby="card-title">
      <CardHeader
        titleId="card-title"
        title="Team members"
        description="People with access to this workspace"
        actions={
          <Button size="sm" variant="secondary">
            Manage
          </Button>
        }
      />
      <CardBody>
        <p className="text-slate-700">12 members, 3 pending invitations.</p>
      </CardBody>
      <CardFooter>
        <Button variant="secondary">Cancel</Button>
        <Button>Invite</Button>
      </CardFooter>
    </Card>
  ),
};

export const BodyOnly: Story = {
  render: () => (
    <Card aria-label="Note">
      <CardBody>A card can also be just a body.</CardBody>
    </Card>
  ),
};
