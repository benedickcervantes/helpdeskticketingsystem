'use client';
import { Bar } from 'react-chartjs-2';
import { Chart, registerables } from 'chart.js';
import { differenceInHours } from 'date-fns';
Chart.register(...registerables);

const ResolutionTime = ({ tickets }) => {
  const resolvedTickets = tickets.filter(t => t.status === 'resolved');
  
  const avgHours = resolvedTickets.reduce((sum, ticket) => {
    return sum + differenceInHours(
      new Date(ticket.resolvedAt), 
      new Date(ticket.createdAt)
    );
  }, 0) / resolvedTickets.length || 0;

  const data = {
    labels: ['Average Resolution Time'],
    datasets: [{
      label: 'Hours',
      data: [avgHours.toFixed(1)],
      backgroundColor: 'rgba(59, 130, 246, 0.7)'
    }]
  };

  return <Bar 
    data={data} 
    options={{
      indexAxis: 'y',
      responsive: true,
      plugins: {
        title: { display: true, text: 'Average Resolution Time (Hours)' },
      },
      scales: {
        x: { beginAtZero: true }
      }
    }} 
  />;
};

export default ResolutionTime;