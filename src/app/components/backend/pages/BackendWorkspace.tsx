import React, { useState, useEffect } from 'react';
import { Inbox, Mail, Activity, CheckSquare } from 'lucide-react';
import { BackendInbox } from './BackendInbox';
import { BackendActivityTimeline } from './BackendActivityTimeline';
import { BackendTasks } from './BackendTasks';
import { useAppNavigate } from '../NavigationContext';

// ═══════════════════════════════════════════
// ── WORKSPACE (consolidated shell) ──
// Replaces the standalone Inbox / Activity Timeline / Tasks pages.
// Tab is driven by the current route so deep links stay valid:
//   /workspace          → inbox (default)
//   /workspace/inbox    → inbox
//   /workspace/activity → activity
//   /workspace/tasks    → tasks
// Legacy paths /inbox, /activity-timeline, /tasks are also routed here
// (see DeltBackendLayout) so existing links continue to work.
// ═══════════════════════════════════════════

type WorkspaceTab = 'inbox' | 'activity' | 'tasks';

const TABS: { id: WorkspaceTab; label: string; icon: React.ComponentType<{ className?: string }>; path: string }[] = [
  { id: 'inbox',    label: 'Inbox',    icon: Mail,        path: '/workspace/inbox' },
  { id: 'activity', label: 'Activity', icon: Activity,    path: '/workspace/activity' },
  { id: 'tasks',    label: 'Tasks',    icon: CheckSquare, path: '/workspace/tasks' },
];

function tabFromPath(path: string): WorkspaceTab {
  if (path.endsWith('/activity') || path === '/activity-timeline') return 'activity';
  if (path.endsWith('/tasks') || path === '/tasks') return 'tasks';
  return 'inbox';
}

export function BackendWorkspace() {
  const { navigate, currentPage } = useAppNavigate();
  const [tab, setTab] = useState<WorkspaceTab>(() => tabFromPath(currentPage));

  // Keep tab in sync if route changes externally (e.g. command palette).
  useEffect(() => {
    setTab(tabFromPath(currentPage));
  }, [currentPage]);

  const handleTab = (next: WorkspaceTab) => {
    setTab(next);
    const target = TABS.find(t => t.id === next);
    if (target && currentPage !== target.path) navigate(target.path);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Shared tab bar */}
      <div className="px-6 pt-5 border-b border-gray-200 bg-white">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-[8px] bg-gradient-to-br from-brand to-brand-light flex items-center justify-center shadow-sm">
            <Inbox className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Workspace</h1>
            <p className="text-sm text-gray-500">Inbox, activity, and tasks &mdash; all in one place</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {TABS.map(t => {
            const Icon = t.icon;
            const active = t.id === tab;
            return (
              <button
                key={t.id}
                onClick={() => handleTab(t.id)}
                className={[
                  'flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors',
                  active
                    ? 'text-brand border-brand'
                    : 'text-gray-500 border-transparent hover:text-gray-900',
                ].join(' ')}
              >
                <Icon className="w-4 h-4" />
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Body — render the underlying page; its own header acts as the tab's sub-header */}
      <div className="flex-1 min-h-0 overflow-auto">
        {tab === 'inbox' && <BackendInbox />}
        {tab === 'activity' && <BackendActivityTimeline />}
        {tab === 'tasks' && <BackendTasks />}
      </div>
    </div>
  );
}
