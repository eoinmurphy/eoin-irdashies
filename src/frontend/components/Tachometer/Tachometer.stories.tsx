import { Meta, StoryObj } from '@storybook/react-vite';
import { Tachometer } from './Tachometer';
import {
  BorderRadiusDecorator,
  TelemetryDecorator,
  borderRadiusStoryArgTypes,
  borderRadiusStoryArgs,
} from '@irdashies/storybook';

const meta: Meta<typeof Tachometer> = {
  component: Tachometer,
  title: 'widgets/Tachometer/components/Widget',
  decorators: [BorderRadiusDecorator, TelemetryDecorator()],
  args: borderRadiusStoryArgs,
  argTypes: borderRadiusStoryArgTypes,
};
export default meta;

type Story = StoryObj<typeof Tachometer>;

export const Primary: Story = {
  render: () => (
    <div className="h-[100px] w-full">
      <Tachometer />
    </div>
  ),
  args: {},
};
