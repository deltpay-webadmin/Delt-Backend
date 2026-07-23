import React, { useState } from 'react';
import { Package, Save, ChevronDown, X } from 'lucide-react';
import { Button } from '../ui';

interface BundleRow {
  id: string;
  name: string;
  description: string;
  amount: number;
  expiration: number;
  categories: string[];
  type: 'auto' | 'manual';
}

const categoryOptions = [
  'Restaurant', 'Retail', 'Medical', 'Auto', 'Construction',
  'Fitness', 'Salon/Spa', 'Transportation', 'E-Commerce', 'Professional Services',
];

const initialBundles: BundleRow[] = [
  { id: 'welcome', name: 'Welcome Bundle', description: 'Issued to every new merchant', amount: 500, expiration: 30, categories: [], type: 'auto' },
  { id: 'referrer', name: 'Referrer Reward', description: 'Auto-issued when a referral converts', amount: 200, expiration: 30, categories: [], type: 'auto' },
  { id: 'retention-light', name: 'Retention — Light', description: 'Manual, from Save Playbook', amount: 200, expiration: 30, categories: [], type: 'manual' },
  { id: 'retention-medium', name: 'Retention — Medium', description: 'Manual', amount: 350, expiration: 30, categories: [], type: 'manual' },
  { id: 'retention-full', name: 'Retention — Full', description: 'Manual', amount: 500, expiration: 30, categories: [], type: 'manual' },
];

const fmt = (n: number) => `$${n.toLocaleString()}`;

