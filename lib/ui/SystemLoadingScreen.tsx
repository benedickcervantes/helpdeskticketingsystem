'use client';

import { useEffect, useMemo, useState } from 'react';
import { FpdcLogo } from '@/lib/ui/FpdcLogo';

export type AuthLoadingAction = 'idle' | 'session' | 'login' | 'signup' | 'logout';
export type LoaderRole = 'user' | 'admin' | 'manager' | 'guest';

interface SystemLoadingScreenProps {
  action?: AuthLoadingAction;
  role?: string | null;
  department?: string | null;
  userName?: string | null;
  message?: string;
  subtitle?: string;
  /** loading | error (failed auth) | success (secure logout complete) */
  variant?: 'loading' | 'error' | 'success';
  errorMessage?: string | null;
}

interface ServiceNode {
  id: string;
  label: string;
  short: string;
  x: number;
  y: number;
}

interface ActionCopy {
  title: string;
  subtitle: string;
  stages: string[];
  layer: string;
  layerMobile: string;
}

function normalizeRole(role?: string | null): LoaderRole {
  const value = String(role || '').toLowerCase();
  if (value === 'admin') return 'admin';
  if (value === 'manager') return 'manager';
  if (value === 'user') return 'user';
  return 'guest';
}

const SERVICE_NODES: Record<LoaderRole, ServiceNode[]> = {
  user: [
    { id: 'tickets', label: 'Tickets', short: 'Tickets', x: 18, y: 28 },
    { id: 'messages', label: 'Messages', short: 'Messages', x: 82, y: 28 },
    { id: 'notifications', label: 'Notifications', short: 'Alerts', x: 18, y: 72 },
    { id: 'feedback', label: 'Feedback', short: 'Feedback', x: 82, y: 72 },
  ],
  admin: [
    { id: 'tickets', label: 'Tickets', short: 'Tickets', x: 18, y: 28 },
    { id: 'users', label: 'Users', short: 'Users', x: 82, y: 28 },
    { id: 'notifications', label: 'Notifications', short: 'Alerts', x: 18, y: 72 },
    { id: 'analytics', label: 'Analytics', short: 'Analytics', x: 82, y: 72 },
  ],
  manager: [
    { id: 'analytics', label: 'Analytics', short: 'Analytics', x: 18, y: 28 },
    { id: 'sla', label: 'SLA / Performance', short: 'SLA', x: 82, y: 28 },
    { id: 'departments', label: 'Departments', short: 'Depts', x: 18, y: 72 },
    { id: 'feedback', label: 'Feedback', short: 'Feedback', x: 82, y: 72 },
  ],
  guest: [
    { id: 'tickets', label: 'Tickets', short: 'Tickets', x: 18, y: 28 },
    { id: 'messages', label: 'Messages', short: 'Messages', x: 82, y: 28 },
    { id: 'notifications', label: 'Notifications', short: 'Alerts', x: 18, y: 72 },
    { id: 'analytics', label: 'Analytics', short: 'Analytics', x: 82, y: 72 },
  ],
};

const ROLE_LABEL: Record<LoaderRole, string> = {
  user: 'Support Hub',
  admin: 'Admin Console',
  manager: 'Management Suite',
  guest: 'Helpdesk Platform',
};

