'use client';
import { Bar } from 'react-chartjs-2';
import { Chart, registerables } from 'chart.js';
import { useState, useEffect } from 'react';
import { FiFilter, FiChevronDown } from 'react-icons/fi';

Chart.register(...registerables);

const StatusDistribution = ({ tickets }) => {
  const [isClient, setIsClient] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  useEffect(() => {
    setIsClient(true);
    // Check for dark mode preference
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setIsDarkMode(true);
    }
  }, []);

  // Filter tickets based on active filter
  const filteredTickets = activeFilter === 'all' 
    ? tickets 
    : tickets.filter(ticket => ticket.status === activeFilter);

  const statusOrder = ['open', 'in-progress', 'resolved', 'closed'];
  const statusCounts = statusOrder.map(status => 
    tickets.filter(t => t.status === status).length
  );

  const filteredStatusCounts = statusOrder.map(status => 
    filteredTickets.filter(t => t.status === status).length
  );

  const totalTickets = tickets.length;
  const filteredTotal = filteredTickets.length;

  const data = {
    labels: statusOrder.map(s => s.split('-').map(w => w[0].toUpperCase() + w.slice(1)).join(' ')),
    datasets: [{
      label: 'Ticket Count',
      data: activeFilter === 'all' ? statusCounts : filteredStatusCounts,
      backgroundColor: [
        'rgba(239, 68, 68, 0.7)', // Open
        'rgba(234, 179, 8, 0.7)',  // In Progress
        'rgba(16, 185, 129, 0.7)', // Resolved
        'rgba(156, 163, 175, 0.7)' // Closed
      ],
      borderColor: [
        'rgba(239, 68, 68, 1)',
        'rgba(234, 179, 8, 1)',
        'rgba(16, 185, 129, 1)',
        'rgba(156, 163, 175, 1)'
      ],
      borderWidth: 1,
      borderRadius: 6,
      hoverBackgroundColor: [
        'rgba(239, 68, 68, 0.9)',
        'rgba(234, 179, 8, 0.9)',
        'rgba(16, 185, 129, 0.9)',
        'rgba(156, 163, 175, 0.9)'
      ],
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
        backgroundColor: isDarkMode ? 'rgba(31, 41, 55, 0.9)' : 'rgba(255, 255, 255, 0.95)',
        titleColor: isDarkMode ? '#F9FAFB' : '#1F2937',
        bodyColor: isDarkMode ? '#F9FAFB' : '#4B5563',
        borderColor: isDarkMode ? '#4B5563' : '#E5E7EB',
        borderWidth: 1,
        padding: 12,
        boxPadding: 6,
        usePointStyle: true,
        callbacks: {
          label: function(context) {
            return `${context.label}: ${context.raw} tickets`;
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

  if (!isClient) {
    return (
      <div className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-md rounded-xl border border-gray-200/50 dark:border-gray-700/50 shadow-sm p-6 h-96 flex items-center justify-center">
        <div className="text-gray-500 dark:text-gray-400">Loading chart...</div>
      </div>
    );
  }

  return (
    <div className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-md rounded-xl border border-gray-200/50 dark:border-gray-700/50 shadow-sm overflow-hidden">
      <div className="px-6 py-5 border-b border-gray-200/50 dark:border-gray-700/50">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Ticket Status Distribution</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {activeFilter === 'all' 
                ? `Total: ${totalTickets} tickets` 
                : `${filteredTotal} ${activeFilter} tickets`}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <div className="relative">
              <select
                value={activeFilter}
                onChange={(e) => setActiveFilter(e.target.value)}
                className="pl-9 pr-8 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-sm text-gray-700 dark:text-gray-300 bg-white/50 dark:bg-gray-700/50 focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
              >
                <option value="all">All Statuses</option>
                {statusOrder.map(status => (
                  <option key={status} value={status}>
                    {status.split('-').map(w => w[0].toUpperCase() + w.slice(1)).join(' ')}
                  </option>
                ))}
              </select>
              <FiFilter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <FiChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            </div>
          </div>
        </div>
      </div>
      
      <div className="p-6">
        <div className="h-80">
          <Bar data={data} options={options} />
        </div>
        
        <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
          {statusOrder.map((status, index) => (
            <div key={status} className="bg-gray-50/50 dark:bg-gray-700/50 backdrop-blur-sm rounded-lg p-4 border border-gray-100/50 dark:border-gray-600/50">
              <div className="flex items-center">
                <div 
                  className="w-3 h-3 rounded-full mr-2"
                  style={{backgroundColor: data.datasets[0].backgroundColor[index]}}
                ></div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {status.split('-').map(w => w[0].toUpperCase() + w.slice(1)).join(' ')}
                </span>
              </div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                {statusCounts[index]}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {totalTickets > 0 ? `${((statusCounts[index] / totalTickets) * 100).toFixed(1)}% of total` : '0%'}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StatusDistribution;