export function BackendBundles() {
  const [bundles, setBundles] = useState<BundleRow[]>(initialBundles);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<BundleRow | null>(null);
  const [defaultExpiration, setDefaultExpiration] = useState(30);
  const [autoWelcome, setAutoWelcome] = useState(true);
  const [autoReferrer, setAutoReferrer] = useState(true);
  const [saved, setSaved] = useState(false);
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);

  const startEdit = (bundle: BundleRow) => {
    setEditingId(bundle.id);
    setEditDraft({ ...bundle, categories: [...bundle.categories] });
    setCategoryDropdownOpen(false);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditDraft(null);
    setCategoryDropdownOpen(false);
  };

  const saveEdit = () => {
    if (!editDraft) return;
    setBundles((prev) => prev.map((b) => (b.id === editDraft.id ? editDraft : b)));
    setEditingId(null);
    setEditDraft(null);
    setCategoryDropdownOpen(false);
  };

  const toggleCategory = (cat: string) => {
    if (!editDraft) return;
    const cats = editDraft.categories.includes(cat)
      ? editDraft.categories.filter((c) => c !== cat)
      : [...editDraft.categories, cat];
    setEditDraft({ ...editDraft, categories: cats });
  };

  const handleSaveAll = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-[1440px] mx-auto px-6 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Bundle Settings</h1>
            <p className="text-sm text-gray-500 mt-0.5">Configure credit amounts, expiration periods, and automation rules for merchant bundles.</p>
          </div>
          <Button icon={<Save />} onClick={handleSaveAll}>{saved ? 'Saved!' : 'Save Changes'}</Button>
        </div>

        {/* Section 1: Credit Amounts */}
        <div className="bg-white rounded-[8px] border border-gray-200">
          <div className="px-5 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Credit Amounts</h2>
            <p className="text-xs text-gray-500 mt-0.5">Set the dollar value, expiration, and eligible categories for each bundle type.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/60">
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Bundle</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Expiration</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Categories</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="text-right px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {bundles.map((bundle) => {
                  const isEditing = editingId === bundle.id;
                  const draft = isEditing ? editDraft! : bundle;

                  return (
                    <tr key={bundle.id} className={`${isEditing ? 'bg-brand-50/30' : 'hover:bg-gray-50'} transition-colors`}>
                      <td className="px-5 py-3.5">
                        <span className="font-medium text-gray-900">{bundle.name}</span>
                      </td>
                      <td className="px-5 py-3.5 text-gray-500 text-xs">{bundle.description}</td>
                      <td className="px-5 py-3.5">
                        {isEditing ? (
                          <div className="relative w-28">
                            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                            <input
                              type="number"
                              value={draft.amount}
                              onChange={(e) => setEditDraft({ ...draft, amount: Number(e.target.value) })}
                              className="w-full pl-6 pr-2 py-1.5 border border-gray-300 rounded-[8px] text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
                            />
                          </div>
                        ) : (
                          <span className="font-semibold text-gray-900">{fmt(bundle.amount)}</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        {isEditing ? (
                          <div className="relative w-24">
                            <input
                              type="number"
                              value={draft.expiration}
                              onChange={(e) => setEditDraft({ ...draft, expiration: Number(e.target.value) })}
                              className="w-full pl-2.5 pr-8 py-1.5 border border-gray-300 rounded-[8px] text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
                            />
                            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs">days</span>
                          </div>
                        ) : (
                          <span className="text-gray-700">{bundle.expiration} days</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        {isEditing ? (
                          <div className="relative">
                            <button
                              onClick={() => setCategoryDropdownOpen(!categoryDropdownOpen)}
                              className="flex items-center gap-1.5 px-2.5 py-1.5 border border-gray-300 rounded-[8px] text-sm text-gray-700 hover:bg-gray-50 min-w-[140px]"
                            >
                              <span className="truncate">
                                {draft.categories.length === 0 ? 'All categories' : `${draft.categories.length} selected`}
                              </span>
                              <ChevronDown className="w-3.5 h-3.5 text-gray-400 ml-auto shrink-0" />
                            </button>
                            {categoryDropdownOpen && (
                              <div className="absolute z-20 top-full left-0 mt-1 bg-white border border-gray-200 rounded-[8px] shadow-lg py-1.5 w-52 max-h-48 overflow-y-auto">
                                {categoryOptions.map((cat) => (
                                  <label
                                    key={cat}
                                    className="flex items-center gap-2.5 px-3 py-1.5 hover:bg-gray-50 cursor-pointer text-sm"
                                  >
                                    <input
                                      type="checkbox"
                                      checked={draft.categories.includes(cat)}
                                      onChange={() => toggleCategory(cat)}
                                      className="rounded border-gray-300 text-brand focus:ring-brand"
                                    />
                                    <span className="text-gray-700">{cat}</span>
                                  </label>
                                ))}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-500 text-xs">
                            {bundle.categories.length === 0 ? (
                              <span className="text-gray-400">All categories</span>
                            ) : (
                              bundle.categories.join(', ')
                            )}
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${
                          bundle.type === 'auto'
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {bundle.type === 'auto' ? 'Auto' : 'Manual'}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        {isEditing ? (
                          <div className="flex items-center justify-end gap-2">
                            <Button variant="secondary" size="sm" onClick={cancelEdit}>Cancel</Button>
                            <Button size="sm" onClick={saveEdit}>Apply</Button>
                          </div>
                        ) : (
                          <button
                            onClick={() => startEdit(bundle)}
                            className="px-3 py-1.5 text-xs font-medium text-brand hover:bg-brand-50 rounded-[8px] transition-colors"
                          >
                            Edit
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Section 2: Defaults */}
        <div className="bg-white rounded-[8px] border border-gray-200">
          <div className="px-5 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Defaults</h2>
            <p className="text-xs text-gray-500 mt-0.5">Global bundle defaults and automation toggles.</p>
          </div>
          <div className="px-5 py-5 space-y-5">
            {/* Default expiration */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">Default expiration</p>
                <p className="text-xs text-gray-500 mt-0.5">Applied to new bundles unless overridden per row above.</p>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={defaultExpiration}
                  onChange={(e) => setDefaultExpiration(Number(e.target.value))}
                  className="w-20 px-2.5 py-1.5 border border-gray-300 rounded-[8px] text-sm text-center focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
                />
                <span className="text-sm text-gray-500">days</span>
              </div>
            </div>

            <div className="border-t border-gray-100" />

            {/* Auto-assign welcome bundle */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">Auto-assign welcome bundle on onboarding</p>
                <p className="text-xs text-gray-500 mt-0.5">Automatically issue the Welcome Bundle when a new merchant completes onboarding.</p>
              </div>
              <button
                onClick={() => setAutoWelcome(!autoWelcome)}
                className={`relative w-11 h-6 rounded-full transition-colors ${autoWelcome ? 'bg-brand' : 'bg-gray-300'}`}
              >
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${autoWelcome ? 'translate-x-5' : 'translate-x-0'}`} />
              </button>
            </div>

            <div className="border-t border-gray-100" />

            {/* Auto-assign referrer reward */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">Auto-assign referrer reward on conversion</p>
                <p className="text-xs text-gray-500 mt-0.5">Automatically issue the Referrer Reward when a referred lead converts to a merchant.</p>
              </div>
              <button
                onClick={() => setAutoReferrer(!autoReferrer)}
                className={`relative w-11 h-6 rounded-full transition-colors ${autoReferrer ? 'bg-brand' : 'bg-gray-300'}`}
              >
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${autoReferrer ? 'translate-x-5' : 'translate-x-0'}`} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
