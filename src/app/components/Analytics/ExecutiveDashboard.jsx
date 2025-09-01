'use client';
import TicketTrends from './TicketTrends';
import StatusDistribution from './StatusDistribution';
import ResolutionTime from './ResolutionTime';
import DepartmentMetrics from './DepartmentMetrics';
import KeyMetrics from './KeyMetrics';
import Card from '../UI/Card'; // Changed from named to default import

const ExecutiveDashboard = ({ tickets }) => {
  // Process data for metrics
  const analyticsData = {
    totalTickets: tickets.length,
    openTickets: tickets.filter(t => t.status === 'open').length,
    avgResolutionDays: calculateAvgResolution(tickets),
    slaCompliance: calculateSLACompliance(tickets)
  };

  return (
    <div className="space-y-6">
      <KeyMetrics data={analyticsData} />
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Ticket Volume Trends">
          <TicketTrends tickets={tickets} />
        </Card>
        
        <Card title="Status Distribution">
          <StatusDistribution tickets={tickets} />
        </Card>
        
        <Card title="Resolution Time">
          <ResolutionTime tickets={tickets} />
        </Card>
        
        <Card title="Department Metrics">
          <DepartmentMetrics tickets={tickets} />
        </Card>
      </div>
    </div>
  );
};

// Helper functions
function calculateAvgResolution(tickets) {
  // ... implementation
}

function calculateSLACompliance(tickets) {
  // ... implementation
}

export default ExecutiveDashboard;