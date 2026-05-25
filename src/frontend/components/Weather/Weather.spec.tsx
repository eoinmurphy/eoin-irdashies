import { act, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { WIND_DEMO_INTERVAL_MS } from '../../domain/weather/wind';
import { Weather } from './Weather';

vi.mock('@irdashies/context', () => ({
  useDashboard: vi.fn(),
  useTelemetryValue: vi.fn(),
  useSessionVisibility: vi.fn(),
  useThrottledWeather: vi.fn(),
}));

vi.mock('../Standings/hooks/useTrackTemperature', () => ({
  useTrackTemperature: vi.fn(() => ({ trackTemp: 20, airTemp: 18 })),
}));

vi.mock('./hooks/useTrackRubberedState', () => ({
  useTrackRubberedState: vi.fn(() => 'moderate'),
}));

vi.mock('./hooks/useWeatherSettings', () => ({
  useWeatherSettings: vi.fn(),
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
      data-testid="weather-wind-direction"
      data-speed-ms={speedMs}
      data-direction={direction}
      data-metric={metric}
    />
  ),
}));

vi.mock('./WeatherTemp/WeatherTemp', () => ({
  WeatherTemp: () => <div />,
}));

vi.mock('./WeatherHumidity/WeatherHumidity', () => ({
  WeatherHumidity: () => <div />,
}));

vi.mock('./WeatherPrecipitation/WeatherPrecipitation', () => ({
  WeatherPrecipitation: () => <div />,
}));

vi.mock('./WeatherTrackWetness/WeatherTrackWetness', () => ({
  WeatherTrackWetness: () => <div />,
}));

vi.mock('./WeatherTrackRubbered/WeatherTrackRubbered', () => ({
  WeatherTrackRubbered: () => <div />,
}));

import {
  useDashboard,
  useSessionVisibility,
  useTelemetryValue,
  useThrottledWeather,
} from '@irdashies/context';
import { useWeatherSettings } from './hooks/useWeatherSettings';

describe('Weather', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();

    vi.mocked(useDashboard).mockReturnValue({
      isDemoMode: true,
    } as ReturnType<typeof useDashboard>);
    vi.mocked(useTelemetryValue).mockImplementation((key) =>
      key === 'DisplayUnits' ? 1 : true
    );
    vi.mocked(useSessionVisibility).mockReturnValue(true);
    vi.mocked(useThrottledWeather).mockReturnValue({
      trackMoisture: undefined,
      windYaw: 1,
      windDirection: 2,
      windVelocity: 99,
      humidity: undefined,
      precipitation: undefined,
    });
    vi.mocked(useWeatherSettings).mockReturnValue({
      background: { opacity: 80 },
      displayOrder: ['wind'],
      showOnlyWhenOnTrack: false,
      airTemp: { enabled: false },
      trackTemp: { enabled: false },
      wetness: { enabled: false },
      trackState: { enabled: false },
      precipitation: { enabled: false },
      wind: { enabled: true },
      units: 'Metric',
      sessionVisibility: {
        race: true,
        loneQualify: true,
        openQualify: true,
        practice: true,
        offlineTesting: true,
      },
    });
  });

  it('uses shared cycling wind demo data for the wind column', () => {
    render(<Weather />);

    const wind = screen.getByTestId('weather-wind-direction');

    expect(Number(wind.dataset.speedMs)).toBeCloseTo(2 / 3.6);
    expect(Number(wind.dataset.direction)).toBeCloseTo(0);

    act(() => {
      vi.advanceTimersByTime(WIND_DEMO_INTERVAL_MS * 3);
    });

    expect(Number(wind.dataset.speedMs)).toBeCloseTo(35 / 3.6);
    expect(Number(wind.dataset.direction)).toBeCloseTo(Math.PI * 1.25);
  });
});
