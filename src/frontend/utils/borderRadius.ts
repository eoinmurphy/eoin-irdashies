import type { CSSProperties } from 'react';
import type {
  BorderRadiusCorners,
  GeneralSettingsType,
  WidgetBorderRadiusSettings,
} from '@irdashies/types';

export const DEFAULT_BORDER_RADIUS = 2;
export const MAX_BORDER_RADIUS = 32;

export const DEFAULT_BORDER_RADIUS_CORNERS: BorderRadiusCorners = {
  topLeft: DEFAULT_BORDER_RADIUS,
  topRight: DEFAULT_BORDER_RADIUS,
  bottomRight: DEFAULT_BORDER_RADIUS,
  bottomLeft: DEFAULT_BORDER_RADIUS,
};

export const DEFAULT_WIDGET_BORDER_RADIUS: WidgetBorderRadiusSettings = {
  mode: 'inherit',
};

export const WIDGET_BORDER_RADIUS_CLASS = 'widget-radius-clip';
export const WIDGET_BORDER_RADIUS_SURFACE_CLASS = 'widget-radius-surface';

const createBorderRadiusStyle = (
  corners: BorderRadiusCorners
): CSSProperties => {
  const topLeft = clampBorderRadius(corners.topLeft);
  const topRight = clampBorderRadius(corners.topRight);
  const bottomRight = clampBorderRadius(corners.bottomRight);
  const bottomLeft = clampBorderRadius(corners.bottomLeft);

  return {
    borderTopLeftRadius: topLeft,
    borderTopRightRadius: topRight,
    borderBottomRightRadius: bottomRight,
    borderBottomLeftRadius: bottomLeft,
    ['--widget-border-radius-top-left' as string]: `${topLeft}px`,
    ['--widget-border-radius-top-right' as string]: `${topRight}px`,
    ['--widget-border-radius-bottom-right' as string]: `${bottomRight}px`,
    ['--widget-border-radius-bottom-left' as string]: `${bottomLeft}px`,
    overflow: 'hidden',
  };
};

export const clampBorderRadius = (value: number | undefined): number => {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return DEFAULT_BORDER_RADIUS;
  }

  return Math.min(MAX_BORDER_RADIUS, Math.max(0, Math.round(value)));
};

export const getWidgetBorderRadiusStyle = (
  settings: WidgetBorderRadiusSettings | undefined,
  generalSettings: GeneralSettingsType | undefined
): CSSProperties => {
  const globalRadius = clampBorderRadius(generalSettings?.borderRadius);

  if (!settings || settings.mode === 'inherit') {
    return createBorderRadiusStyle({
      topLeft: globalRadius,
      topRight: globalRadius,
      bottomRight: globalRadius,
      bottomLeft: globalRadius,
    });
  }

  if (settings.mode === 'uniform') {
    const radius = clampBorderRadius(settings.radius);
    return {
      borderRadius: radius,
      ...createBorderRadiusStyle({
        topLeft: radius,
        topRight: radius,
        bottomRight: radius,
        bottomLeft: radius,
      }),
    } satisfies CSSProperties;
  }

  const corners = {
    ...DEFAULT_BORDER_RADIUS_CORNERS,
    ...settings.corners,
  };

  return createBorderRadiusStyle(corners);
};
