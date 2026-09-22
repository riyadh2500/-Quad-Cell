import { useEffect, useRef } from 'react';
import { createChart } from 'lightweight-charts';

export default function CandlestickChart({ data = [], height = 360, onCrosshair }) {
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
        textColor: 'rgba(255,255,255,0.45)',
        fontSize: 11,
        fontFamily: 'Inter, sans-serif',
      },
      grid: {
        vertLines: { color: 'rgba(232,224,208,0.05)' },
        horzLines: { color: 'rgba(232,224,208,0.05)' },
      },
      crosshair: {
        mode: 1,
        vertLine: { color: 'rgba(232,224,208,0.3)', style: 0, width: 1 },
        horzLine: { color: 'rgba(232,224,208,0.3)', style: 0, width: 1 },
      },
      rightPriceScale: {
        borderColor: 'rgba(232,224,208,0.1)',
        scaleMargins: { top: 0.1, bottom: 0.1 },
      },
      timeScale: {
        borderColor: 'rgba(232,224,208,0.1)',
        timeVisible: true,
        secondsVisible: false,
      },
    });

    const series = chart.addCandlestickSeries({
      upColor: '#e8e0d0',
      downColor: '#f87171',
      borderUpColor: '#e8e0d0',
      borderDownColor: '#f87171',
      wickUpColor: 'rgba(232,224,208,0.6)',
      wickDownColor: 'rgba(248,113,113,0.6)',
    });

    seriesRef.current = series;
    chartRef.current = chart;

    if (data.length > 0) series.setData(data);

    if (onCrosshair) {
      chart.subscribeCrosshairMove(param => {
        if (param.time && seriesRef.current) {
          const price = param.seriesData?.get(seriesRef.current);
          onCrosshair({ time: param.time, price });
        }
      });
    }

    const ro = new ResizeObserver(() => {
      if (containerRef.current && chartRef.current) {
        chartRef.current.applyOptions({ width: containerRef.current.clientWidth });
      }
    });
    ro.observe(containerRef.current);

    return () => { ro.disconnect(); chart.remove(); };
  }, [height]);

  useEffect(() => {
    if (seriesRef.current && data.length > 0) {
      seriesRef.current.setData(data);
    }
  }, [data]);

  return <div ref={containerRef} style={{ width: '100%', height }} />;
}
