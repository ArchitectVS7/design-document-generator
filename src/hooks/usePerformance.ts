import { useEffect, useState } from 'react';

interface PerformanceMetrics {
  loadTime: number | null;
  renderTime: number | null;
  chunkLoadTimes: Record<string, number>;
  memoryUsage: number | null;
}

interface WebVitals {
  CLS: number | null;
  FID: number | null;
  LCP: number | null;
}

export const usePerformance = () => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    loadTime: null,
    renderTime: null,
    chunkLoadTimes: {},
    memoryUsage: null,
  });

  const [webVitals, setWebVitals] = useState<WebVitals>({
    CLS: null,
    FID: null,
    LCP: null,
  });

  useEffect(() => {
    // Measure initial load performance (simplified)
    const measureLoadTime = () => {
      if (typeof window !== 'undefined' && window.performance) {
        const timing = window.performance.timing;
        if (timing) {
          const loadTime = timing.loadEventEnd - timing.navigationStart;
          setMetrics(prev => ({ ...prev, loadTime }));
        }
      }
    };

    // Measure component render time
    const startTime = performance.now();
    
    const measureRenderTime = () => {
      const renderTime = performance.now() - startTime;
      setMetrics(prev => ({ ...prev, renderTime }));
    };

    // Measure memory usage (if available)
    const measureMemoryUsage = () => {
      try {
        // @ts-ignore - memory API may not be available in all browsers
        if (window.performance && window.performance.memory) {
          // @ts-ignore
          const memoryUsage = window.performance.memory.usedJSHeapSize;
          setMetrics(prev => ({ ...prev, memoryUsage }));
        }
      } catch (e) {
        // Memory API not available
      }
    };

    // Monitor chunk loading (simplified)
    const observeChunkLoads = () => {
      try {
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            const resourceEntry = entry as PerformanceResourceTiming;
            if (resourceEntry.initiatorType === 'script') {
              const url = new URL(resourceEntry.name);
              const fileName = url.pathname.split('/').pop();
              if (fileName && fileName.includes('-')) {
                const chunkName = fileName.split('-')[0];
                setMetrics(prev => ({
                  ...prev,
                  chunkLoadTimes: {
                    ...prev.chunkLoadTimes,
                    [chunkName]: resourceEntry.duration
                  }
                }));
              }
            }
          }
        });

        observer.observe({ entryTypes: ['resource'] });
        return () => observer.disconnect();
      } catch (e) {
        return () => {}; // No-op cleanup
      }
    };

    // Web Vitals measurement (simplified)
    const measureWebVitals = () => {
      // Largest Contentful Paint
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        setWebVitals(prev => ({ ...prev, LCP: lastEntry.startTime }));
      });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

      // First Input Delay
      const fidObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          // @ts-ignore
          setWebVitals(prev => ({ ...prev, FID: entry.processingStart - entry.startTime }));
        }
      });
      fidObserver.observe({ entryTypes: ['first-input'] });

      // Cumulative Layout Shift
      let clsValue = 0;
      const clsObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          // @ts-ignore
          if (!entry.hadRecentInput) {
            // @ts-ignore
            clsValue += entry.value;
            setWebVitals(prev => ({ ...prev, CLS: clsValue }));
          }
        }
      });
      clsObserver.observe({ entryTypes: ['layout-shift'] });

      return () => {
        lcpObserver.disconnect();
        fidObserver.disconnect();
        clsObserver.disconnect();
      };
    };

    // Run measurements
    measureLoadTime();
    measureRenderTime();
    measureMemoryUsage();
    
    const cleanup1 = observeChunkLoads();
    const cleanup2 = measureWebVitals();

    // Log performance in development
    if (process.env.NODE_ENV === 'development') {
      console.group('🚀 Performance Metrics');
      console.log('Load Time:', metrics.loadTime ? `${metrics.loadTime.toFixed(2)}ms` : 'Measuring...');
      console.log('Render Time:', metrics.renderTime ? `${metrics.renderTime.toFixed(2)}ms` : 'Measuring...');
      console.log('Memory Usage:', metrics.memoryUsage ? `${(metrics.memoryUsage / 1024 / 1024).toFixed(2)}MB` : 'Not available');
      console.groupEnd();
    }

    return () => {
      cleanup1();
      cleanup2();
    };
  }, []);

  const reportPerformance = () => {
    console.group('📊 Performance Report');
    console.table({
      'Load Time (ms)': metrics.loadTime?.toFixed(2) || 'N/A',
      'Render Time (ms)': metrics.renderTime?.toFixed(2) || 'N/A',
      'Memory Usage (MB)': metrics.memoryUsage ? (metrics.memoryUsage / 1024 / 1024).toFixed(2) : 'N/A',
      'LCP (ms)': webVitals.LCP?.toFixed(2) || 'N/A',
      'FID (ms)': webVitals.FID?.toFixed(2) || 'N/A',
      'CLS': webVitals.CLS?.toFixed(4) || 'N/A',
    });
    
    if (Object.keys(metrics.chunkLoadTimes).length > 0) {
      console.log('Chunk Load Times:');
      console.table(
        Object.fromEntries(
          Object.entries(metrics.chunkLoadTimes).map(([chunk, time]) => [
            chunk, `${time.toFixed(2)}ms`
          ])
        )
      );
    }
    console.groupEnd();
  };

  return {
    metrics,
    webVitals,
    reportPerformance,
  };
};