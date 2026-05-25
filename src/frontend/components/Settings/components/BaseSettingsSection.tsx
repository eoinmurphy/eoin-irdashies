import { ReactNode, useState } from 'react';
import { ToggleSwitch } from './ToggleSwitch';
import type {
  BaseWidgetSettings,
  SharedWidgetConfig,
  WidgetBorderRadiusSettings,
} from '@irdashies/types';
import { useDashboard } from '@irdashies/context';
import { SettingButtonGroupRow } from './SettingButtonGroupRow';
import { SettingSliderRow } from './SettingSliderRow';
import {
  DEFAULT_BORDER_RADIUS_CORNERS,
  DEFAULT_WIDGET_BORDER_RADIUS,
  MAX_BORDER_RADIUS,
  clampBorderRadius,
} from '@irdashies/utils/borderRadius';

interface BaseSettingsSectionProps<T> {
  title: string;
  description: string;
  settings: BaseWidgetSettings<T>;
  onSettingsChange: (settings: BaseWidgetSettings<T>) => void;
  widgetId: string;
  children?:
    | ((handleConfigChange: (config: Partial<T>) => void) => ReactNode)
    | ReactNode;
  onConfigChange?: (config: Partial<T>) => void;
  disableInternalScroll?: boolean;
  showBorderRadiusControls?: boolean;
}

const CORNER_LABELS: {
  key: keyof NonNullable<WidgetBorderRadiusSettings['corners']>;
  title: string;
}[] = [
  { key: 'topLeft', title: 'Top Left' },
  { key: 'topRight', title: 'Top Right' },
  { key: 'bottomRight', title: 'Bottom Right' },
  { key: 'bottomLeft', title: 'Bottom Left' },
];

