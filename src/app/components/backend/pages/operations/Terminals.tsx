import React, { useState, useMemo } from 'react';
import { Cpu, Wifi, History } from 'lucide-react';
import {
  MOCK_TERMINALS,
  TERMINAL_STATUSES,
  type TerminalStatus,
  formatDateTime,
} from '../../../../domain';
import { OpsStatusPill } from '../../../shared/OpsStatusPill';

/**
 * Terminals — inventory + parameter editing surface.
 *
 * Selecting a terminal exposes its parameters and the immutable change
 * history. Real edits should go through a Supabase RPC that records a
 * `TerminalParameterChange` entry on save.
 */
export function Terminals() {
  const [filter, setFilter] = useState<'all' | TerminalStatus>('all');
  const [selectedId, setSelectedId] = useState<string>(MOCK_TERMINALS[0]?.id ?? '');

  const filtered = useMemo(
    () => MOCK_TERMINALS.filter((t) => (filter === 'all' ? true : t.status === filter)),
    [filter],
  );
  const selected = MOCK_TERMINALS.find((t) => t.id === selectedId);

  return (
    <div className="px-6 py-6 space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-gray-900">Terminals</h1>
        <p className="text-sm text-gray-500 mt-1">Inventory, status, and parameter management with immutable change history.</p>
      </header>

      <div className="flex items-center gap-3">
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value as 'all' | TerminalStatus)}
          className="text-sm border border-gray-200 rounded-md px-3 py-2 bg-white"
        >
          <option value="all">All statuses</option>
          {TERMINAL_STATUSES.map((s) => (
            <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="lg:col-span-2 bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
            <Cpu className="w-4 h-4 text-indigo-600" />
            <h2 className="font-semibold text-gray-900">Inventory</h2>
          </div>
          <ul className="divide-y divide-gray-100">
            {filtered.map((t) => (
              <li key={t.id}>
                <button
                  onClick={() => setSelectedId(t.id)}
                  className={`w-full text-left p-3 hover:bg-gray-50 ${t.id === selectedId ? 'bg-indigo-50/40' : ''}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs text-gray-700">{t.serialNumber}</span>
                    <OpsStatusPill status={t.status} />
                  </div>
                  <p className="font-semibold text-gray-900 mt-1">{t.model}</p>
                  <p className="text-xs text-gray-500">{t.merchantName}</p>
                  <p className="text-[11px] text-gray-400 mt-1 flex items-center gap-1"><Wifi className="w-3 h-3" />last seen {formatDateTime(t.lastSeenAt)}</p>
                </button>
              </li>
            ))}
            {filtered.length === 0 && (
              <li className="p-6 text-center text-gray-500 text-sm">No terminals match the current filters.</li>
            )}
          </ul>
        </div>

        <div className="lg:col-span-3 space-y-4">
          {selected ? (
            <>
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500">Terminal</p>
                    <h2 className="font-semibold text-gray-900">{selected.model} <span className="font-mono text-xs text-gray-500">({selected.serialNumber})</span></h2>
                    <p className="text-xs text-gray-500 mt-1">Firmware {selected.firmwareVersion} · Merchant {selected.merchantName}</p>
                  </div>
                  <OpsStatusPill status={selected.status} />
                </div>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <h3 className="px-4 py-3 border-b border-gray-100 font-semibold text-gray-900">Parameters</h3>
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200 text-left">
                    <tr>
                      <th className="px-4 py-2 text-[11px] font-semibold text-gray-600 uppercase tracking-wide">Key</th>
                      <th className="px-4 py-2 text-[11px] font-semibold text-gray-600 uppercase tracking-wide">Label</th>
                      <th className="px-4 py-2 text-[11px] font-semibold text-gray-600 uppercase tracking-wide">Value</th>
                      <th className="px-4 py-2 text-[11px] font-semibold text-gray-600 uppercase tracking-wide">Category</th>
                      <th className="px-4 py-2 text-[11px] font-semibold text-gray-600 uppercase tracking-wide">Editable</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {selected.parameters.map((p) => (
                      <tr key={p.key}>
                        <td className="px-4 py-2 font-mono text-xs">{p.key}</td>
                        <td className="px-4 py-2 text-gray-900">{p.label}</td>
                        <td className="px-4 py-2 font-mono text-xs">{p.value}</td>
                        <td className="px-4 py-2"><OpsStatusPill status={p.category} tone="info" /></td>
                        <td className="px-4 py-2 text-xs text-gray-500">{p.editable ? 'Yes' : 'No'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="flex items-center gap-2 mb-2"><History className="w-4 h-4 text-gray-600" /><h3 className="font-semibold text-gray-900">Change history</h3></div>
                {selected.changeHistory.length === 0 ? (
                  <p className="text-sm text-gray-500">No parameter changes recorded.</p>
                ) : (
                  <ul className="space-y-2 text-sm">
                    {selected.changeHistory.map((c) => (
                      <li key={c.id} className="border-l-2 border-indigo-200 pl-3">
                        <p className="text-xs text-gray-500">{formatDateTime(c.updatedAt)} · {c.updatedBy}</p>
                        <p className="text-gray-900">
                          <span className="font-mono">{c.parameterKey}</span>: <span className="line-through text-gray-400">{c.oldValue}</span> → <span className="font-medium">{c.newValue}</span>
                        </p>
                        {c.reason && <p className="text-xs text-gray-500">Reason: {c.reason}</p>}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </>
          ) : (
            <div className="bg-white rounded-lg border border-gray-200 p-8 text-center text-gray-500 text-sm">Select a terminal to view its parameters.</div>
          )}
        </div>
      </div>
    </div>
  );
}
