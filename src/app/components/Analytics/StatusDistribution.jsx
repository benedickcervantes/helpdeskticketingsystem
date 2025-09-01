'use client';
import { Bar } from 'react-chartjs-2';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

const StatusDistribution = ({ tickets }) => {
  const statusOrder = ['open', 'in-progress', 'resolved', 'closed'];
  const statusCounts = statusOrder.map(status => 
    tickets.filter(t => t.status === status).length
  );

  const data = {
    labels: statusOrder.map(s => s.split('-').map(w => w[0].toUpperCase() + w.slice(1)).join(' ')),
    datasets: [{
      label: 'Ticket Count',
      data: statusCounts,
      backgroundColor: [
        'rgba(239, 68, 68, 0.7)', // Open
        'rgba(234, 179, 8, 0.7)',  // In Progress
        'rgba(16, 185, 129, 0.7)', // Resolved
        'rgba(156, 163, 175, 0.7)' // Closed
      ],
      borderWidth: 1
    }]
  };

  return <Bar data={data} options={{
    responsive: true,
    plugins: {
      title: { display: true, text: 'Ticket Status Distribution' }
    }
  }} />;
};

export default StatusDistribution;