// @ts-nocheck
'use client';

import {
  getTicketHours,
  isResolvedStatus,
  matchUserToTicket,
} from '@/lib/utils/analytics';

const DepartmentAnalytics = ({ tickets, users }) => {
  // Calculate department statistics
  const departmentStats = users.reduce((acc, user) => {
    const dept = user.department || 'Unknown';
    if (!acc[dept]) {
      acc[dept] = {
        totalUsers: 0,
        activeUsers: 0,
        totalTickets: 0,
        resolvedTickets: 0,
        resolutionHours: [],
        avgResolutionTime: 0,
      };
    }
    acc[dept].totalUsers++;
    if (user.isActive) {
      acc[dept].activeUsers++;
    }
    return acc;
  }, {});

  // Calculate tickets per department
  tickets.forEach((ticket) => {
    const ticketCreator = users.find((user) =>
      matchUserToTicket(user, ticket.createdBy),
    );
    if (ticketCreator && ticketCreator.department) {
      const dept = ticketCreator.department;
      if (departmentStats[dept]) {
        departmentStats[dept].totalTickets++;
        if (isResolvedStatus(ticket.status)) {
          departmentStats[dept].resolvedTickets++;
          const hours = getTicketHours(
            ticket.createdAt,
            ticket.resolvedAt || ticket.updatedAt,
          );
          if (hours !== null) {
            departmentStats[dept].resolutionHours.push(hours);
          }
        }
      }
    }
  });

  // Calculate resolution rates and average resolution times
  Object.keys(departmentStats).forEach((dept) => {
    const stats = departmentStats[dept];
    stats.resolutionRate =
      stats.totalTickets > 0
        ? Math.round((stats.resolvedTickets / stats.totalTickets) * 100)
        : 0;
    stats.avgResolutionTime =
      stats.resolutionHours.length > 0
        ? Math.round(
            (stats.resolutionHours.reduce((sum, hours) => sum + hours, 0) /
              stats.resolutionHours.length) *
              10,
          ) / 10
        : 0;
    delete stats.resolutionHours;
  });
  const DepartmentCard = ({ department, stats }) => (
    <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700 p-6 hover:border-emerald-500/30 transition-all duration-300 transform hover:-translate-y-1">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">{department}</h3>
        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
          stats.resolutionRate >= 80 ? 'bg-emerald-500/20 text-emerald-400' :
          stats.resolutionRate >= 60 ? 'bg-yellow-500/20 text-yellow-400' :
          'bg-red-500/20 text-red-400'
        }`}>
          {stats.resolutionRate}% resolved
        </span>
      </div>
      
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-sm text-gray-400">Total Users</p>
          <p className="text-2xl font-bold text-white">{stats.totalUsers}</p>
        </div>
        <div>
          <p className="text-sm text-gray-400">Active Users</p>
          <p className="text-2xl font-bold text-white">{stats.activeUsers}</p>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-sm text-gray-400">Total Tickets</p>
          <p className="text-lg font-semibold text-white">{stats.totalTickets}</p>
        </div>
        <div>
          <p className="text-sm text-gray-400">Resolved</p>
          <p className="text-lg font-semibold text-white">{stats.resolvedTickets}</p>
        </div>
      </div>
      
      <div className="mb-4">
        <p className="text-sm text-gray-400">Avg Resolution Time</p>
        <p className="text-lg font-semibold text-white">{stats.avgResolutionTime}h</p>
      </div>
      
      <div className="w-full bg-gray-700 rounded-full h-2">
        <div 
          className="h-2 rounded-full bg-emerald-500"
          style={{ width: `${stats.resolutionRate}%` }}
        ></div>
      </div>
    </div>
  );

  const TopPerformers = () => {
    const sortedDepartments = Object.entries(departmentStats)
      .sort(([,a], [,b]) => b.resolutionRate - a.resolutionRate)
      .slice(0, 3);

    return (
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Top Performing Departments</h3>
        <div className="space-y-4">
          {sortedDepartments.map(([dept, stats], index) => (
            <div key={dept} className="flex items-center justify-between">
              <div className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                  index === 0 ? 'bg-yellow-500' :
                  index === 1 ? 'bg-gray-400' :
                  'bg-orange-500'
                }`}>
                  {index + 1}
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-white">{dept}</p>
                  <p className="text-xs text-gray-400">{stats.totalTickets} tickets</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-white">{stats.resolutionRate}%</p>
                <p className="text-xs text-gray-400">resolution rate</p>
                <div className="w-16 bg-gray-700 rounded-full h-1 mt-1">
                  <div 
                    className="h-1 rounded-full bg-emerald-500"
                    style={{ width: `${stats.resolutionRate}%` }}
                  ></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const DepartmentComparison = () => {
    const departments = Object.entries(departmentStats);
    
    return (
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Department Comparison</h3>
        <div className="space-y-4">
          {departments.map(([dept, stats]) => (
            <div key={dept} className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-300">{dept}</span>
                <span className="text-sm text-gray-400">{stats.resolutionRate}%</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div 
                  className="h-2 rounded-full bg-emerald-500"
                  style={{ width: `${stats.resolutionRate}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-white mb-4 sm:mb-6">Department Analytics</h2>
        <p className="text-sm sm:text-base text-gray-400 mb-6 sm:mb-8">Performance metrics and ticket distribution by department</p>
      </div>

      {/* Department Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Object.entries(departmentStats).map(([department, stats]) => (
          <DepartmentCard key={department} department={department} stats={stats} />
        ))}
      </div>

      {/* Summary Statistics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <TopPerformers />
        <DepartmentComparison />
      </div>

      {/* Detailed Department Table */}
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700 p-4 sm:p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Detailed Department Statistics</h3>

        {/* Mobile card view */}
        <div className="block lg:hidden space-y-3 sm:space-y-4">
          {Object.entries(departmentStats).map(([department, stats]) => (
            <div
              key={department}
              className="bg-gray-800/30 rounded-xl border border-gray-700/50 p-4 space-y-3"
            >
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-white">{department}</h4>
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                  stats.resolutionRate >= 80 ? 'bg-emerald-500/20 text-emerald-400' :
                  stats.resolutionRate >= 60 ? 'bg-yellow-500/20 text-yellow-400' :
                  'bg-red-500/20 text-red-400'
                }`}>
                  {stats.resolutionRate}%
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-gray-400 text-xs">Total Users</p>
                  <p className="text-white font-medium">{stats.totalUsers}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs">Active Users</p>
                  <p className="text-white font-medium">{stats.activeUsers}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs">Total Tickets</p>
                  <p className="text-white font-medium">{stats.totalTickets}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs">Resolved</p>
                  <p className="text-white font-medium">{stats.resolvedTickets}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-gray-400 text-xs">Avg Resolution Time</p>
                  <p className="text-white font-medium">{stats.avgResolutionTime}h</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Desktop table view */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-700">
            <thead className="bg-gray-700/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Department</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Total Users</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Active Users</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Total Tickets</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Resolved</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Resolution Rate</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Avg Time</th>
              </tr>
            </thead>
            <tbody className="bg-gray-800/30 divide-y divide-gray-700">
              {Object.entries(departmentStats).map(([department, stats]) => (
                <tr key={department} className="hover:bg-gray-700/30 transition-colors duration-200">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                    {department}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                    {stats.totalUsers}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                    {stats.activeUsers}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                    {stats.totalTickets}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                    {stats.resolvedTickets}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      stats.resolutionRate >= 80 ? 'bg-emerald-500/20 text-emerald-400' :
                      stats.resolutionRate >= 60 ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-red-500/20 text-red-400'
                    }`}>
                      {stats.resolutionRate}%
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                    {stats.avgResolutionTime}h
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DepartmentAnalytics;