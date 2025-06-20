import React, { useState, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler,
} from 'chart.js';
import { Line, Pie } from 'react-chartjs-2';
import { format } from 'date-fns';
import Goals from './Goals';
import FinancialOverview from './FinancialOverview';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler
);

// Custom crosshair plugin
const crosshairPlugin = {
  id: 'crosshair',
  afterDatasetsDraw: (chart) => {
    if (chart.tooltip._active && chart.tooltip._active.length) {
      const ctx = chart.ctx;
      const activePoint = chart.tooltip._active[0];
      const x = activePoint.element.x;
      const y = activePoint.element.y;
      const topY = chart.scales.y.top;
      const bottomY = chart.scales.y.bottom;
      const leftX = chart.scales.x.left;
      const rightX = chart.scales.x.right;

      // Detect dark mode
      const isDarkMode = document.documentElement.classList.contains('dark');
      const crosshairColor = isDarkMode ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.3)';

      // Draw vertical line
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(x, topY);
      ctx.lineTo(x, bottomY);
      ctx.lineWidth = 1;
      ctx.strokeStyle = crosshairColor;
      ctx.setLineDash([5, 5]);
      ctx.stroke();
      ctx.restore();

      // Draw horizontal line
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(leftX, y);
      ctx.lineTo(rightX, y);
      ctx.lineWidth = 1;
      ctx.strokeStyle = crosshairColor;
      ctx.setLineDash([5, 5]);
      ctx.stroke();
      ctx.restore();
    }
  }
};

// Register the crosshair plugin
ChartJS.register(crosshairPlugin);

