import type { Meta, StoryObj } from '@storybook/react-vite';
import { Weather } from './Weather';
import {
  BorderRadiusDecorator,
  TelemetryDecorator,
  borderRadiusStoryArgTypes,
  borderRadiusStoryArgs,
} from '@irdashies/storybook';

export default {
  component: Weather,
  title: 'widgets/Weather',
  decorators: [
    BorderRadiusDecorator,
    (Story) => (
      <div style={{ width: '150px' }}>
        <Story />
      </div>
    ),
  ],
  args: borderRadiusStoryArgs,
  argTypes: borderRadiusStoryArgTypes,
} as Meta;

type Story = StoryObj<typeof Weather>;

export const Primary: Story = {
  decorators: [TelemetryDecorator('/test-data/1731637331038')],
};
