import {
  useTelemetryValue,
  useSessionVisibility,
  useThrottledWeather,
  useDashboard,
} from '@irdashies/context';
import { useWindSettings } from './hooks/useWindSettings';
import { WindDirection } from './WindDirection/WindDirection';
import { useWindDemoData } from '../../domain/weather/useWindDemoData';

export const Wind = () => {
  const { isDemoMode } = useDashboard();
  const settings = useWindSettings();
  const displayUnits = useTelemetryValue('DisplayUnits');
  const isOnTrack = useTelemetryValue('IsOnTrack');
  const isSessionVisible = useSessionVisibility(settings?.sessionVisibility);

  const unitSetting = settings?.units ?? 'auto';
  const isMetric =
    unitSetting === 'auto'
      ? displayUnits === undefined || displayUnits === 1
      : unitSetting === 'Metric';

  const weather = useThrottledWeather();
  const relativeWindDirection =
    (weather.windDirection ?? 0) - (weather.windYaw ?? 0);
  const demoWind = useWindDemoData(isDemoMode, isMetric);

  if (demoWind) {
    return (
      <WindDirection
        speedMs={demoWind.speedMs}
        direction={demoWind.direction}
        metric={isMetric}
      />
    );
  }

  if (settings?.showOnlyWhenOnTrack && !isOnTrack) {
    return null;
  }

  if (!isSessionVisible) return <></>;

  return (
    <WindDirection
      speedMs={weather.windVelocity}
      direction={relativeWindDirection}
      metric={isMetric}
    />
  );
};