const MainDashboard = ({ summaryStats, netWorthHistory }) => {
  const [chartView, setChartView] = useState('line'); // 'line', 'pie', or 'step'
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [dateRange, setDateRange] = useState('all'); // 'all', '30d', '3m', '6m', '1y'
  
  // Check if we're in dark mode and update when it changes
  useEffect(() => {
    const checkDarkMode = () => {
      setIsDarkMode(document.documentElement.classList.contains('dark'));
    };
    
    // Check initially
    checkDarkMode();
    
    // Create observer to watch for class changes on html element
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });
    
    return () => observer.disconnect();
  }, []);
  
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatNumber = (amount) => {
    return new Intl.NumberFormat('en-US').format(amount);
  };

  const formatCurrencyValue = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  // Filter net worth history based on selected date range
  const getFilteredHistory = () => {
    if (dateRange === 'all') return netWorthHistory;
    
    const now = new Date();
    let cutoffDate;
    
    switch (dateRange) {
      case '30d':
        cutoffDate = new Date(now.setDate(now.getDate() - 30));
        break;
      case '3m':
        cutoffDate = new Date(now.setMonth(now.getMonth() - 3));
        break;
      case '6m':
        cutoffDate = new Date(now.setMonth(now.getMonth() - 6));
        break;
      case '1y':
        cutoffDate = new Date(now.setFullYear(now.getFullYear() - 1));
        break;
      default:
        return netWorthHistory;
    }
    
    return netWorthHistory.filter(entry => new Date(entry.date) >= cutoffDate);
  };

  const filteredHistory = getFilteredHistory();

  // Create gradient for Net Worth line
  const createGradient = (ctx, chartArea) => {
    const gradient = ctx.createLinearGradient(0, chartArea.bottom, 0, chartArea.top);
    gradient.addColorStop(0, 'rgba(59, 130, 246, 0.05)');
    gradient.addColorStop(0.5, 'rgba(59, 130, 246, 0.15)');
    gradient.addColorStop(1, 'rgba(59, 130, 246, 0.3)');
    return gradient;
  };

  // Prepare chart data
  const chartData = {
    labels: filteredHistory.map(entry => {
      // Parse the date string directly to avoid timezone issues
      const dateParts = entry.date.split('-');
      const year = parseInt(dateParts[0]);
      const month = parseInt(dateParts[1]) - 1; // Month is 0-indexed
      const day = parseInt(dateParts[2]);
      const date = new Date(year, month, day);
      return format(date, 'MMM dd');
    }),
    datasets: [
      {
        label: 'Net Worth',
        data: filteredHistory.map(entry => entry.netWorth),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: function(context) {
          const chart = context.chart;
          const {ctx, chartArea} = chart;
          if (!chartArea) {
            return null;
          }
          return createGradient(ctx, chartArea);
        },
        borderWidth: 3,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: 'rgb(59, 130, 246)',
        pointBorderColor: 'white',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
      {
        label: 'Total Assets',
        data: filteredHistory.map(entry => entry.totalAssets),
        borderColor: 'rgb(34, 197, 94)',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        borderWidth: 2,
        fill: false,
        tension: 0.4,
        pointBackgroundColor: 'rgb(34, 197, 94)',
        pointBorderColor: 'white',
        pointBorderWidth: 2,
        pointRadius: 3,
        pointHoverRadius: 5,
      },
      {
        label: 'Total Liabilities',
        data: filteredHistory.map(entry => entry.totalLiabilities),
        borderColor: 'rgb(239, 68, 68)',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        borderWidth: 2,
        fill: false,
        tension: 0.4,
        pointBackgroundColor: 'rgb(239, 68, 68)',
        pointBorderColor: 'white',
        pointBorderWidth: 2,
        pointRadius: 3,
        pointHoverRadius: 5,
      },
      {
        label: 'Total Debt',
        data: filteredHistory.map(entry => entry.totalDebt),
        borderColor: 'rgb(245, 158, 11)',
        backgroundColor: 'rgba(245, 158, 11, 0.1)',
        borderWidth: 2,
        fill: false,
        tension: 0.4,
        pointBackgroundColor: 'rgb(245, 158, 11)',
        pointBorderColor: 'white',
        pointBorderWidth: 2,
        pointRadius: 3,
        pointHoverRadius: 5,
      },
    ],
  };

  // Prepare step chart data
  const stepChartData = {
    labels: filteredHistory.map(entry => {
      // Parse the date string directly to avoid timezone issues
      const dateParts = entry.date.split('-');
      const year = parseInt(dateParts[0]);
      const month = parseInt(dateParts[1]) - 1; // Month is 0-indexed
      const day = parseInt(dateParts[2]);
      const date = new Date(year, month, day);
      return format(date, 'MMM dd');
    }),
    datasets: [
      {
        label: 'Net Worth',
        data: filteredHistory.map(entry => entry.netWorth),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: function(context) {
          const chart = context.chart;
          const {ctx, chartArea} = chart;
          if (!chartArea) {
            return null;
          }
          return createGradient(ctx, chartArea);
        },
        borderWidth: 3,
        fill: true,
        stepped: true,
        pointBackgroundColor: 'rgb(59, 130, 246)',
        pointBorderColor: 'white',
        pointBorderWidth: 2,
        pointRadius: 5,
        pointHoverRadius: 7,
      },
      {
        label: 'Total Assets',
        data: filteredHistory.map(entry => entry.totalAssets),
        borderColor: 'rgb(34, 197, 94)',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        borderWidth: 2,
        fill: false,
        stepped: true,
        pointBackgroundColor: 'rgb(34, 197, 94)',
        pointBorderColor: 'white',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
      {
        label: 'Total Liabilities',
        data: filteredHistory.map(entry => entry.totalLiabilities),
        borderColor: 'rgb(239, 68, 68)',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        borderWidth: 2,
        fill: false,
        stepped: true,
        pointBackgroundColor: 'rgb(239, 68, 68)',
        pointBorderColor: 'white',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
      {
        label: 'Total Debt',
        data: filteredHistory.map(entry => entry.totalDebt),
        borderColor: 'rgb(245, 158, 11)',
        backgroundColor: 'rgba(245, 158, 11, 0.1)',
        borderWidth: 2,
        fill: false,
        stepped: true,
        pointBackgroundColor: 'rgb(245, 158, 11)',
        pointBorderColor: 'white',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
      },
    ],
  };

  // Light mode chart options
  const lightChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      crosshair: {
        enabled: true,
      },
      legend: {
        position: 'top',
        labels: {
          color: '#374151',
          usePointStyle: true,
          pointStyle: 'circle',
        },
      },
      title: {
        display: true,
        text: 'Net Worth Over Time',
        font: {
          size: 18,
          weight: 'bold',
        },
        color: '#374151',
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            return `${context.dataset.label}: ${formatCurrency(context.parsed.y)}`;
          },
        },
      },
    },
    scales: {
      x: {
        ticks: {
          color: '#6b7280',
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
          drawBorder: false,
        },
      },
      y: {
        beginAtZero: false,
        ticks: {
          callback: function(value) {
            return formatCurrency(value);
          },
          color: '#6b7280',
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
          drawBorder: false,
        },
      },
    },
  };

  // Dark mode chart options
  const darkChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      crosshair: {
        enabled: true,
      },
      legend: {
        position: 'top',
        labels: {
          color: '#ffffff',
          usePointStyle: true,
          pointStyle: 'circle',
        },
      },
      title: {
        display: true,
        text: 'Net Worth Over Time',
        font: {
          size: 18,
          weight: 'bold',
        },
        color: '#ffffff',
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            return `${context.dataset.label}: ${formatCurrency(context.parsed.y)}`;
          },
        },
      },
    },
    scales: {
      x: {
        ticks: {
          color: '#d1d5db',
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.2)',
          drawBorder: false,
        },
      },
      y: {
        beginAtZero: false,
        ticks: {
          callback: function(value) {
            return formatCurrency(value);
          },
          color: '#d1d5db',
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.2)',
          drawBorder: false,
        },
      },
    },
  };

  // Select appropriate chart options based on dark mode
  const chartOptions = isDarkMode ? darkChartOptions : lightChartOptions;

  // Prepare pie chart data
  const pieData = [
    { label: 'Assets', value: summaryStats.totalAssets, color: 'rgba(34, 197, 94, 0.8)', borderColor: 'rgb(34, 197, 94)' },
    { label: 'Liabilities', value: summaryStats.totalLiabilities, color: 'rgba(239, 68, 68, 0.8)', borderColor: 'rgb(239, 68, 68)' },
    { label: 'Debt', value: summaryStats.totalDebt, color: 'rgba(245, 158, 11, 0.8)', borderColor: 'rgb(245, 158, 11)' },
  ].filter(item => item.value > 0);

  const pieChartData = {
    labels: pieData.map(item => item.label),
    datasets: [
      {
        data: pieData.map(item => item.value),
        backgroundColor: pieData.map(item => item.color),
        borderColor: pieData.map(item => item.borderColor),
        borderWidth: 2,
      },
    ],
  };

  const pieChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          padding: 20,
          usePointStyle: true,
        },
      },
      title: {
        display: true,
        text: 'Current Financial Breakdown',
        font: {
          size: 18,
          weight: 'bold',
        },
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = ((context.parsed / total) * 100).toFixed(1);
            return `${context.label}: ${formatNumber(context.parsed)} (${percentage}%)`;
          },
        },
      },
    },
  };

  const StatCard = ({ title, value }) => (
    <div className="bg-white dark:bg-[#0f0f0f] rounded-xl shadow-sm dark:shadow-none border border-gray-200 dark:border-transparent p-6 shadow-card dark:shadow-card-none">
      <div className="text-center">
        <div className="inline-block">
          <p className="text-sm font-semibold text-gray-600 dark:text-gray-300 pb-2 border-b border-gray-200 dark:border-gray-600 mb-3 px-6">{title}</p>
        </div>
        <p className="text-3xl font-extrabold text-gray-900 dark:text-white">
          {formatCurrencyValue(value)}
        </p>
      </div>
    </div>
  );

  return (
    <div className="h-full overflow-y-auto bg-gray-50 dark:bg-[#191919]">
      <div className="p-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white font-serif">Net Worth Tracker</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-2">Track your financial progress over time</p>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Assets"
            value={summaryStats.totalAssets}
          />
          <StatCard
            title="Total Liabilities"
            value={summaryStats.totalLiabilities}
          />
          <StatCard
            title="Total Debt"
            value={summaryStats.totalDebt}
          />
          <StatCard
            title="Net Worth"
            value={summaryStats.netWorth}
          />
        </div>

        {/* Chart */}
        <div className="bg-white dark:bg-[#0f0f0f] rounded-xl shadow-sm dark:shadow-none border border-gray-200 dark:border-transparent p-6 shadow-card dark:shadow-card-none mb-8">
          {/* Chart Controls */}
          <div className="flex justify-between items-center mb-4">
            {/* Date Range Filter */}
            <div className="flex space-x-2">
              {[
                { key: 'all', label: 'All Time' },
                { key: '30d', label: '30 Days' },
                { key: '3m', label: '3 Months' },
                { key: '6m', label: '6 Months' },
                { key: '1y', label: '1 Year' }
              ].map((range) => (
                <button
                  key={range.key}
                  onClick={() => setDateRange(range.key)}
                  className={`px-3 py-1 rounded-md text-sm font-medium transition-colors outline-none focus:outline-none focus:ring-0 ${
                    dateRange === range.key
                      ? 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-white'
                      : 'bg-gray-50 dark:bg-transparent text-gray-500 dark:text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  {range.label}
                </button>
              ))}
            </div>

            {/* Chart Type Toggle */}
            <div className="flex space-x-2">
              <button
                onClick={() => setChartView('line')}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors outline-none focus:outline-none focus:ring-0 ${
                  chartView === 'line'
                    ? 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-white'
                    : 'bg-[#f8f9fa] dark:bg-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                }`}
              >
                Line Chart
              </button>
              <button
                onClick={() => setChartView('step')}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors outline-none focus:outline-none focus:ring-0 ${
                  chartView === 'step'
                    ? 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-white'
                    : 'bg-[#f8f9fa] dark:bg-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                }`}
              >
                Step Chart
              </button>
              <button
                onClick={() => setChartView('pie')}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors outline-none focus:outline-none focus:ring-0 ${
                  chartView === 'pie'
                    ? 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-white'
                    : 'bg-[#f8f9fa] dark:bg-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                }`}
              >
                Pie Chart
              </button>
            </div>
          </div>

          {/* Chart Content */}
          {chartView === 'line' ? (
            // Line Chart
            filteredHistory.length > 0 ? (
              <div className="h-96">
                <Line key="line-chart" data={chartData} options={chartOptions} />
              </div>
            ) : (
              <div className="h-96 flex items-center justify-center">
                <div className="text-center">
                  <svg className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                  </svg>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    {netWorthHistory.length === 0 ? 'No Data Yet' : 'No Data in Selected Range'}
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400">
                    {netWorthHistory.length === 0 
                      ? 'Add some financial items to see your net worth chart' 
                      : 'Try selecting a different date range or add more data points'
                    }
                  </p>
                </div>
              </div>
            )
          ) : chartView === 'step' ? (
            // Step Chart
            filteredHistory.length > 0 ? (
              <div className="h-96">
                <Line key="step-chart" data={stepChartData} options={chartOptions} />
              </div>
            ) : (
              <div className="h-96 flex items-center justify-center">
                <div className="text-center">
                  <svg className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                  </svg>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    {netWorthHistory.length === 0 ? 'No Data Yet' : 'No Data in Selected Range'}
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400">
                    {netWorthHistory.length === 0 
                      ? 'Add some financial items to see your step chart' 
                      : 'Try selecting a different date range or add more data points'
                    }
                  </p>
                </div>
              </div>
            )
          ) : (
            // Pie Chart
            pieData.length > 0 ? (
              <div className="h-96">
                <Pie key="pie-chart" data={pieChartData} options={pieChartOptions} />
              </div>
            ) : (
              <div className="h-96 flex items-center justify-center">
                <div className="text-center">
                  <svg className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Data Yet</h3>
                  <p className="text-gray-500 dark:text-gray-400">Add some financial items to see your breakdown</p>
                </div>
              </div>
            )
          )}
        </div>

        {/* Goals and Financial Overview Section */}
        <div className="flex justify-start space-x-6">
          <div className="w-96">
            <Goals summaryStats={summaryStats} />
          </div>
          <div className="w-96">
            <FinancialOverview summaryStats={summaryStats} netWorthHistory={netWorthHistory} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default MainDashboard; 