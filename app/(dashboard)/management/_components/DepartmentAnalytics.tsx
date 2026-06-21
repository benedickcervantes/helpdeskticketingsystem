// @ts-nocheck
'use client';

import {
  formatResolutionTime,
  getTicketHours,
  isCompletedStatus,
  matchUserToTicket,
} from '@/lib/utils/analytics';

const DepartmentAnalytics = ({ tickets, users }) => {
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

  tickets.forEach((ticket) => {
    const ticketCreator = users.find((user) =>
      matchUserToTicket(user, ticket.createdBy),
    );
    if (ticketCreator && ticketCreator.department) {
      const dept = ticketCreator.department;
      if (departmentStats[dept]) {
        departmentStats[dept].totalTickets++;
        if (isCompletedStatus(ticket.status)) {
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
              100,
          ) / 100
        : 0;
    delete stats.resolutionHours;
  });

  const departmentEntries = Object.entries(departmentStats);
  const resolutionBadgeClass = (rate) =>
    rate >= 80
      ? 'bg-emerald-500/20 text-emerald-400'
      : rate >= 60
        ? 'bg-yellow-500/20 text-yellow-400'
        : 'bg-red-500/20 text-red-400';

  const DepartmentCard = ({ department, stats }) => (
    <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700 p-4 sm:p-5 md:p-6 hover:border-emerald-500/30 transition-all duration-300 min-w-0 h-full">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between mb-3 sm:mb-4 min-w-0">
        <h3 className="text-base sm:text-lg font-semibold text-white break-words [overflow-wrap:anywhere] min-w-0 flex-1">
          {department}
        </h3>
        <span
          className={`inline-flex shrink-0 px-2 py-1 text-xs font-semibold rounded-full ${resolutionBadgeClass(stats.resolutionRate)}`}
        >
          {stats.resolutionRate}% resolved
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-4">
        <div className="min-w-0">
          <p className="text-xs sm:text-sm text-gray-400">Total Users</p>
          <p className="text-xl sm:text-2xl font-bold text-white">{stats.totalUsers}</p>
        </div>
        <div className="min-w-0">
          <p className="text-xs sm:text-sm text-gray-400">Active Users</p>
          <p className="text-xl sm:text-2xl font-bold text-white">{stats.activeUsers}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-4">
        <div className="min-w-0">
          <p className="text-xs sm:text-sm text-gray-400">Total Tickets</p>
          <p className="text-base sm:text-lg font-semibold text-white">{stats.totalTickets}</p>
        </div>
        <div className="min-w-0">
          <p className="text-xs sm:text-sm text-gray-400">Resolved</p>
          <p className="text-base sm:text-lg font-semibold text-white">{stats.resolvedTickets}</p>
        </div>
      </div>

      <div className="mb-4 min-w-0">
        <p className="text-xs sm:text-sm text-gray-400">Avg Resolution Time</p>
        <p className="text-base sm:text-lg font-semibold text-white">
          {stats.resolvedTickets > 0
            ? formatResolutionTime(stats.avgResolutionTime)
            : '—'}
        </p>
      </div>

      <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
        <div
          className="h-2 rounded-full bg-emerald-500 transition-all duration-300"
          style={{ width: `${stats.resolutionRate}%` }}
        />
      </div>
    </div>
  );

  const TopPerformers = () => {
    const sortedDepartments = departmentEntries
      .sort(([, a], [, b]) => b.resolutionRate - a.resolutionRate)
      .slice(0, 3);

    return (
      <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700 p-4 sm:p-5 md:p-6 min-w-0 h-full">
        <h3 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4">
          Top Performing Departments
        </h3>
        <div className="space-y-4">
          {sortedDepartments.map(([dept, stats], index) => (
            <div key={dept} className="flex items-start justify-between gap-3 min-w-0">
              <div className="flex items-start min-w-0 flex-1">
                <div
                  className={`w-8 h-8 shrink-0 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                    index === 0
                      ? 'bg-yellow-500'
                      : index === 1
                        ? 'bg-gray-400'
                        : 'bg-orange-500'
                  }`}
                >
                  {index + 1}
                </div>
                <div className="ml-3 min-w-0">
                  <p className="text-sm font-medium text-white break-words [overflow-wrap:anywhere]">
                    {dept}
                  </p>
                  <p className="text-xs text-gray-400">{stats.totalTickets} tickets</p>
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-semibold text-white">{stats.resolutionRate}%</p>
                <p className="text-xs text-gray-400">resolution rate</p>
                <div className="w-16 bg-gray-700 rounded-full h-1 mt-1 overflow-hidden">
                  <div
                    className="h-1 rounded-full bg-emerald-500"
                    style={{ width: `${stats.resolutionRate}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const DepartmentComparison = () => (
    <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700 p-4 sm:p-5 md:p-6 min-w-0 h-full">
      <h3 className="text-base sm:text-lg font-semibold text-white mb-3 sm:mb-4">
        Department Comparison
      </h3>
      <div className="space-y-4">
        {departmentEntries.map(([dept, stats]) => (
          <div key={dept} className="space-y-2 min-w-0">
            <div className="flex justify-between items-start gap-3 min-w-0">
              <span className="text-sm font-medium text-gray-300 break-words [overflow-wrap:anywhere] min-w-0 flex-1">
                {dept}
              </span>
              <span className="text-sm text-gray-400 shrink-0">{stats.resolutionRate}%</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
              <div
                className="h-2 rounded-full bg-emerald-500 transition-all duration-300"
                style={{ width: `${stats.resolutionRate}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const DetailCard = ({ department, stats }) => (
    <div className="bg-gray-800/30 rounded-xl border border-gray-700/50 p-4 space-y-3 min-w-0">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between min-w-0">
        <h4 className="text-sm font-semibold text-white break-words [overflow-wrap:anywhere] min-w-0 flex-1">
          {department}
        </h4>
        <span
          className={`inline-flex shrink-0 px-2 py-1 text-xs font-semibold rounded-full ${resolutionBadgeClass(stats.resolutionRate)}`}
        >
          {stats.resolutionRate}%
        </span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
        <div className="min-w-0">
          <p className="text-gray-400 text-xs">Total Users</p>
          <p className="text-white font-medium">{stats.totalUsers}</p>
        </div>
        <div className="min-w-0">
          <p className="text-gray-400 text-xs">Active Users</p>
          <p className="text-white font-medium">{stats.activeUsers}</p>
        </div>
        <div className="min-w-0">
          <p className="text-gray-400 text-xs">Total Tickets</p>
          <p className="text-white font-medium">{stats.totalTickets}</p>
        </div>
        <div className="min-w-0">
          <p className="text-gray-400 text-xs">Resolved</p>
          <p className="text-white font-medium">{stats.resolvedTickets}</p>
        </div>
        <div className="min-w-0 sm:col-span-2">
          <p className="text-gray-400 text-xs">Avg Resolution Time</p>
          <p className="text-white font-medium">
            {stats.resolvedTickets > 0
              ? formatResolutionTime(stats.avgResolutionTime)
              : '—'}
          </p>
        </div>
      </div>
    </div>
  );

  if (departmentEntries.length === 0) {
    return (
      <div className="space-y-4 sm:space-y-8 min-w-0 w-full max-w-full">
        <div>
          <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-white mb-2 sm:mb-4">
            Department Analytics
          </h2>
          <p className="text-xs sm:text-sm md:text-base text-gray-400">
            Performance metrics and ticket distribution by department
          </p>
        </div>
        <p className="text-sm text-gray-400 py-8 text-center">
          No department data available. User department information is required to generate analytics.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 lg:space-y-8 min-w-0 w-full max-w-full">
      <div className="min-w-0">
        <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-white mb-2 sm:mb-4 md:mb-6">
          Department Analytics
        </h2>
        <p className="text-xs sm:text-sm md:text-base text-gray-400 mb-4 sm:mb-6 md:mb-8">
          Performance metrics and ticket distribution by department
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
        {departmentEntries.map(([department, stats]) => (
          <DepartmentCard key={department} department={department} stats={stats} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8 min-w-0">
        <TopPerformers />
        <DepartmentComparison />
      </div>

      <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700 p-4 sm:p-5 md:p-6 min-w-0 overflow-hidden">
        <h3 className="text-base sm:text-lg font-semibold text-white mb-4">
          Detailed Department Statistics
        </h3>

        {/* Card view: mobile through laptop (< 1280px) */}
        <div className="xl:hidden space-y-3 sm:space-y-4">
          {departmentEntries.map(([department, stats]) => (
            <DetailCard key={department} department={department} stats={stats} />
          ))}
        </div>

        {/* Table view: wide desktop only (1280px+) */}
        <div className="hidden xl:block w-full max-w-full overflow-x-auto">
          <table className="w-full table-fixed divide-y divide-gray-700">
            <thead className="bg-gray-700/50">
              <tr>
                <th className="w-[28%] px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Department
                </th>
                <th className="w-[10%] px-3 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Users
                </th>
                <th className="w-[10%] px-3 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Active
                </th>
                <th className="w-[12%] px-3 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Tickets
                </th>
                <th className="w-[10%] px-3 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Resolved
                </th>
                <th className="w-[14%] px-3 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Rate
                </th>
                <th className="w-[16%] px-3 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Avg Time
                </th>
              </tr>
            </thead>
            <tbody className="bg-gray-800/30 divide-y divide-gray-700">
              {departmentEntries.map(([department, stats]) => (
                <tr key={department} className="hover:bg-gray-700/30 transition-colors duration-200">
                  <td className="px-4 py-4 text-sm font-medium text-white align-top break-words [overflow-wrap:anywhere]">
                    {department}
                  </td>
                  <td className="px-3 py-4 text-sm text-gray-400 align-top">{stats.totalUsers}</td>
                  <td className="px-3 py-4 text-sm text-gray-400 align-top">{stats.activeUsers}</td>
                  <td className="px-3 py-4 text-sm text-gray-400 align-top">{stats.totalTickets}</td>
                  <td className="px-3 py-4 text-sm text-gray-400 align-top">{stats.resolvedTickets}</td>
                  <td className="px-3 py-4 align-top">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${resolutionBadgeClass(stats.resolutionRate)}`}
                    >
                      {stats.resolutionRate}%
                    </span>
                  </td>
                  <td className="px-3 py-4 text-sm text-gray-400 align-top">
                    {stats.resolvedTickets > 0
                      ? formatResolutionTime(stats.avgResolutionTime)
                      : '—'}
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