function buildCopy(
  action: Exclude<AuthLoadingAction, 'idle'>,
  role: LoaderRole,
  department?: string | null,
): ActionCopy {
  const workspace = ROLE_LABEL[role];
  const deptLine = department ? ` · ${department}` : '';

  const byAction: Record<Exclude<AuthLoadingAction, 'idle'>, ActionCopy> = {
    session: {
      title:
        role === 'admin'
          ? 'Restoring Admin Console'
          : role === 'manager'
            ? 'Restoring Management Suite'
            : role === 'user'
              ? 'Restoring Support Hub'
              : 'Restoring Helpdesk Session',
      subtitle: `Reconnecting your ${workspace} services${deptLine}`,
      stages:
        role === 'admin'
          ? [
              'Validate secure session',
              'Load ticket queue',
              'Sync user directory',
              'Reconnect notifications',
            ]
          : role === 'manager'
            ? [
                'Validate secure session',
                'Load analytics workspace',
                'Sync SLA metrics',
                'Reconnect notifications',
              ]
            : role === 'user'
              ? [
                  'Validate secure session',
                  'Load my tickets',
                  'Reconnect messages',
                  'Sync notifications',
                ]
              : [
                  'Validate secure session',
                  'Connect helpdesk services',
                  'Load workspace modules',
                  'Prepare dashboard',
                ],
      layer: 'SESSION → SERVICES → REALTIME → READY',
      layerMobile: 'SESSION · SERVICES · READY',
    },
    login: {
      title:
        role === 'admin'
          ? 'Loading Ticket Queue & Users'
          : role === 'manager'
            ? 'Preparing Analytics & SLA'
            : role === 'user'
              ? 'Opening Support Hub'
              : 'Signing You In',
      subtitle: `Routing access to ${workspace}${deptLine}`,
      stages:
        role === 'admin'
          ? ['Verify credentials', 'Load profile', 'Open ticket queue', 'Sync notifications']
          : role === 'manager'
            ? ['Verify credentials', 'Load profile', 'Open analytics', 'Sync department data']
            : [
                'Verify credentials',
                'Load profile',
                'Open tickets',
                'Sync notifications',
              ],
      layer: 'AUTH → PROFILE → TICKETS → ALERTS',
      layerMobile: 'AUTH · PROFILE · TICKETS',
    },
    signup: {
      title: 'Provisioning Support Account',
      subtitle: `Registering access to ${workspace}${deptLine}`,
      stages: [
        'Create account',
        'Assign department access',
        'Enable tickets & messages',
        'Open Support Hub',
      ],
      layer: 'ACCOUNT → DEPT → TICKETS → HUB',
      layerMobile: 'ACCOUNT · DEPT · HUB',
    },
    logout: {
      title:
        role === 'admin'
          ? 'Signing Out of Admin Console'
          : role === 'manager'
            ? 'Signing Out of Management Suite'
            : 'Signing Out of Support Hub',
      subtitle: `Safely closing your ${workspace} session${deptLine}`,
      stages:
        role === 'admin'
          ? [
              'Close ticket queue',
              'Lock user management',
              'Stop live notifications',
              'Revoke secure session',
            ]
          : role === 'manager'
            ? [
                'Close analytics views',
                'Clear SLA workspace',
                'Stop live notifications',
                'Revoke secure session',
              ]
            : [
                'Close my tickets',
                'Disconnect messages',
                'Stop notifications',
                'Revoke secure session',
              ],
      layer: 'WORKSPACE → SOCKET → ALERTS → SECURE',
      layerMobile: 'WORKSPACE · SOCKET · SECURE',
    },
  };

  return byAction[action];
}

