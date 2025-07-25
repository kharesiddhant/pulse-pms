'use client';

import React, { useEffect, useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { DashboardParams } from '@/services/dashboardService';
import { config } from '@/config';

// Dynamically import ApexCharts to avoid SSR issues
const Chart = dynamic(() => import('react-apexcharts'), { ssr: false });

interface ChartData {
  series: Array<{
    name: string;
    data: number[];
  }>;
  categories: string[];
  period: string;
  time_label?: string;
}

interface BranchPerformanceChartProps {
  filterParams: DashboardParams;
}

const BranchPerformanceChart: React.FC<BranchPerformanceChartProps> = ({ filterParams }) => {
  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Theme detection effect
  useEffect(() => {
    const detectTheme = () => {
      if (typeof window !== 'undefined') {
        const darkMode = document.documentElement.classList.contains('dark');
        setIsDarkMode(darkMode);
      }
    };

    // Initial detection
    detectTheme();

    // Watch for theme changes
    const observer = new MutationObserver(detectTheme);
    if (typeof window !== 'undefined') {
      observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['class']
      });
    }

    return () => observer.disconnect();
  }, []);

  const fetchChartData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const token = document.cookie
        .split('; ')
        .find(row => row.startsWith('accessToken='))
        ?.split('=')[1];

      if (!token) {
        throw new Error('No access token found');
      }

      // Build query parameters
      const queryParams = new URLSearchParams();
      if (filterParams.branch_id) {
        queryParams.append('branch_id', filterParams.branch_id.toString());
      }
      if (filterParams.period) {
        queryParams.append('period', filterParams.period);
      }

      const url = `${config.apiBaseUrl}/dashboard/chart-data${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        console.log('Chart data received:', result.data);
        setChartData(result.data);
      } else {
        throw new Error(result.message || 'Failed to fetch chart data');
      }
    } catch (err) {
      console.error('Error fetching chart data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch chart data');
    } finally {
      setIsLoading(false);
    }
  }, [filterParams]);

  useEffect(() => {
    fetchChartData();
  }, [fetchChartData]); // Only depend on fetchChartData since filterParams is already in its dependencies

  // Use state-based theme detection with fallback
  const textColor = isDarkMode ? '#ffffff' : '#374151';
  const gridColor = isDarkMode ? '#4b5563' : '#e5e7eb';

  // Dynamic formatting function for Y-axis values
  const formatYAxisValue = (value: number) => {
    // Value is now in actual rupees from the API
    if (value >= 100000) {
      // 1 lakh or more - show in lakhs with one decimal
      return `₹${(value / 100000).toFixed(1)}L`;
    } else if (value >= 1000) {
      // 1 thousand or more but less than 1 lakh - show in thousands with one decimal
      return `₹${(value / 1000).toFixed(1)}K`;
    } else {
      // Less than 1 thousand - show as is (no decimals)
      return `₹${Math.round(value)}`;
    }
  };

  const chartOptions = {
    chart: {
      type: 'line' as const,
      height: 350,
      toolbar: {
        show: true,
        tools: {
          download: true,
          selection: false,
          zoom: true,
          zoomin: true,
          zoomout: true,
          pan: true,
          reset: true,
        },
      },
      background: 'transparent',
      animations: {
        enabled: true,
        easing: 'easeinout' as const,
        speed: 800,
      },
    },
    colors: ['#ef4444', '#3b82f6', '#10b981', '#f59e0b'], // Red, Blue, Green, Yellow
    dataLabels: {
      enabled: false,
    },
    stroke: {
      width: 3,
      curve: 'smooth' as const,
    },
    grid: {
      borderColor: gridColor,
      strokeDashArray: 4,
      xaxis: {
        lines: {
          show: true,
        },
      },
      yaxis: {
        lines: {
          show: true,
        },
      },
    },
    xaxis: {
      categories: chartData?.categories || [],
      labels: {
        style: {
          colors: textColor,
          fontSize: '12px',
          fontWeight: '400',
        },
      },
      axisBorder: {
        color: gridColor,
      },
      axisTicks: {
        color: gridColor,
      },
    },
    yaxis: {
      labels: {
        style: {
          colors: textColor,
          fontSize: '12px',
          fontWeight: '400',
        },
        formatter: formatYAxisValue,
      },
      axisBorder: {
        color: gridColor,
      },
      // Dynamic Y-axis based on data
      forceNiceScale: true,
      tickAmount: 5,
    },
    legend: {
      position: 'bottom' as const,
      horizontalAlign: 'left' as const,
      fontSize: '14px',
      fontWeight: 500,
      labels: {
        colors: textColor,
      },
      markers: {
        size: 8,
        strokeWidth: 0,
        strokeColor: 'transparent',
        fillColors: undefined,
        radius: 12,
        shape: 'circle' as const,
        offsetX: 0,
        offsetY: 0,
      },
      itemMargin: {
        horizontal: 20,
        vertical: 8,
      },
    },
    tooltip: {
      theme: isDarkMode ? 'dark' : 'light',
      style: {
        fontSize: '12px',
        fontFamily: 'inherit',
      },
      x: {
        show: true,
        formatter: function(value: number, { dataPointIndex, w }: { dataPointIndex: number; w: { globals: { categoryLabels?: string[] } } }) {
          // Get the category label for this data point
          const categories = w.globals.categoryLabels || [];
          const label = categories[dataPointIndex] || String(value);
          
          // Add context based on the period
          if (filterParams.period === 'today') {
            return `Time: ${label}`;
          } else if (filterParams.period === 'week') {
            return `Day: ${label}`;
          } else if (filterParams.period === 'month') {
            return `Date: ${label}`;
          } else if (filterParams.period === 'year') {
            return `Month: ${label}`;
          } else {
            return String(label);
          }
        },
      },
      y: {
        formatter: (value: number, { seriesName }: { seriesName: string }) => {
          return formatYAxisValue(value);
        },
        title: {
          formatter: (seriesName: string) => `${seriesName}: `,
        },
      },
      marker: {
        show: true,
      },
      shared: true,
      intersect: false,
      followCursor: true,
    },
    markers: {
      size: 0,
      strokeWidth: 2,
      strokeColors: '#ffffff',
      hover: {
        size: 6,
        sizeOffset: 2,
      },
    },
    responsive: [
      {
        breakpoint: 768,
        options: {
          chart: {
            height: 300,
          },
          legend: {
            position: 'bottom' as const,
            horizontalAlign: 'center' as const,
          },
        },
      },
    ],
  };

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">Branch performance</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">Modalities per time</p>
          </div>
          <div className="flex items-center space-x-2 bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded">
            <span className="text-sm text-gray-600 dark:text-gray-300">Line Chart</span>
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">Branch performance</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">Modalities per time</p>
          </div>
        </div>
        <div className="flex items-center justify-center h-64">
          <p className="text-red-500">Error: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">Branch performance</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Modalities per time</p>
        </div>
        <div className="flex items-center space-x-2 bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded">
          <span className="text-sm text-gray-600 dark:text-gray-300">Line Chart</span>
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
      
      {chartData && chartData.series && chartData.series.length > 0 ? (
        <Chart
          options={chartOptions}
          series={chartData.series}
          type="line"
          height={350}
        />
      ) : chartData && chartData.series && chartData.series.length === 0 ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-gray-500 dark:text-gray-400 mb-2">No data available for the selected period</p>
            <p className="text-sm text-gray-400 dark:text-gray-500">Try selecting a different time period or check if there are any patient entries.</p>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      )}
    </div>
  );
};

export default BranchPerformanceChart; 