// src/app/components/Tickets/TicketList.jsx
import TicketItem from './TicketItem';

const TicketList = ({ tickets, onTicketSelect, userRole }) => {
  return (
    <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
      <div className="px-4 py-5 sm:px-6 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white">
          Support Tickets
        </h3>
        <p className="mt-1 max-w-2xl text-sm text-gray-500 dark:text-gray-300">
          List of all support requests
        </p>
      </div>
      
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        {tickets.length > 0 ? (
          tickets.map(ticket => (
            <TicketItem 
              key={ticket.id} 
              ticket={ticket} 
              onClick={onTicketSelect}
              userRole={userRole}
            />
          ))
        ) : (
          <div className="px-4 py-5 sm:p-6 text-center">
            <p className="text-gray-500 dark:text-gray-300">No tickets found</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TicketList;