export function SystemLoadingScreen({
  action = 'session',
  role,
  department,
  userName,
  message,
  subtitle,
  variant = 'loading',
  errorMessage,
}: SystemLoadingScreenProps) {
  const isError = variant === 'error';
  const isSuccess = variant === 'success';
  const resolvedAction = action === 'idle' ? 'session' : action;
  const resolvedRole = normalizeRole(role);
  const nodes = SERVICE_NODES[resolvedRole];
  const copy = useMemo(
    () => buildCopy(resolvedAction, resolvedRole, department),
    [resolvedAction, resolvedRole, department],
  );
  const firstName = userName?.trim()?.split(/\s+/)[0] || null;

  const [stageIndex, setStageIndex] = useState(0);
  const [progress, setProgress] = useState(10);
  const [activeNode, setActiveNode] = useState(0);

  useEffect(() => {
    if (isError) {
      setStageIndex(0);
      setProgress(28);
      setActiveNode(0);
      return;
    }

    if (isSuccess) {
      setStageIndex(copy.stages.length);
      setProgress(100);
      setActiveNode(nodes.length - 1);
      return;
    }

    const isSequenced =
      resolvedAction === 'logout' || resolvedAction === 'session';

    setStageIndex(0);
    setProgress(isSequenced ? 18 : 10);
    setActiveNode(0);

    const stageTimer = setInterval(() => {
      setStageIndex((prev) => {
        if (isSequenced) {
          return Math.min(prev + 1, copy.stages.length - 1);
        }
        return (prev + 1) % copy.stages.length;
      });
    }, isSequenced ? 520 : 1400);

    const nodeTimer = setInterval(() => {
      setActiveNode((prev) => (prev + 1) % nodes.length);
    }, isSequenced ? 480 : 1000);

    const progressTimer = setInterval(() => {
      setProgress((prev) => {
        if (isSequenced) {
          return Math.min(90, prev + 8 + Math.random() * 6);
        }
        if (prev >= 92) return 22 + Math.random() * 10;
        return Math.min(92, prev + 3 + Math.random() * 9);
      });
    }, isSequenced ? 220 : 300);

    return () => {
      clearInterval(stageTimer);
      clearInterval(nodeTimer);
      clearInterval(progressTimer);
    };
  }, [
    copy.stages.length,
    isError,
    isSuccess,
    nodes.length,
    resolvedAction,
    resolvedRole,
  ]);

  const statusLine = useMemo(() => {
    if (isError) return 'Authentication blocked';
    if (isSuccess) {
      return resolvedAction === 'logout' ? 'Session secured' : 'Workspace ready';
    }
    return copy.stages[stageIndex] || copy.stages[0];
  }, [copy.stages, isError, isSuccess, resolvedAction, stageIndex]);

  const completedCount = isError
    ? 0
    : isSuccess
      ? nodes.length
      : Math.min(nodes.length, Math.floor((progress / 100) * nodes.length));

  const title = isError
    ? resolvedAction === 'signup'
      ? 'Provisioning Failed'
      : 'Access Denied'
    : isSuccess
      ? resolvedAction === 'logout'
        ? 'Signed Out Securely'
        : 'Welcome Back'
      : message || copy.title;

  const description = isError
    ? errorMessage ||
      (resolvedAction === 'signup'
        ? 'We could not create your account. Returning to the form…'
        : 'Invalid credentials. Returning to the sign-in form…')
    : isSuccess
      ? resolvedAction === 'logout'
        ? firstName
          ? `Goodbye, ${firstName}. Your helpdesk session is now closed.`
          : 'Your helpdesk session is now closed. See you next time.'
        : firstName
          ? `Welcome back, ${firstName}. Your ${ROLE_LABEL[resolvedRole]} is ready.`
          : `Your ${ROLE_LABEL[resolvedRole]} is ready.`
      : subtitle || copy.subtitle;

  return (
    <div
      className="fixed inset-0 z-[9999] overflow-x-hidden overflow-y-auto overscroll-none bg-[#071018]"
      role="status"
      aria-live="polite"
      aria-busy={!isError && !isSuccess}
      aria-label={title}
    >
      <div className="pointer-events-none absolute inset-0 min-h-full">
        <div
          className={`absolute inset-0 ${
            isError
              ? 'bg-[radial-gradient(ellipse_at_center,_rgba(244,63,94,0.14),_transparent_60%)]'
              : isSuccess
                ? 'bg-[radial-gradient(ellipse_at_center,_rgba(16,185,129,0.18),_transparent_60%)]'
                : 'bg-[radial-gradient(ellipse_at_center,_rgba(16,185,129,0.12),_transparent_60%)]'
          }`}
        />
        <div className="blueprint-grid absolute inset-0" />
        <div className="blueprint-grid-fine absolute inset-0 hidden opacity-40 sm:block" />
      </div>

      <svg
        className="pointer-events-none absolute inset-0 h-full w-full opacity-70 sm:opacity-100"
        viewBox="0 0 100 100"
        preserveAspectRatio="xMidYMid meet"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="blueprint-trace" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop
              offset="0%"
              stopColor={isError ? '#f43f5e' : '#10b981'}
              stopOpacity="0.15"
            />
            <stop
              offset="50%"
              stopColor={isError ? '#fb7185' : '#22d3ee'}
              stopOpacity="0.85"
            />
            <stop
              offset="100%"
              stopColor={isError ? '#f43f5e' : '#10b981'}
              stopOpacity="0.15"
            />
          </linearGradient>
          <filter id="blueprint-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="0.6" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <path
          className="blueprint-trace"
          d="M18 28 H36 V42 H50"
          fill="none"
          stroke="url(#blueprint-trace)"
          strokeWidth="0.35"
          strokeLinecap="round"
        />
        <path
          className="blueprint-trace blueprint-trace-delay"
          d="M82 28 H64 V42 H50"
          fill="none"
          stroke="url(#blueprint-trace)"
          strokeWidth="0.35"
          strokeLinecap="round"
        />
        <path
          className="blueprint-trace"
          d="M18 72 H36 V58 H50"
          fill="none"
          stroke="url(#blueprint-trace)"
          strokeWidth="0.35"
          strokeLinecap="round"
        />
        <path
          className="blueprint-trace blueprint-trace-delay"
          d="M82 72 H64 V58 H50"
          fill="none"
          stroke="url(#blueprint-trace)"
          strokeWidth="0.35"
          strokeLinecap="round"
        />

        <circle
          cx="50"
          cy="50"
          r="11"
          fill="none"
          stroke="rgba(16,185,129,0.25)"
          strokeWidth="0.25"
          strokeDasharray="1.2 1"
          className="hidden sm:block"
        />
        <circle
          cx="50"
          cy="50"
          r="14"
          fill="none"
          stroke="rgba(6,182,212,0.18)"
          strokeWidth="0.2"
          strokeDasharray="0.8 1.4"
          className="hidden sm:block"
        />

        {nodes.map((node, index) => {
          const isActive = !isError && !isSuccess && index === activeNode;
          const isDone = index < completedCount;
          return (
            <g key={node.id} filter="url(#blueprint-glow)">
              <circle
                cx={node.x}
                cy={node.y}
                r={isActive || isSuccess ? 2.2 : 1.6}
                fill={
                  isError
                    ? '#fb7185'
                    : isSuccess || isDone
                      ? '#34d399'
                      : isActive
                        ? '#22d3ee'
                        : '#10b981'
                }
                opacity={isError ? 0.55 : isActive || isDone || isSuccess ? 1 : 0.65}
                className={isActive ? 'blueprint-node-active' : 'blueprint-node'}
              />
              <circle
                cx={node.x}
                cy={node.y}
                r={isActive || isSuccess ? 4 : 3}
                fill="none"
                stroke={
                  isError
                    ? 'rgba(244,63,94,0.4)'
                    : isSuccess || isDone
                      ? 'rgba(52,211,153,0.55)'
                      : isActive
                        ? 'rgba(34,211,238,0.55)'
                        : 'rgba(16,185,129,0.35)'
                }
                strokeWidth="0.2"
              />
            </g>
          );
        })}
      </svg>

      <div className="relative z-10 flex min-h-[100dvh] w-full items-center justify-center px-4 py-6 sm:px-6 sm:py-8">
        <div className="mx-auto w-full max-w-[20rem] text-center sm:max-w-md">
          <div className="relative mx-auto mb-4 flex h-20 w-20 items-center justify-center sm:mb-6 sm:h-28 sm:w-28">
            <div
              className={`absolute inset-0 rounded-full border ${
                isError
                  ? 'border-rose-400/35'
                  : isSuccess
                    ? 'border-emerald-400/45'
                    : 'border-emerald-400/20'
              } blueprint-hub-ring`}
            />
            <div
              className={`absolute inset-2 rounded-full border sm:inset-3 ${
                isError
                  ? 'border-rose-400/20'
                  : isSuccess
                    ? 'border-emerald-300/30'
                    : 'border-cyan-400/15'
              } blueprint-hub-ring-reverse`}
            />
            <div
              className={`absolute inset-0 rounded-full blur-md ${
                isError
                  ? 'bg-rose-500/15'
                  : isSuccess
                    ? 'bg-emerald-400/20'
                    : 'bg-emerald-500/10'
              }`}
            />
            <FpdcLogo size="lg" priority className="relative z-10 sm:hidden" />
            <FpdcLogo size="xl" priority className="relative z-10 hidden sm:flex" />
          </div>

          <p
            className={`mb-1.5 font-mono text-[9px] font-semibold uppercase tracking-[0.18em] sm:mb-2 sm:text-[10px] sm:tracking-[0.28em] ${
              isError
                ? 'text-rose-300/90'
                : isSuccess
                  ? 'text-emerald-300/90'
                  : 'text-cyan-300/80'
            }`}
          >
            {isError
              ? 'Security check failed'
              : isSuccess
                ? resolvedAction === 'logout'
                  ? 'Session closed'
                  : 'Session restored'
                : ROLE_LABEL[resolvedRole]}
            {!isError && !isSuccess && department ? ` · ${department}` : ''}
          </p>
          <h1 className="mb-2 px-1 text-xl font-bold leading-tight tracking-tight text-white sm:mb-3 sm:text-3xl">
            {title}
          </h1>
          <p
            className={`mx-auto mb-5 max-w-sm px-1 text-xs leading-relaxed sm:mb-6 sm:text-sm ${
              isError
                ? 'text-rose-200/85'
                : isSuccess
                  ? 'text-emerald-100/85'
                  : 'text-slate-400'
            }`}
          >
            {description}
          </p>

          {/* Service modules */}
          <div className="mb-5 grid grid-cols-2 gap-1.5 sm:mb-6 sm:grid-cols-4 sm:gap-2">
            {nodes.map((node, index) => {
              const isActive = !isError && !isSuccess && index === activeNode;
              const isDone = index < completedCount;
              return (
                <div
                  key={node.id}
                  className={`flex min-h-[2.25rem] items-center justify-center rounded-lg border px-1.5 py-1.5 font-mono text-[10px] transition-all duration-300 sm:min-h-0 sm:px-2 sm:py-2 sm:text-[11px] ${
                    isError
                      ? 'border-rose-400/25 bg-rose-500/5 text-rose-200/80'
                      : isSuccess || isDone
                        ? 'border-emerald-400/35 bg-emerald-500/10 text-emerald-200'
                        : isActive
                          ? 'border-cyan-400/40 bg-cyan-500/10 text-cyan-200'
                          : 'border-white/10 bg-white/[0.03] text-slate-400'
                  }`}
                >
                  <span className="mr-1 shrink-0 sm:mr-1.5">
                    {isError ? (
                      <span className="text-rose-400">×</span>
                    ) : isSuccess || (isDone && !isActive) ? (
                      <span className="text-emerald-400">✓</span>
                    ) : (
                      <span
                        className={`inline-block h-1.5 w-1.5 rounded-full ${
                          isActive ? 'bg-cyan-400 blueprint-pulse' : 'bg-emerald-500/70'
                        }`}
                      />
                    )}
                  </span>
                  <span className="truncate sm:hidden">{node.short}</span>
                  <span className="hidden truncate sm:inline">{node.label}</span>
                </div>
              );
            })}
          </div>

          {/* Action stages checklist */}
          <div
            className={`mb-5 rounded-xl border px-3 py-2.5 text-left sm:mb-6 ${
              isError
                ? 'border-rose-400/25 bg-rose-950/30'
                : isSuccess
                  ? 'border-emerald-400/25 bg-emerald-950/25'
                  : 'border-white/10 bg-black/25'
            }`}
          >
            <p className="mb-2 font-mono text-[9px] uppercase tracking-[0.18em] text-slate-500">
              {isError
                ? 'Auth result'
                : isSuccess
                  ? resolvedAction === 'logout'
                    ? 'Logout complete'
                    : 'Restore complete'
                  : resolvedAction === 'logout'
                    ? 'Sign-out pipeline'
                    : resolvedAction === 'session'
                      ? 'Restore pipeline'
                      : 'Service pipeline'}
            </p>
            <ul className="space-y-1.5">
              {(isError
                ? [
                    'Verify credentials',
                    'Access denied',
                    'Return to sign-in form',
                  ]
                : copy.stages
              ).map((stage, index) => {
                if (isError) {
                  const failed = index === 1;
                  const done = index === 0;
                  return (
                    <li
                      key={stage}
                      className={`flex items-center gap-2 font-mono text-[10px] sm:text-[11px] ${
                        failed
                          ? 'text-rose-300'
                          : done
                            ? 'text-slate-400'
                            : 'text-amber-300/90'
                      }`}
                    >
                      <span className="w-3 shrink-0 text-center">
                        {failed ? '×' : done ? '✓' : '●'}
                      </span>
                      <span className="truncate">{stage}</span>
                    </li>
                  );
                }

                const isDone = isSuccess || index < stageIndex;
                const isCurrent = !isSuccess && index === stageIndex;
                return (
                  <li
                    key={stage}
                    className={`flex items-center gap-2 font-mono text-[10px] sm:text-[11px] ${
                      isCurrent
                        ? 'text-cyan-300'
                        : isDone
                          ? 'text-emerald-300/90'
                          : 'text-slate-500'
                    }`}
                  >
                    <span className="w-3 shrink-0 text-center">
                      {isDone ? '✓' : isCurrent ? '●' : '○'}
                    </span>
                    <span className="truncate">{stage}</span>
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="mx-auto w-full">
            <div className="mb-2 flex items-center justify-between gap-3 font-mono text-[10px] text-slate-500 sm:text-[11px]">
              <span
                className={`min-w-0 truncate text-left ${
                  isError
                    ? 'text-rose-300/90'
                    : isSuccess
                      ? 'text-emerald-300/90'
                      : 'text-emerald-400/90'
                }`}
              >
                {statusLine}
              </span>
              <span className="shrink-0 tabular-nums">
                {isError ? 'FAILED' : isSuccess ? 'DONE' : `${Math.round(progress)}%`}
              </span>
            </div>
            <div className="relative h-1.5 overflow-hidden rounded-full bg-slate-800/80">
              <div
                className={`absolute inset-y-0 left-0 rounded-full transition-all duration-500 ease-out ${
                  isError
                    ? 'bg-gradient-to-r from-rose-600 via-rose-400 to-rose-600'
                    : 'bg-gradient-to-r from-emerald-500 via-cyan-400 to-emerald-500'
                }`}
                style={{ width: `${isError ? 28 : isSuccess ? 100 : progress}%` }}
              >
                {!isError && !isSuccess && (
                  <div className="absolute inset-0 animate-shimmer bg-white/20" />
                )}
              </div>
            </div>
            <p className="mt-3 font-mono text-[9px] tracking-wide text-slate-500 sm:mt-4 sm:text-[10px]">
              {isError ? (
                <span className="text-rose-300/80">Returning to form…</span>
              ) : isSuccess ? (
                <span className="text-emerald-300/80">
                  {resolvedAction === 'logout'
                    ? 'Redirecting to home…'
                    : 'Opening workspace…'}
                </span>
              ) : (
                <>
                  <span className="sm:hidden">{copy.layerMobile}</span>
                  <span className="hidden sm:inline">{copy.layer}</span>
                  <span className="blueprint-caret">_</span>
                </>
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
