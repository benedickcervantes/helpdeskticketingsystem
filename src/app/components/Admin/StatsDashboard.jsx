// src/app/components/Admin/StatsDashboard.jsx
export default function StatsDashboard({ stats, tickets }) {
  return (
    <div>
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard title="Total Tickets" value={stats.totalTickets} icon="📊" color="blue" />
        <StatCard title="Open Tickets" value={stats.openTickets} icon="⚠️" color="red" />
        <StatCard title="In Progress" value={stats.inProgressTickets} icon="🔄" color="yellow" />
        <StatCard title="Resolved" value={stats.resolvedTickets} icon="✅" color="green" />
        <StatCard title="Total Users" value={stats.totalUsers} icon="👥" color="purple" />
        <StatCard title="Admin Users" value={stats.adminUsers} icon="👑" color="indigo" />
        <StatCard title="Support Staff" value={stats.supportUsers} icon="🛠️" color="orange" />
        <StatCard title="Regular Users" value={stats.regularUsers} icon="👤" color="gray" />
      </div>

      {/* Recent Activity */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Recent Ticket Activity</h2>
        <div className="overflow-hidden">
          {tickets.slice(0, 5).map((ticket) => (
            <div key={ticket.id} className="border-b border-gray-200 dark:border-gray-700 py-3 last:border-b-0">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{ticket.title}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Created by {ticket.createdBy} • {new Date(ticket.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  ticket.status === 'open' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                  ticket.status === 'in-progress' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                  'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                }`}>
                  {ticket.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, color }) {
  const colorClasses = {
    blue: 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400',
    red: 'bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-400',
    yellow: 'bg-yellow-100 dark:bg-yellow-900 text-yellow-600 dark:text-yellow-400',
    green: 'bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400',
    purple: 'bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-400',
    indigo: 'bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400',
    orange: 'bg-orange-100 dark:bg-orange-900 text-orange-600 dark:text-orange-400',
    gray: 'bg-gray-100 dark:bg-gray-900 text-gray-600 dark:text-gray-400',
  };

  return (
    <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
      <div className="p-5">
        <div className="flex items-center">
          <div className={`flex-shrink-0 rounded-md p-3 ${colorClasses[color]}`}>
            <span className="text-xl">{icon}</span>
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                {title}
              </dt>
              <dd className="text-lg font-medium text-gray-900 dark:text-white">
                {value}
              </dd>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}