export const BaseSettingsSection = <T,>({
  title,
  description,
  settings,
  onSettingsChange,
  widgetId,
  children,
  onConfigChange,
  disableInternalScroll = false,
  showBorderRadiusControls = true,
}: BaseSettingsSectionProps<T>) => {
  const { currentDashboard, onDashboardUpdated } = useDashboard();
  const [localSettings, setLocalSettings] =
    useState<BaseWidgetSettings<T>>(settings);

  // Clean synchronization pattern: track what we last synced to detect external changes
  const updatedWidget = currentDashboard?.widgets.find(
    (w) => w.id === widgetId
  );
  const [prevWidgetData, setPrevWidgetData] = useState(updatedWidget);

  if (JSON.stringify(updatedWidget) !== JSON.stringify(prevWidgetData)) {
    setPrevWidgetData(updatedWidget);
    if (updatedWidget) {
      // This setState during render is safe and efficient in React when guarded by a condition
      // like this. It avoids the extra render pass that an effect would cause.
      setLocalSettings({
        enabled: updatedWidget.enabled,
        config: updatedWidget.config as unknown as T,
      });
    }
  }

  const handleSettingsChange = (newSettings: BaseWidgetSettings<T>) => {
    setLocalSettings(newSettings);
    onSettingsChange(newSettings);
    updateDashboard(newSettings);
  };

  const handleConfigChange = (newConfig: Partial<T>) => {
    const updatedSettings: BaseWidgetSettings<T> = {
      ...localSettings,
      config: {
        ...localSettings.config,
        ...newConfig,
      } as T,
    };

    setLocalSettings(updatedSettings);
    onSettingsChange(updatedSettings);
    updateDashboard(updatedSettings);
    onConfigChange?.(newConfig);
  };

  const widgetConfig = localSettings.config as T & SharedWidgetConfig;
  const borderRadius =
    widgetConfig.borderRadius ?? DEFAULT_WIDGET_BORDER_RADIUS;

  const handleBorderRadiusChange = (
    newBorderRadius: WidgetBorderRadiusSettings
  ) => {
    handleConfigChange({
      borderRadius: newBorderRadius,
    } as unknown as Partial<T>);
  };

  const handleBorderRadiusModeChange = (
    mode: WidgetBorderRadiusSettings['mode']
  ) => {
    if (mode === 'inherit') {
      handleBorderRadiusChange({ mode });
      return;
    }

    if (mode === 'uniform') {
      handleBorderRadiusChange({
        mode,
        radius: clampBorderRadius(borderRadius.radius),
      });
      return;
    }

    handleBorderRadiusChange({
      mode,
      corners: {
        ...DEFAULT_BORDER_RADIUS_CORNERS,
        ...borderRadius.corners,
      },
    });
  };

  const handleUniformBorderRadiusChange = (radius: number) => {
    handleBorderRadiusChange({
      mode: 'uniform',
      radius: clampBorderRadius(radius),
    });
  };

  const handleCornerBorderRadiusChange = (
    corner: keyof NonNullable<WidgetBorderRadiusSettings['corners']>,
    value: number
  ) => {
    handleBorderRadiusChange({
      mode: 'corners',
      corners: {
        ...DEFAULT_BORDER_RADIUS_CORNERS,
        ...borderRadius.corners,
        [corner]: clampBorderRadius(value),
      },
    });
  };

  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const handleResetPosition = () => {
    setShowResetConfirm(true);
  };

  const confirmResetPosition = () => {
    setShowResetConfirm(false);
    if (currentDashboard && onDashboardUpdated) {
      const updatedWidgets = currentDashboard.widgets.map((widget) => {
        if (widget.id !== widgetId) return widget;

        return {
          ...widget,
          layout: {
            ...widget.layout,
            x: 0,
            y: 0,
          },
          config: {
            ...widget.config,
            browserPosition: undefined,
          },
        };
      });

      const updatedDashboard = {
        ...currentDashboard,
        widgets: updatedWidgets,
      };
      onDashboardUpdated(updatedDashboard);
    }
  };

  const updateDashboard = (newSettings: BaseWidgetSettings<T>) => {
    if (currentDashboard && onDashboardUpdated) {
      const widgetExists = currentDashboard.widgets.some(
        (w) => w.id === widgetId
      );

      const updatedWidgets = widgetExists
        ? currentDashboard.widgets.map((widget) => {
            if (widget.id !== widgetId) return widget;

            return {
              ...widget,
              enabled: newSettings.enabled,
              config: newSettings.config as unknown as Record<string, unknown>,
            };
          })
        : [
            ...currentDashboard.widgets,
            {
              id: widgetId,
              enabled: newSettings.enabled,
              config: newSettings.config as unknown as Record<string, unknown>,
              // Default layout for new widgets if they don't exist
              layout: { x: 50, y: 50, width: 400, height: 300 },
            },
          ];

      const updatedDashboard = {
        ...currentDashboard,
        widgets: updatedWidgets,
      };
      onDashboardUpdated(updatedDashboard);
    }
  };

  return (
    <div className={`flex flex-col ${disableInternalScroll ? '' : 'h-full'}`}>
      <div className="flex-none space-y-6 p-4 bg-slate-700 rounded">
        <div>
          <div className="flex justify-between items-center mb-1">
            <h2 className="text-xl">{title}</h2>
            <ToggleSwitch
              enabled={localSettings.enabled}
              onToggle={(enabled) =>
                handleSettingsChange({ ...localSettings, enabled })
              }
            />
          </div>
          <p className="text-slate-400 text-sm">{description}</p>
        </div>
      </div>

      <div
        className={`${disableInternalScroll ? '' : 'flex-1 overflow-y-auto min-h-0'} mt-4`}
      >
        {children && (
          <div className="space-y-4">
            {typeof children === 'function'
              ? children(handleConfigChange)
              : children}
          </div>
        )}

        <div className="flex justify-center p-4 pt-2 mt-2">
          <button
            type="button"
            onClick={handleResetPosition}
            className="px-3 py-1 text-sm bg-slate-600 hover:bg-slate-500 text-slate-300 rounded-md transition-colors"
          >
            Reset Position
          </button>
        </div>

        {showBorderRadiusControls && (
          <div className="space-y-4 p-4 pt-2 mt-2 border-t border-slate-700">
            <SettingButtonGroupRow
              title="Border Radius"
              value={borderRadius.mode}
              options={[
                { label: 'Global', value: 'inherit' },
                { label: 'Uniform', value: 'uniform' },
                { label: 'Corners', value: 'corners' },
              ]}
              onChange={handleBorderRadiusModeChange}
            />

            {borderRadius.mode === 'uniform' && (
              <SettingSliderRow
                title="Radius"
                units="px"
                value={clampBorderRadius(borderRadius.radius)}
                min={0}
                max={MAX_BORDER_RADIUS}
                step={1}
                onChange={handleUniformBorderRadiusChange}
              />
            )}

            {borderRadius.mode === 'corners' && (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {CORNER_LABELS.map(({ key, title }) => (
                  <SettingSliderRow
                    key={key}
                    title={title}
                    units="px"
                    value={clampBorderRadius(
                      borderRadius.corners?.[key] ??
                        DEFAULT_BORDER_RADIUS_CORNERS[key]
                    )}
                    min={0}
                    max={MAX_BORDER_RADIUS}
                    step={1}
                    onChange={(value) =>
                      handleCornerBorderRadiusChange(key, value)
                    }
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {showResetConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
            <div className="bg-slate-800 rounded-lg border border-slate-600 p-5 w-80 shadow-xl">
              <h3 className="text-base font-semibold text-white mb-2">
                Reset Position
              </h3>
              <p className="text-sm text-slate-300 mb-4">
                This will reset the position for both the on-screen overlay and
                the browser/URL source version.
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={confirmResetPosition}
                  className="flex-1 px-3 py-1.5 text-sm bg-red-700 hover:bg-red-600 text-white rounded-md transition-colors"
                >
                  Reset Position
                </button>
                <button
                  type="button"
                  onClick={() => setShowResetConfirm(false)}
                  className="flex-1 px-3 py-1.5 text-sm bg-slate-600 hover:bg-slate-500 text-slate-300 rounded-md transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
