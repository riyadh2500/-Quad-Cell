import { useEffect, useRef } from 'react';
import { createChart } from 'lightweight-charts';

export default function LineChart({ data = [], height = 120, color = '#e8e0d0', areaColor, label }) {
  const containerRef = useRef(null);
  const chartRef = useRef(null);
  const seriesRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const chart = createChart(containerRef.current, {
      width: containerRef.current.clientWidth,
      height,
      layout: {
        background: { color: 'transparent' },
        textColor: 'rgba(255,255,255,0.35)',
        fontSize: 10,
        fontFamily: 'Inter, sans-serif',
      },
      grid: {
        vertLines: { visible: false },
        horzLines: { color: 'rgba(232,224,208,0.04)' },
      },
      crosshair: {
        vertLine: { visible: false },
        horzLine: { color: 'rgba(232,224,208,0.2)', style: 0, width: 1 },
      },
      rightPriceScale: {
        borderColor: 'rgba(232,224,208,0.08)',
        scaleMargins: { top: 0.15, bottom: 0.1 },
      },
      timeScale: {
        borderColor: 'rgba(232,224,208,0.08)',
        timeVisible: true,
      },
      handleScroll: false,
      handleScale: false,
    });

    const series = chart.addAreaSeries({
      lineColor: color,
      topColor: areaColor || color.replace(')', ',0.18)').replace('rgb', 'rgba').replace('#e8e0d0', 'rgba(232,224,208,0.18)'),
      bottomColor: 'transparent',
      lineWidth: 2,
    });

    seriesRef.current = series;
    chartRef.current = chart;

    if (data.length > 0) series.setData(data);

    const ro = new ResizeObserver(() => {
      if (containerRef.current && chartRef.current) {
        chartRef.current.applyOptions({ width: containerRef.current.clientWidth });
      }
    });
    ro.observe(containerRef.current);

    return () => { ro.disconnect(); chart.remove(); };
  }, [height, color]);

  useEffect(() => {
    if (seriesRef.current && data.length > 0) seriesRef.current.setData(data);
  }, [data]);

  return (
    <div style={{ position: 'relative' }}>
      {label && <div style={{ position: 'absolute', top: 6, left: 8, fontSize: '0.7rem', color: 'var(--muted)', zIndex: 2, pointerEvents: 'none' }}>{label}</div>}
      <div ref={containerRef} style={{ width: '100%', height }} />
    </div>
  );
}
