// src/app/components/Tickets/TicketItem.jsx
import { FiMessageSquare, FiUser, FiCalendar, FiArrowRight, FiClock, FiUserCheck } from 'react-icons/fi';

const TicketItem = ({ ticket, onClick, userRole }) => {
  const getStatusBadge = (status) => {
    const baseClasses = "px-3 py-1.5 rounded-full text-xs font-medium flex items-center";
    switch(status) {
      case 'open': 
        return <span className={`${baseClasses} bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300`}>
          <span className="w-2 h-2 bg-blue-600 rounded-full mr-1.5"></span>
          Open
        </span>;
      case 'in-progress': 
        return <span className={`${baseClasses} bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300`}>
          <span className="w-2 h-2 bg-yellow-600 rounded-full mr-1.5"></span>
          In Progress
        </span>;
      case 'resolved': 
        return <span className={`${baseClasses} bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300`}>
          <span className="w-2 h-2 bg-green-600 rounded-full mr-1.5"></span>
          Resolved
        </span>;
      case 'closed': 
        return <span className={`${baseClasses} bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300`}>
          <span className="w-2 h-2 bg-gray-600 rounded-full mr-1.5"></span>
          Closed
        </span>;
      default: 
        return <span className={`${baseClasses} bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300`}>
          <span className="w-2 h-2 bg-gray-600 rounded-full mr-1.5"></span>
          {status}
        </span>;
    }
  };

  const getPriorityBadge = (priority) => {
    const baseClasses = "px-2.5 py-1 rounded-full text-xs font-medium";
    switch(priority) {
      case 'high': 
        return <span className={`${baseClasses} bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300`}>High</span>;
      case 'medium': 
        return <span className={`${baseClasses} bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300`}>Medium</span>;
      case 'low': 
        return <span className={`${baseClasses} bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300`}>Low</span>;
      case 'critical': 
        return <span className={`${baseClasses} bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300`}>Critical</span>;
      default: 
        return <span className={`${baseClasses} bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300`}>{priority}</span>;
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return 'Today';
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  return (
    <div 
      className="bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100 dark:border-gray-700 overflow-hidden cursor-pointer transform hover:-translate-y-0.5"
      onClick={() => onClick(ticket)}
    >
      <div className="p-5">
        <div className="flex justify-between items-start mb-3">
          <h4 className="text-base font-semibold text-gray-900 dark:text-white line-clamp-1 pr-2">{ticket.title}</h4>
          <div className="flex-shrink-0">
            {getPriorityBadge(ticket.priority)}
          </div>
        </div>
        
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 line-clamp-2">{ticket.description}</p>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
            <div className="flex items-center">
              <FiUser className="mr-1.5" size={14} />
              <span>{ticket.createdBy}</span>
            </div>
            <div className="flex items-center">
              <FiCalendar className="mr-1.5" size={14} />
              <span>{formatDate(ticket.createdAt)}</span>
            </div>
            {ticket.assignedTo && (
              <div className="flex items-center">
                <FiUserCheck className="mr-1.5" size={14} />
                <span>{ticket.assignedTo}</span>
              </div>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            {getStatusBadge(ticket.status)}
            <div className="text-gray-400 dark:text-gray-500">
              <FiArrowRight size={16} />
            </div>
          </div>
        </div>
      </div>
      
      {/* Subtle hover indicator */}
      <div className="h-1 w-0 bg-blue-500 transition-all duration-300 group-hover:w-full"></div>
    </div>
  );
};

export default TicketItem;