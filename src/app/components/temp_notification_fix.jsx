                          {notification.type === NOTIFICATION_TYPES.TICKET_RESOLVED && (
                            <div className="flex flex-wrap gap-2">
                              <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                                notification.priority === 'critical' ? 'bg-red-500/20 text-red-400' :
                                notification.priority === 'high' ? 'bg-orange-500/20 text-orange-400' :
                                notification.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                                'bg-emerald-500/20 text-emerald-400'
                              }`}>
                                {notification.priority?.charAt(0).toUpperCase() + notification.priority?.slice(1)} Priority
                              </span>
                              <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-gray-600/50 text-gray-300">
                                {notification.category?.charAt(0).toUpperCase() + notification.category?.slice(1)}
                              </span>
                              {notification.autoResolved && (
                                <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">
                                  <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                  </svg>
                                  Auto-Resolved
                                </span>
                              )}
                            </div>
                          )}
