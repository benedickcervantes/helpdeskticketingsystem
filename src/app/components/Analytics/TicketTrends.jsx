'use client';
import { useState } from 'react';
import { Line } from 'react-chartjs-2';
import { Chart, registerables } from 'chart.js';
import { 
  format, 
  subDays, 
  startOfWeek, 
  startOfMonth, 
  eachWeekOfInterval, 
  eachMonthOfInterval 
} from 'date-fns';
import { FiTrendingUp, FiCalendar, FiBarChart2, FiChevronDown } from 'react-icons/fi';

Chart.register(...registerables);

const TicketTrends = ({ tickets }) => {
  const [timeRange, setTimeRange] = useState('30d'); // 7d, 30d, 90d, 6m, 1y
  const [chartType, setChartType] = useState('daily'); // daily, weekly, monthly

  // Generate data based on selected time range and chart type
  const generateChartData = () => {
    let labels = [];
    let dataPoints = [];
    const now = new Date();
    
    if (chartType === 'daily') {
      const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
      labels = Array.from({ length: days }, (_, i) => 
        format(subDays(now, days - 1 - i), 'MMM dd')
      );
      
      const dailyCounts = tickets.reduce((acc, ticket) => {
        const date = format(new Date(ticket.createdAt), 'MMM dd');
        acc[date] = (acc[date] || 0) + 1;
        return acc;
      }, {});
      
      dataPoints = labels.map(date => dailyCounts[date] || 0);
    } 
    else if (chartType === 'weekly') {
      const weeks = timeRange === '6m' ? 26 : 52;
      const startDate = subDays(now, weeks * 7);
      const weekIntervals = eachWeekOfInterval({ start: startDate, end: now });
      
      labels = weekIntervals.map(date => `W${format(date, 'w')}`);
      
      const weeklyCounts = tickets.reduce((acc, ticket) => {
        const ticketDate = new Date(ticket.createdAt);
        const week = `W${format(ticketDate, 'w')}`;
        acc[week] = (acc[week] || 0) + 1;
        return acc;
      }, {});
      
      dataPoints = labels.map(week => weeklyCounts[week] || 0);
    }
    else if (chartType === 'monthly') {
      const months = timeRange === '6m' ? 6 : 12;
      const startDate = subDays(now, months * 30);
      const monthIntervals = eachMonthOfInterval({ start: startDate, end: now });
      
      labels = monthIntervals.map(date => format(date, 'MMM yyyy'));
      
      const monthlyCounts = tickets.reduce((acc, ticket) => {
        const ticketDate = new Date(ticket.createdAt);
        const month = format(ticketDate, 'MMM yyyy');
        acc[month] = (acc[month] || 0) + 1;
        return acc;
      }, {});
      
      dataPoints = labels.map(month => monthlyCounts[month] || 0);
    }

    return { labels, dataPoints };
  };

  const { labels, dataPoints } = generateChartData();
  
  // Calculate statistics
  const totalTickets = tickets.length;
  const avgTickets = totalTickets > 0 ? (totalTickets / labels.length).toFixed(1) : 0;
  const maxTickets = Math.max(...dataPoints, 0);
  const trendingUp = dataPoints.length > 1 && 
                     dataPoints[dataPoints.length - 1] > dataPoints[dataPoints.length - 2];

  const data = {
    labels,
    datasets: [{
      label: 'Tickets Created',
      data: dataPoints,
      borderColor: 'rgb(59, 130, 246)',
      backgroundColor: 'rgba(59, 130, 246, 0.05)',
      fill: true,
      tension: 0.4,
      pointBackgroundColor: 'rgb(59, 130, 246)',
      pointBorderColor: '#fff',
      pointBorderWidth: 2,
      pointRadius: 4,
      pointHoverRadius: 6
    }]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        titleColor: '#1f2937',
        bodyColor: '#4b5563',
        borderColor: '#e5e7eb',
        borderWidth: 1,
        padding: 12,
        boxPadding: 6,
        usePointStyle: true,
        callbacks: {
          label: function(context) {
            return `${context.dataset.label}: ${context.raw}`;
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          display: false,
          drawBorder: false
        },
        ticks: {
          color: '#6b7280',
          maxRotation: 0,
          autoSkip: true,
          maxTicksLimit: 8
        }
      },
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
          drawBorder: false
        },
        ticks: {
          color: '#6b7280',
          precision: 0
        }
      }
    },
    interaction: {
      intersect: false,
      mode: 'index'
    },
    animations: {
      tension: {
        duration: 1000,
        easing: 'linear'
      }
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
      {/* Header */}
      <div className="p-5 border-b border-gray-200 dark:border-gray-700">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
              <FiTrendingUp className="mr-2 text-blue-500" size={20} />
              Ticket Trends
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Track support ticket volume over time
            </p>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <div className="relative">
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="pl-9 pr-8 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
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
            
            <div className="relative">
              <select
                value={chartType}
                onChange={(e) => setChartType(e.target.value)}
                className="pl-9 pr-8 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
              <FiBarChart2 className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <FiChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            </div>
          </div>
        </div>
        
        {/* Stats Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">
            <p className="text-sm text-gray-500 dark:text-gray-400">Total Tickets</p>
            <p className="text-2xl font-semibold text-gray-900 dark:text-white">{totalTickets}</p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">
            <p className="text-sm text-gray-500 dark:text-gray-400">Average</p>
            <p className="text-2xl font-semibold text-gray-900 dark:text-white">{avgTickets}</p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">
            <p className="text-sm text-gray-500 dark:text-gray-400">Peak</p>
            <p className="text-2xl font-semibold text-gray-900 dark:text-white">{maxTickets}</p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">
            <p className="text-sm text-gray-500 dark:text-gray-400">Trend</p>
            <p className="text-2xl font-semibold text-gray-900 dark:text-white flex items-center">
              {trendingUp ? '↗' : '↘'}
              <span className="text-sm ml-1 text-gray-500">{trendingUp ? 'Up' : 'Down'}</span>
            </p>
          </div>
        </div>
      </div>
      
      {/* Chart Container */}
      <div className="p-5">
        <div className="h-80">
          <Line data={data} options={options} />
        </div>
      </div>
    </div>
  );
};

export default TicketTrends;