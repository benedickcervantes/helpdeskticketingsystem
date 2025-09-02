'use client';
import { Bar, Doughnut } from 'react-chartjs-2';
import { Chart, registerables } from 'chart.js';
import { useState, useEffect } from 'react';
import { 
  FiBarChart2, 
  FiPieChart, 
  FiTrendingUp, 
  FiClock, 
  FiUsers,
  FiChevronDown,
  FiFilter
} from 'react-icons/fi';

Chart.register(...registerables);

const DepartmentMetrics = ({ tickets }) => {
  const [isClient, setIsClient] = useState(false);
  const [chartType, setChartType] = useState('bar');
  const [timeRange, setTimeRange] = useState('all');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [activeDepartment, setActiveDepartment] = useState(null);

  useEffect(() => {
    setIsClient(true);
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setIsDarkMode(true);
    }
  }, []);

  // Filter tickets based on time range
  const filterTicketsByTime = (tickets) => {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.setDate(now.getDate() - 30));
    
    return tickets.filter(ticket => {
      if (timeRange === 'all') return true;
      const ticketDate = new Date(ticket.createdAt);
      return ticketDate >= thirtyDaysAgo;
    });
  };

  const filteredTickets = filterTicketsByTime(tickets);

  // Group tickets by department with additional metrics
  const departmentStats = filteredTickets.reduce((acc, ticket) => {
    const dept = ticket.department || 'Unassigned';
    if (!acc[dept]) {
      acc[dept] = {
        count: 0,
        open: 0,
        resolved: 0,
        totalResolutionTime: 0,
        resolvedCount: 0
      };
    }
    
    acc[dept].count++;
    if (ticket.status === 'open') acc[dept].open++;
    if (ticket.status === 'resolved' || ticket.status === 'closed') {
      acc[dept].resolved++;
      if (ticket.resolvedAt && ticket.createdAt) {
        const resolvedTime = new Date(ticket.resolvedAt) - new Date(ticket.createdAt);
        acc[dept].totalResolutionTime += resolvedTime;
        acc[dept].resolvedCount++;
      }
    }
    
    return acc;
  }, {});

  // Calculate average resolution time per department
  Object.keys(departmentStats).forEach(dept => {
    departmentStats[dept].avgResolutionHours = departmentStats[dept].resolvedCount > 0 
      ? (departmentStats[dept].totalResolutionTime / departmentStats[dept].resolvedCount) / (1000 * 60 * 60)
      : 0;
  });

  const departments = Object.keys(departmentStats);
  const ticketCounts = departments.map(dept => departmentStats[dept].count);
  const openTickets = departments.map(dept => departmentStats[dept].open);
  const resolvedTickets = departments.map(dept => departmentStats[dept].resolved);

  // Color palette
  const colorPalette = [
    'rgba(59, 130, 246, 0.8)',   // IT - blue
    'rgba(16, 185, 129, 0.8)',   // HR - green
    'rgba(234, 179, 8, 0.8)',    // Finance - yellow
    'rgba(239, 68, 68, 0.8)',    // Operations - red
    'rgba(139, 92, 246, 0.8)',   // Marketing - purple
    'rgba(236, 72, 153, 0.8)',   // Sales - pink
    'rgba(249, 115, 22, 0.8)'    // Support - orange
  ];

  const borderColorPalette = [
    'rgb(59, 130, 246)',
    'rgb(16, 185, 129)',
    'rgb(234, 179, 8)',
    'rgb(239, 68, 68)',
    'rgb(139, 92, 246)',
    'rgb(236, 72, 153)',
    'rgb(249, 115, 22)'
  ];

  const barData = {
    labels: departments,
    datasets: [{
      label: 'Total Tickets',
      data: ticketCounts,
      backgroundColor: colorPalette.slice(0, departments.length),
      borderColor: borderColorPalette.slice(0, departments.length),
      borderWidth: 2,
      borderRadius: 6,
      hoverBackgroundColor: colorPalette.map(color => color.replace('0.8', '1')).slice(0, departments.length),
    }]
  };

  const stackedBarData = {
    labels: departments,
    datasets: [
      {
        label: 'Open Tickets',
        data: openTickets,
        backgroundColor: 'rgba(239, 68, 68, 0.8)',
        borderColor: 'rgb(239, 68, 68)',
        borderWidth: 2,
        borderRadius: 6,
      },
      {
        label: 'Resolved Tickets',
        data: resolvedTickets,
        backgroundColor: 'rgba(16, 185, 129, 0.8)',
        borderColor: 'rgb(16, 185, 129)',
        borderWidth: 2,
        borderRadius: 6,
      }
    ]
  };

  const doughnutData = {
    labels: departments,
    datasets: [{
      data: ticketCounts,
      backgroundColor: colorPalette.slice(0, departments.length),
      borderColor: isDarkMode ? 'rgba(0, 0, 0, 0.2)' : 'rgba(255, 255, 255, 0.8)',
      borderWidth: 2,
      hoverOffset: 12
    }]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: isDarkMode ? '#9CA3AF' : '#6B7280',
          usePointStyle: true,
          pointStyle: 'circle',
          padding: 20
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
            return `${context.dataset.label}: ${context.raw} tickets`;
          }
        }
      }
    },
    scales: {
      y: {
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
      x: {
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
    ...chartOptions,
    cutout: '60%',
    plugins: {
      ...chartOptions.plugins,
      legend: {
        ...chartOptions.plugins.legend,
        position: 'bottom'
      }
    }
  };

  if (!isClient) {
    return (
      <div className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-md rounded-xl border border-gray-200/50 dark:border-gray-700/50 shadow-sm p-6 h-96 flex items-center justify-center">
        <div className="text-gray-500 dark:text-gray-400">Loading department metrics...</div>
      </div>
    );
  }

  const totalTickets = filteredTickets.length;

  return (
    <div className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-md rounded-xl border border-gray-200/50 dark:border-gray-700/50 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-6 py-5 border-b border-gray-200/50 dark:border-gray-700/50">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
              <FiUsers className="mr-2 text-blue-500" size={20} />
              Department Performance
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {timeRange === 'all' ? 'All time' : 'Last 30 days'} • {totalTickets} total tickets
            </p>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <div className="relative">
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="pl-9 pr-8 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-sm text-gray-700 dark:text-gray-300 bg-white/50 dark:bg-gray-700/50 focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
              >
                <option value="all">All Time</option>
                <option value="30d">Last 30 Days</option>
              </select>
              <FiFilter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <FiChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            </div>
            
            <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
              <button
                onClick={() => setChartType('bar')}
                className={`p-2 rounded-md transition-colors ${
                  chartType === 'bar'
                    ? 'bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                <FiBarChart2 size={18} />
              </button>
              <button
                onClick={() => setChartType('stacked')}
                className={`p-2 rounded-md transition-colors ${
                  chartType === 'stacked'
                    ? 'bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                <FiTrendingUp size={18} />
              </button>
              <button
                onClick={() => setChartType('doughnut')}
                className={`p-2 rounded-md transition-colors ${
                  chartType === 'doughnut'
                    ? 'bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                <FiPieChart size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Charts Container */}
      <div className="p-6">
        <div className="h-80 mb-6">
          {chartType === 'bar' && <Bar data={barData} options={chartOptions} />}
          {chartType === 'stacked' && <Bar data={stackedBarData} options={{...chartOptions, scales: {...chartOptions.scales, x: {...chartOptions.scales.x, stacked: true}, y: {...chartOptions.scales.y, stacked: true}}}} />}
          {chartType === 'doughnut' && <Doughnut data={doughnutData} options={doughnutOptions} />}
        </div>
        
        {/* Department Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {departments.map((dept, index) => (
            <div 
              key={dept}
              className={`bg-gray-50/50 dark:bg-gray-700/50 backdrop-blur-sm rounded-lg p-4 border border-gray-100/50 dark:border-gray-600/50 transition-all hover:shadow-md cursor-pointer ${
                activeDepartment === dept ? 'ring-2 ring-blue-500' : ''
              }`}
              onClick={() => setActiveDepartment(activeDepartment === dept ? null : dept)}
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-gray-900 dark:text-white">{dept}</h3>
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: colorPalette[index % colorPalette.length] }}
                ></div>
              </div>
              
              <div className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                {departmentStats[dept].count}
              </div>
              
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="text-green-600 dark:text-green-400">
                  <div className="font-medium">{departmentStats[dept].resolved}</div>
                  <div>Resolved</div>
                </div>
                <div className="text-red-600 dark:text-red-400">
                  <div className="font-medium">{departmentStats[dept].open}</div>
                  <div>Open</div>
                </div>
              </div>
              
              {departmentStats[dept].resolvedCount > 0 && (
                <div className="flex items-center mt-3 text-xs text-gray-500 dark:text-gray-400">
                  <FiClock className="mr-1" size={12} />
                  Avg: {departmentStats[dept].avgResolutionHours.toFixed(1)} hours
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DepartmentMetrics;