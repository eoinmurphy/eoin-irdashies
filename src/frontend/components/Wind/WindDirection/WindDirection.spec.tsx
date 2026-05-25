import { act, render } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { WindDirection } from './WindDirection';

let triggerResize: () => void;

class MockResizeObserver {
  private readonly callback: ResizeObserverCallback;

  constructor(callback: ResizeObserverCallback) {
    this.callback = callback;
    triggerResize = () => {
      this.callback([], this as unknown as ResizeObserver);
    };
  }

  observe = vi.fn();
  disconnect = vi.fn();
}

const setClientSize = (element: Element, width: number, height: number) => {
  Object.defineProperties(element, {
    clientWidth: { configurable: true, value: width },
    clientHeight: { configurable: true, value: height },
  });
};

describe('WindDirection', () => {
  beforeEach(() => {
    vi.stubGlobal('ResizeObserver', MockResizeObserver);
  });

  it('sizes the wind icon from the smallest available widget dimension', () => {
    const { container } = render(
      <div>
        <WindDirection speedMs={10} direction={0} />
      </div>
    );

    const wind = container.querySelector('#wind') as HTMLElement;
    const measuredContainer = wind.parentElement as HTMLElement;
    const speed = wind.querySelector('div') as HTMLElement;

    setClientSize(measuredContainer, 240, 80);
    act(() => triggerResize());

    expect(wind).toHaveStyle({ width: '80px', height: '80px' });
    expect(speed).toHaveStyle({ fontSize: '22px' });

    setClientSize(measuredContainer, 300, 200);
    act(() => triggerResize());

    expect(wind).toHaveStyle({ width: '200px', height: '200px' });
    expect(speed).toHaveStyle({ fontSize: '54px' });
  });

  it('colors the wind display by intensity', () => {
    const { container, rerender } = render(<WindDirection />);

    expect(container.querySelector('#wind')).toHaveClass('text-white');

    const cases = [
      { speedMs: 3, expectedClass: 'text-sky-300' },
      { speedMs: 6, expectedClass: 'text-emerald-300' },
      { speedMs: 10, expectedClass: 'text-orange-300' },
      { speedMs: 12, expectedClass: 'text-red-400' },
    ];

    cases.forEach(({ speedMs, expectedClass }) => {
      rerender(<WindDirection speedMs={speedMs} />);
      expect(container.querySelector('#wind')).toHaveClass(expectedClass);
    });
  });
});
