import { act, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { WIND_DEMO_INTERVAL_MS } from '../../domain/weather/wind';
import { Wind } from './Wind';

vi.mock('@irdashies/context', () => ({
  useDashboard: vi.fn(),
  useTelemetryValue: vi.fn(),
  useSessionVisibility: vi.fn(),
  useThrottledWeather: vi.fn(),
}));

vi.mock('./hooks/useWindSettings', () => ({
  useWindSettings: vi.fn(),
}));

vi.mock('./WindDirection/WindDirection', () => ({
  WindDirection: ({
    speedMs,
    direction,
    metric,
  }: {
    speedMs?: number;
    direction?: number;
    metric?: boolean;
  }) => (
    <div
      data-testid="wind-direction"
      data-speed-ms={speedMs}
      data-direction={direction}
      data-metric={metric}
    />
  ),
}));

import {
  useDashboard,
  useTelemetryValue,
  useSessionVisibility,
  useThrottledWeather,
} from '@irdashies/context';
import { useWindSettings } from './hooks/useWindSettings';

describe('Wind', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();

    vi.mocked(useDashboard).mockReturnValue({
      isDemoMode: true,
    } as ReturnType<typeof useDashboard>);
    vi.mocked(useWindSettings).mockReturnValue({
      units: 'Metric',
      showOnlyWhenOnTrack: true,
      sessionVisibility: {
        race: false,
        loneQualify: false,
        openQualify: false,
        practice: false,
        offlineTesting: false,
      },
    });
    vi.mocked(useTelemetryValue).mockReturnValue(undefined);
    vi.mocked(useSessionVisibility).mockReturnValue(false);
    vi.mocked(useThrottledWeather).mockReturnValue({
      trackMoisture: undefined,
      windYaw: 1,
      windDirection: 2,
      windVelocity: 99,
      humidity: undefined,
      precipitation: undefined,
    });
  });

  it('cycles wind values in demo mode even when live visibility would hide it', () => {
    render(<Wind />);

    const wind = screen.getByTestId('wind-direction');

    expect(Number(wind.dataset.speedMs)).toBeCloseTo(2 / 3.6);
    expect(Number(wind.dataset.direction)).toBeCloseTo(0);

    act(() => {
      vi.advanceTimersByTime(WIND_DEMO_INTERVAL_MS);
    });

    expect(Number(wind.dataset.speedMs)).toBeCloseTo(8 / 3.6);
    expect(Number(wind.dataset.direction)).toBeCloseTo(Math.PI * 0.25);

    act(() => {
      vi.advanceTimersByTime(WIND_DEMO_INTERVAL_MS * 3);
    });

    expect(Number(wind.dataset.speedMs)).toBeCloseTo(44 / 3.6);
    expect(Number(wind.dataset.direction)).toBeCloseTo(Math.PI * 1.75);
  });

  it('converts demo speeds from the active display unit', () => {
    vi.mocked(useWindSettings).mockReturnValue({
      units: 'Imperial',
      showOnlyWhenOnTrack: false,
      sessionVisibility: {
        race: true,
        loneQualify: true,
        openQualify: true,
        practice: true,
        offlineTesting: true,
      },
    });

    render(<Wind />);

    const wind = screen.getByTestId('wind-direction');

    expect(Number(wind.dataset.speedMs)).toBeCloseTo(2 / 2.23694);
    expect(wind.dataset.metric).toBe('false');
  });
});
