import { useEffect, useRef } from 'react';
import { createChart } from 'lightweight-charts';

export default function CandlestickChart({ data = [], height = 360, fillContainer = false, onCrosshair }) {
  const containerRef = useRef(null);
  const chartRef     = useRef(null);
  const seriesRef    = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const el = containerRef.current;
    const h  = fillContainer ? el.clientHeight : height;

    const chart = createChart(el, {
      width:  el.clientWidth,
      height: h || 320,
      layout: {
        background:  { color: 'transparent' },
        textColor:   'rgba(255,255,255,0.4)',
        fontSize:    11,
        fontFamily:  'Inter, sans-serif',
      },
      grid: {
        vertLines: { color: 'rgba(212,212,212,0.04)' },
        horzLines: { color: 'rgba(212,212,212,0.04)' },
      },
      crosshair: {
        mode: 1,
        vertLine: { color: 'rgba(212,212,212,0.3)', style: 0, width: 1 },
        horzLine: { color: 'rgba(212,212,212,0.3)', style: 0, width: 1 },
      },
      rightPriceScale: {
        borderColor:   'rgba(212,212,212,0.08)',
        scaleMargins:  { top: 0.08, bottom: 0.08 },
        textColor:     'rgba(255,255,255,0.35)',
      },
      timeScale: {
        borderColor:       'rgba(212,212,212,0.08)',
        timeVisible:       true,
        secondsVisible:    false,
        fixLeftEdge:       true,
        fixRightEdge:      true,
      },
      handleScroll:  { mouseWheel: true, pressedMouseMove: true },
      handleScale:   { mouseWheel: true, pinch: true },
    });

    const series = chart.addCandlestickSeries({
      upColor:        '#d4d4d4',
      downColor:      '#f87171',
      borderUpColor:  '#d4d4d4',
      borderDownColor:'#f87171',
      wickUpColor:    'rgba(212,212,212,0.55)',
      wickDownColor:  'rgba(248,113,113,0.55)',
    });

    seriesRef.current = series;
    chartRef.current  = chart;

    if (data.length > 0) {
      series.setData(data);
      chart.timeScale().fitContent();
    }

    if (onCrosshair) {
      chart.subscribeCrosshairMove(param => {
        if (param.time) {
          const price = param.seriesData?.get(series);
          onCrosshair({ time: param.time, price: price || null });
        } else {
          onCrosshair(null);
        }
      });
    }

    // Resize observer — handles both width and height changes
    const ro = new ResizeObserver(() => {
      if (!el || !chartRef.current) return;
      const newH = fillContainer ? el.clientHeight : height;
      chartRef.current.applyOptions({
        width:  el.clientWidth,
        height: newH || 320,
      });
    });
    ro.observe(el);

    return () => { ro.disconnect(); chart.remove(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fillContainer, height]);

  // Update data when it changes
  useEffect(() => {
    if (!seriesRef.current || !data.length) return;
    seriesRef.current.setData(data);
    chartRef.current?.timeScale().fitContent();
  }, [data]);

  return (
    <div
      ref={containerRef}
      style={{
        width:  '100%',
        height: fillContainer ? '100%' : height,
      }}
    />
  );
}
