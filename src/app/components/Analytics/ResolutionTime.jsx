'use client';
import { Bar, Doughnut } from 'react-chartjs-2';
import { Chart, registerables } from 'chart.js';
import { useState, useEffect } from 'react';
import { 
  differenceInHours, 
  differenceInDays, 
  format, 
  parseISO 
} from 'date-fns';
import { 
  FiClock, 
  FiTrendingUp, 
  FiAlertCircle, 
  FiCheckCircle, 
  FiChevronDown,
  FiBarChart2,
  FiCalendar
} from 'react-icons/fi';

Chart.register(...registerables);

const ResolutionTime = ({ tickets }) => {
  const [isClient, setIsClient] = useState(false);
  const [timeFrame, setTimeFrame] = useState('30d');
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  useEffect(() => {
    setIsClient(true);
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setIsDarkMode(true);
    }
  }, []);

  // Filter resolved tickets based on time frame
  const resolvedTickets = tickets.filter(t => t.status === 'resolved' || t.status === 'closed');
  
  // Calculate resolution times
  const resolutionTimes = resolvedTickets.map(ticket => {
    const created = new Date(ticket.createdAt);
    const resolved = new Date(ticket.resolvedAt || ticket.updatedAt);
    return differenceInHours(resolved, created);
  });

  // Calculate statistics
  const avgHours = resolutionTimes.length > 0 
    ? resolutionTimes.reduce((sum, hours) => sum + hours, 0) / resolutionTimes.length 
    : 0;
  
  const minHours = resolutionTimes.length > 0 ? Math.min(...resolutionTimes) : 0;
  const maxHours = resolutionTimes.length > 0 ? Math.max(...resolutionTimes) : 0;
  
  // Categorize resolution times
  const timeCategories = [
    { label: '< 1 day', max: 24, count: 0 },
    { label: '1-2 days', max: 48, count: 0 },
    { label: '2-3 days', max: 72, count: 0 },
    { label: '3-7 days', max: 168, count: 0 },
    { label: '> 7 days', max: Infinity, count: 0 }
  ];

  resolutionTimes.forEach(hours => {
    for (let category of timeCategories) {
      if (hours <= category.max) {
        category.count++;
        break;
      }
    }
  });

  // Prepare data for horizontal bar chart
  const barData = {
    labels: ['Average Resolution Time'],
    datasets: [{
      label: 'Hours',
      data: [avgHours.toFixed(1)],
      backgroundColor: 'rgba(59, 130, 246, 0.8)',
      borderColor: 'rgb(59, 130, 246)',
      borderWidth: 2,
      borderRadius: 6,
      hoverBackgroundColor: 'rgba(59, 130, 246, 1)'
    }]
  };

  // Prepare data for doughnut chart
  const doughnutData = {
    labels: timeCategories.map(c => c.label),
    datasets: [{
      data: timeCategories.map(c => c.count),
      backgroundColor: [
        'rgba(16, 185, 129, 0.8)', // Green - < 1 day
        'rgba(101, 163, 13, 0.8)',  // Lime - 1-2 days
        'rgba(234, 179, 8, 0.8)',   // Yellow - 2-3 days
        'rgba(245, 158, 11, 0.8)',  // Amber - 3-7 days
        'rgba(239, 68, 68, 0.8)'    // Red - > 7 days
      ],
      borderColor: [
        'rgb(16, 185, 129)',
        'rgb(101, 163, 13)',
        'rgb(234, 179, 8)',
        'rgb(245, 158, 11)',
        'rgb(239, 68, 68)'
      ],
      borderWidth: 2,
      hoverOffset: 12
    }]
  };

  const barOptions = {
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        backgroundColor: isDarkMode ? 'rgba(31, 41, 55, 0.9)' : 'rgba(255, 255, 255, 0.95)',
        titleColor: isDarkMode ? '#F9FAFB' : '#1F2937',
        bodyColor: isDarkMode ? '#F9FAFB' : '#4B5563',
        borderColor: isDarkMode ? '#4B5563' : '#E5E7EB',
        borderWidth: 1,
        padding: 12,
        boxPadding: 6,
        callbacks: {
          label: function(context) {
            return `Average: ${context.raw} hours`;
          }
        }
      }
    },
    scales: {
      x: {
        beginAtZero: true,
        grid: {
          color: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
          drawBorder: false
        },
        ticks: {
          color: isDarkMode ? '#9CA3AF' : '#6B7280',
          font: {
            size: 12
          }
        }
      },
      y: {
        grid: {
          display: false,
          drawBorder: false
        },
        ticks: {
          color: isDarkMode ? '#9CA3AF' : '#6B7280',
          font: {
            size: 12,
            weight: '500'
          }
        }
      }
    },
    animation: {
      duration: 1000,
      easing: 'easeOutQuart'
    }
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '70%',
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: isDarkMode ? '#9CA3AF' : '#6B7280',
          padding: 20,
          usePointStyle: true,
          pointStyle: 'circle'
        }
      },
      tooltip: {
        backgroundColor: isDarkMode ? 'rgba(31, 41, 55, 0.9)' : 'rgba(255, 255, 255, 0.95)',
        titleColor: isDarkMode ? '#F9FAFB' : '#1F2937',
        bodyColor: isDarkMode ? '#F9FAFB' : '#4B5563',
        borderColor: isDarkMode ? '#4B5563' : '#E5E7EB',
        borderWidth: 1,
        padding: 12,
        boxPadding: 6,
        callbacks: {
          label: function(context) {
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = Math.round((context.raw / total) * 100);
            return `${context.label}: ${context.raw} tickets (${percentage}%)`;
          }
        }
      }
    },
    animation: {
      animateScale: true,
      animateRotate: true,
      duration: 1000,
      easing: 'easeOutQuart'
    }
  };

  if (!isClient) {
    return (
      <div className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-md rounded-xl border border-gray-200/50 dark:border-gray-700/50 shadow-sm p-6 h-96 flex items-center justify-center">
        <div className="text-gray-500 dark:text-gray-400">Loading resolution metrics...</div>
      </div>
    );
  }

  return (
    <div className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-md rounded-xl border border-gray-200/50 dark:border-gray-700/50 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-6 py-5 border-b border-gray-200/50 dark:border-gray-700/50">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
              <FiClock className="mr-2 text-blue-500" size={20} />
              Resolution Time Analytics
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Performance metrics for ticket resolution
            </p>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <div className="relative">
              <select
                value={timeFrame}
                onChange={(e) => setTimeFrame(e.target.value)}
                className="pl-9 pr-8 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-sm text-gray-700 dark:text-gray-300 bg-white/50 dark:bg-gray-700/50 focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
              >
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
                <option value="6m">Last 6 months</option>
                <option value="1y">Last year</option>
              </select>
              <FiCalendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <FiChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            </div>
          </div>
        </div>
        
        {/* Stats Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div className="bg-gray-50/50 dark:bg-gray-700/50 backdrop-blur-sm p-4 rounded-lg border border-gray-100/50 dark:border-gray-600/50">
            <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
              <FiClock className="mr-1" size={14} /> Average
            </p>
            <p className="text-2xl font-semibold text-gray-900 dark:text-white">
              {avgHours.toFixed(1)} <span className="text-sm font-normal text-gray-500">hours</span>
            </p>
          </div>
          <div className="bg-gray-50/50 dark:bg-gray-700/50 backdrop-blur-sm p-4 rounded-lg border border-gray-100/50 dark:border-gray-600/50">
            <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
              <FiTrendingUp className="mr-1" size={14} /> Fastest
            </p>
            <p className="text-2xl font-semibold text-gray-900 dark:text-white">
              {minHours.toFixed(1)} <span className="text-sm font-normal text-gray-500">hours</span>
            </p>
          </div>
          <div className="bg-gray-50/50 dark:bg-gray-700/50 backdrop-blur-sm p-4 rounded-lg border border-gray-100/50 dark:border-gray-600/50">
            <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
              <FiAlertCircle className="mr-1" size={14} /> Longest
            </p>
            <p className="text-2xl font-semibold text-gray-900 dark:text-white">
              {maxHours.toFixed(1)} <span className="text-sm font-normal text-gray-500">hours</span>
            </p>
          </div>
          <div className="bg-gray-50/50 dark:bg-gray-700/50 backdrop-blur-sm p-4 rounded-lg border border-gray-100/50 dark:border-gray-600/50">
            <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
              <FiCheckCircle className="mr-1" size={14} /> Resolved
            </p>
            <p className="text-2xl font-semibold text-gray-900 dark:text-white">
              {resolvedTickets.length} <span className="text-sm font-normal text-gray-500">tickets</span>
            </p>
          </div>
        </div>
      </div>
      
      {/* Charts Container */}
      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Average Resolution Time Chart */}
          <div className="bg-gray-50/30 dark:bg-gray-700/30 backdrop-blur-sm rounded-lg p-4 border border-gray-100/50 dark:border-gray-600/50">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center">
              <FiBarChart2 className="mr-2 text-blue-500" size={18} />
              Average Resolution Time
            </h3>
            <div className="h-64">
              <Bar data={barData} options={barOptions} />
            </div>
          </div>
          
          {/* Resolution Time Distribution Chart */}
          <div className="bg-gray-50/30 dark:bg-gray-700/30 backdrop-blur-sm rounded-lg p-4 border border-gray-100/50 dark:border-gray-600/50">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center">
              <FiClock className="mr-2 text-blue-500" size={18} />
              Resolution Time Distribution
            </h3>
            <div className="h-64 relative">
              <Doughnut data={doughnutData} options={doughnutOptions} />
              <div className="absolute inset-0 flex items-center justify-center flex-col">
                <span className="text-2xl font-bold text-gray-900 dark:text-white">
                  {resolvedTickets.length}
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  Resolved Tickets
                </span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Performance Indicator */}
        <div className="mt-6 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 p-4 rounded-lg border border-blue-100/50 dark:border-blue-700/30">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <FiTrendingUp className="h-5 w-5 text-blue-500" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">
                Performance Insight
              </h3>
              <div className="mt-2 text-sm text-blue-700 dark:text-blue-300">
                <p>
                  {avgHours < 24 
                    ? 'Excellent! Your average resolution time is under 24 hours.' 
                    : avgHours < 72 
                    ? 'Good performance. Consider implementing strategies to resolve tickets faster.'
                    : 'There is room for improvement. Focus on reducing resolution times for better customer satisfaction.'
                  }
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResolutionTime;