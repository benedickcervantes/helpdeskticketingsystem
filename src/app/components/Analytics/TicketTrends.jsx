'use client';
import { Line } from 'react-chartjs-2';
import { Chart, registerables } from 'chart.js';
import { format, subDays } from 'date-fns';

Chart.register(...registerables);

const TicketTrends = ({ tickets }) => {
  // Generate last 30 days labels
  const labels = Array.from({ length: 30 }, (_, i) => 
    format(subDays(new Date(), 29 - i), 'MMM dd')
  );

  // Count tickets per day
  const dailyCounts = tickets.reduce((acc, ticket) => {
    const date = format(new Date(ticket.createdAt), 'MMM dd');
    acc[date] = (acc[date] || 0) + 1;
    return acc;
  }, {});

  const data = {
    labels,
    datasets: [{
      label: 'Tickets Created',
      data: labels.map(date => dailyCounts[date] || 0),
      borderColor: 'rgb(59, 130, 246)',
      backgroundColor: 'rgba(59, 130, 246, 0.1)',
      fill: true,
      tension: 0.4
    }]
  };

  return <Line data={data} options={{
    responsive: true,
    plugins: {
      title: { display: true, text: 'Daily Ticket Volume' }
    }
  }} />;
};

export default TicketTrends;