'use client';
import { Bar } from 'react-chartjs-2';
import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);

const DepartmentMetrics = ({ tickets }) => {
  // Group tickets by department
  const departmentCounts = tickets.reduce((acc, ticket) => {
    acc[ticket.department] = (acc[ticket.department] || 0) + 1;
    return acc;
  }, {});

  const data = {
    labels: Object.keys(departmentCounts),
    datasets: [{
      label: 'Tickets by Department',
      data: Object.values(departmentCounts),
      backgroundColor: [
        'rgba(59, 130, 246, 0.7)',  // IT - blue
        'rgba(16, 185, 129, 0.7)',  // HR - green
        'rgba(234, 179, 8, 0.7)',   // Finance - yellow
        'rgba(239, 68, 68, 0.7)',   // Operations - red
        'rgba(139, 92, 246, 0.7)'   // Other - purple
      ],
      borderWidth: 1
    }]
  };

  return <Bar data={data} options={{
    responsive: true,
    plugins: {
      title: { display: true, text: 'Tickets by Department' },
    },
    scales: {
      y: { beginAtZero: true }
    }
  }} />;
};

export default DepartmentMetrics;