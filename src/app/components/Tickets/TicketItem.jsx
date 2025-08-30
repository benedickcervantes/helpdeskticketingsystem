// src/app/components/Tickets/TicketItem.jsx
const TicketItem = ({ ticket, onClick, userRole }) => {
  const getStatusBadge = (status) => {
    switch(status) {
      case 'open': return <span className="badge-open">Open</span>;
      case 'in-progress': return <span className="badge-in-progress">In Progress</span>;
      case 'resolved': return <span className="badge-resolved">Resolved</span>;
      case 'closed': return <span className="badge-closed">Closed</span>;
      default: return <span className="badge">{status}</span>;
    }
  };

  const getPriorityBadge = (priority) => {
    switch(priority) {
      case 'high': return <span className="badge-high">High</span>;
      case 'medium': return <span className="badge-medium">Medium</span>;
      case 'low': return <span className="badge-low">Low</span>;
      case 'critical': return <span className="badge-high">Critical</span>;
      default: return <span className="badge">{priority}</span>;
    }
  };

  return (
    <div 
      className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors duration-150"
      onClick={() => onClick(ticket)}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <div className="ml-4">
            <h4 className="text-sm font-medium text-gray-900 dark:text-white">{ticket.title}</h4>
            <p className="text-sm text-gray-500 dark:text-gray-300 truncate max-w-xs">{ticket.description}</p>
          </div>
        </div>
        <div className="flex space-x-2">
          {getStatusBadge(ticket.status)}
          {getPriorityBadge(ticket.priority)}
        </div>
      </div>
      <div className="mt-2 flex items-center text-sm text-gray-500 dark:text-gray-300">
        <span>Created by {ticket.createdBy} • {new Date(ticket.createdAt).toLocaleDateString()}</span>
        {ticket.assignedTo && (
          <span className="ml-3">Assigned to {ticket.assignedTo}</span>
        )}
      </div>
    </div>
  );
};

export default TicketItem;