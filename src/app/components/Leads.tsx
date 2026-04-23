import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Plus, 
  Search, 
  Filter, 
  Phone, 
  Mail, 
  Building2, 
  Calendar, 
  User,
  TrendingUp,
  DollarSign,
  Clock,
  Edit2,
  Trash2,
  X,
  CheckCircle,
  XCircle,
  AlertCircle,
  ArrowRight,
  FileText,
  PhoneCall,
  MessageSquare,
  ChevronDown
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { FullLeadProfile } from './FullLeadProfile';

export interface Lead {
  id: string;
  businessName: string;
  contactName: string;
  email: string;
  phone: string;
  industry?: string;
  estimatedRevenue?: number;
  requestedAmount?: number;
  leadType: 'MCA Loan' | 'Residual Income';
  status: 'New' | 'In Progress' | 'Closed (Won)' | 'Closed (Lost)';
  priority: 'Low' | 'Medium' | 'High';
  source?: string;
  assignedTo?: string;
  notes?: string;
  createdDate: string;
  leadDate?: string;
  lastContactDate?: string;
  nextFollowUp?: string;
  tags?: string[];
  conversionProbability?: number;
  creditScore?: string;
  processingPayments?: boolean;
  hasBusinessBankAccount?: boolean;
  state?: string;
  notesHistory?: LeadNote[];
  attachments?: LeadAttachment[];
}

export interface LeadNote {
  id: string;
  leadId: string;
  note: string;
  createdBy: string;
  createdAt: string;
}

export interface LeadAttachment {
  id: string;
  leadId: string;
  fileName: string;
  fileUrl: string;
  uploadedBy: string;
  uploadedAt: string;
}

interface LeadsProps {
  user: {
    email: string;
    name: string;
    role: string;
  };
  onConvertToDeal?: (lead: Lead) => void;
}

export function Leads({ user, onConvertToDeal }: LeadsProps) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [showNewLeadDrawer, setShowNewLeadDrawer] = useState(false);
  const [showLeadDetails, setShowLeadDetails] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [leadToDelete, setLeadToDelete] = useState<string | null>(null);
  const [showFullLeadView, setShowFullLeadView] = useState(false);
  const [editingStatusId, setEditingStatusId] = useState<string | null>(null);

  useEffect(() => {
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-e3e3d1af/leads`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch leads');
      }

      const data = await response.json();
      setLeads(data.leads || []);
    } catch (error) {
      console.error('Error fetching leads:', error);
      toast.error('Failed to load leads');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateLead = async (leadData: Partial<Lead>) => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-e3e3d1af/leads`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...leadData,
            createdDate: new Date().toISOString(),
            status: 'New',
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to create lead');
      }

      const data = await response.json();
      toast.success('Lead created successfully!');
      fetchLeads();
      setShowNewLeadDrawer(false);
    } catch (error) {
      console.error('Error creating lead:', error);
      toast.error('Failed to create lead');
    }
  };

  const handleUpdateLead = async (leadId: string, updates: Partial<Lead>) => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-e3e3d1af/leads/${leadId}`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updates),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to update lead');
      }

      toast.success('Lead updated successfully!');
      fetchLeads();
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating lead:', error);
      toast.error('Failed to update lead');
    }
  };

  const handleQuickStatusUpdate = async (leadId: string, newStatus: Lead['status']) => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-e3e3d1af/leads/${leadId}`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ status: newStatus }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to update lead status');
      }

      toast.success('Status updated successfully!');
      fetchLeads();
      setEditingStatusId(null);
    } catch (error) {
      console.error('Error updating lead status:', error);
      toast.error('Failed to update status');
    }
  };

  const handleDeleteLead = async () => {
    if (!leadToDelete) return;

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-e3e3d1af/leads/${leadToDelete}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to delete lead');
      }

      toast.success('Lead deleted successfully!');
      fetchLeads();
      setShowLeadDetails(false);
      setSelectedLead(null);
      setShowDeleteConfirm(false);
      setLeadToDelete(null);
    } catch (error) {
      console.error('Error deleting lead:', error);
      toast.error('Failed to delete lead');
      setShowDeleteConfirm(false);
      setLeadToDelete(null);
    }
  };

  const confirmDelete = (leadId: string) => {
    setLeadToDelete(leadId);
    setShowDeleteConfirm(true);
  };

  const filteredLeads = leads.filter(lead => {
    const matchesSearch = 
      lead.businessName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.contactName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.phone.includes(searchTerm);
    
    const matchesStatus = statusFilter === 'all' || lead.status === statusFilter;
    const matchesType = typeFilter === 'all' || lead.leadType === typeFilter;
    const matchesPriority = priorityFilter === 'all' || lead.priority === priorityFilter;

    return matchesSearch && matchesStatus && matchesType && matchesPriority;
  });

  // Pagination
  const totalFilteredLeads = filteredLeads.length;
  const totalPages = Math.ceil(totalFilteredLeads / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedLeads = filteredLeads.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, typeFilter, priorityFilter]);

  // Calculate stats
  const stats = {
    total: leads.length,
    new: leads.filter(l => l.status === 'New').length,
    inProgress: leads.filter(l => l.status === 'In Progress').length,
    won: leads.filter(l => l.status === 'Closed (Won)').length,
    conversionRate: leads.length > 0 
      ? ((leads.filter(l => l.status === 'Closed (Won)').length / leads.length) * 100).toFixed(1)
      : '0.0',
  };

  const getStatusColor = (status: Lead['status']) => {
    const colors = {
      'New': 'bg-blue-100 text-blue-700',
      'In Progress': 'bg-purple-100 text-purple-700',
      'Closed (Won)': 'bg-green-100 text-green-700',
      'Closed (Lost)': 'bg-red-100 text-red-700',
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  const getPriorityColor = (priority: Lead['priority']) => {
    const colors = {
      'Low': 'bg-gray-100 text-gray-600',
      'Medium': 'bg-yellow-100 text-yellow-700',
      'High': 'bg-red-100 text-red-700',
    };
    return colors[priority] || 'bg-gray-100 text-gray-600';
  };

  return (
    <div className="flex-1 bg-gray-50 overflow-auto">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl text-gray-900">Sales Leads</h1>
              <p className="text-sm text-gray-500 mt-1">Manage your MCA Loan and Residual Income leads</p>
            </div>
            <button
              onClick={() => setShowNewLeadDrawer(true)}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>New Lead</span>
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4 mt-6">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
              <div className="flex items-center justify-between">
                <Users className="w-8 h-8 text-blue-600" />
                <span className="text-2xl text-blue-700">{stats.total}</span>
              </div>
              <p className="text-xs text-blue-600 mt-2">Total Leads</p>
            </div>
            <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl p-4 border border-emerald-200">
              <div className="flex items-center justify-between">
                <AlertCircle className="w-8 h-8 text-emerald-600" />
                <span className="text-2xl text-emerald-700">{stats.new}</span>
              </div>
              <p className="text-xs text-emerald-600 mt-2">New Leads</p>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
              <div className="flex items-center justify-between">
                <Clock className="w-8 h-8 text-purple-600" />
                <span className="text-2xl text-purple-700">{stats.inProgress}</span>
              </div>
              <p className="text-xs text-purple-600 mt-2">In Progress</p>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
              <div className="flex items-center justify-between">
                <TrendingUp className="w-8 h-8 text-green-600" />
                <span className="text-2xl text-green-700">{stats.won}</span>
              </div>
              <p className="text-xs text-green-600 mt-2">Won</p>
            </div>
            <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-4 border border-orange-200">
              <div className="flex items-center justify-between">
                <DollarSign className="w-8 h-8 text-orange-600" />
                <span className="text-2xl text-orange-700">{stats.conversionRate}%</span>
              </div>
              <p className="text-xs text-orange-600 mt-2">Conversion Rate</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="px-4 sm:px-6 lg:px-8 py-4 bg-white border-b border-gray-200">
        <div className="flex flex-col lg:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by business name, contact, email, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
            />
          </div>

          {/* Filters */}
          <div className="flex gap-2 flex-wrap lg:flex-nowrap">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none bg-white text-sm"
            >
              <option value="all">All Statuses</option>
              <option value="New">New</option>
              <option value="In Progress">In Progress</option>
              <option value="Closed (Won)">Closed (Won)</option>
              <option value="Closed (Lost)">Closed (Lost)</option>
            </select>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none bg-white text-sm"
            >
              <option value="all">All Types</option>
              <option value="MCA Loan">MCA Loan</option>
              <option value="Residual Income">Residual Income</option>
            </select>

            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none bg-white text-sm"
            >
              <option value="all">All Priorities</option>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </select>
          </div>
        </div>
      </div>

      {/* Leads Table */}
      <div className="px-4 sm:px-6 lg:px-8 py-6">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
          </div>
        ) : filteredLeads.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg text-gray-900 mb-2">No leads found</h3>
            <p className="text-sm text-gray-500 mb-6">
              {searchTerm || statusFilter !== 'all' || typeFilter !== 'all' || priorityFilter !== 'all'
                ? 'Try adjusting your filters or search terms'
                : 'Get started by creating your first lead'}
            </p>
            {!searchTerm && statusFilter === 'all' && typeFilter === 'all' && priorityFilter === 'all' && (
              <button
                onClick={() => setShowNewLeadDrawer(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Create First Lead
              </button>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-max">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs text-gray-600 uppercase tracking-wider whitespace-nowrap">Business</th>
                    <th className="px-4 py-3 text-left text-xs text-gray-600 uppercase tracking-wider whitespace-nowrap">Contact</th>
                    <th className="px-4 py-3 text-left text-xs text-gray-600 uppercase tracking-wider whitespace-nowrap">Type</th>
                    <th className="px-4 py-3 text-left text-xs text-gray-600 uppercase tracking-wider whitespace-nowrap">Lead Source</th>
                    <th className="px-4 py-3 text-left text-xs text-gray-600 uppercase tracking-wider whitespace-nowrap">Monthly Sales</th>
                    <th className="px-4 py-3 text-left text-xs text-gray-600 uppercase tracking-wider whitespace-nowrap">Amount Requested</th>
                    <th className="px-4 py-3 text-left text-xs text-gray-600 uppercase tracking-wider whitespace-nowrap">Status</th>
                    <th className="px-4 py-3 text-left text-xs text-gray-600 uppercase tracking-wider whitespace-nowrap">Priority</th>
                    <th className="px-4 py-3 text-left text-xs text-gray-600 uppercase tracking-wider whitespace-nowrap">Lead Date</th>
                    <th className="px-4 py-3 text-left text-xs text-gray-600 uppercase tracking-wider whitespace-nowrap">Created</th>
                    <th className="px-4 py-3 text-left text-xs text-gray-600 uppercase tracking-wider whitespace-nowrap">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {paginatedLeads.map((lead) => (
                    <tr 
                      key={lead.id} 
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => {
                        setSelectedLead(lead);
                        setShowLeadDetails(true);
                      }}
                    >
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Building2 className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{lead.businessName}</p>
                            {lead.industry && (
                              <p className="text-xs text-gray-500">{lead.industry}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div>
                          <p className="text-sm text-gray-900">{lead.contactName}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Mail className="w-3 h-3 text-gray-400" />
                            <p className="text-xs text-gray-500">{lead.email}</p>
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <Phone className="w-3 h-3 text-gray-400" />
                            <p className="text-xs text-gray-500">{lead.phone}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium ${
                          lead.leadType === 'MCA Loan' 
                            ? 'bg-blue-100 text-blue-700' 
                            : 'bg-purple-100 text-purple-700'
                        }`}>
                          {lead.leadType}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <p className="text-sm text-gray-900 whitespace-nowrap">
                          {lead.source || '—'}
                        </p>
                      </td>
                      <td className="px-4 py-4">
                        <p className="text-sm font-medium text-gray-900 whitespace-nowrap">
                          {lead.estimatedRevenue ? `$${lead.estimatedRevenue.toLocaleString()}` : '—'}
                        </p>
                      </td>
                      <td className="px-4 py-4">
                        <p className="text-sm font-semibold text-gray-900 whitespace-nowrap">
                          {lead.requestedAmount ? `$${lead.requestedAmount.toLocaleString()}` : '—'}
                        </p>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        {editingStatusId === lead.id ? (
                          <select
                            value={lead.status}
                            onChange={(e) => {
                              handleQuickStatusUpdate(lead.id, e.target.value as Lead['status']);
                            }}
                            onBlur={() => setEditingStatusId(null)}
                            autoFocus
                            className="px-2.5 py-1 text-xs font-medium rounded-lg border border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                          >
                            <option value="New">New</option>
                            <option value="In Progress">In Progress</option>
                            <option value="Closed (Won)">Closed (Won)</option>
                            <option value="Closed (Lost)">Closed (Lost)</option>
                          </select>
                        ) : (
                          <span 
                            onClick={() => setEditingStatusId(lead.id)}
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium cursor-pointer hover:opacity-80 transition-opacity ${getStatusColor(lead.status)}`}
                          >
                            {lead.status}
                            <ChevronDown className="w-3 h-3" />
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium ${getPriorityColor(lead.priority)}`}>
                          {lead.priority}
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        {lead.leadDate ? (
                          <div>
                            <div className="text-xs text-gray-900">
                              {new Date(lead.leadDate).toLocaleDateString()}
                            </div>
                            <div className="text-xs text-gray-500">
                              {new Date(lead.leadDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 text-xs text-gray-500">
                          <Calendar className="w-3 h-3" />
                          {new Date(lead.createdDate).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setSelectedLead(lead);
                              setIsEditing(true);
                              setShowLeadDetails(true);
                            }}
                            className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded transition-colors"
                            title="Edit lead"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => confirmDelete(lead.id)}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="Delete lead"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {!loading && filteredLeads.length > 0 && (
              <div className="px-4 py-3 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-700">
                    Showing {startIndex + 1} to {Math.min(endIndex, totalFilteredLeads)} of {totalFilteredLeads} leads
                  </span>
                  <select
                    value={itemsPerPage}
                    onChange={(e) => {
                      setItemsPerPage(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="ml-2 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                  >
                    <option value={10}>10 per page</option>
                    <option value={25}>25 per page</option>
                    <option value={50}>50 per page</option>
                    <option value={100}>100 per page</option>
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1.5 border border-gray-300 rounded text-sm hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Previous
                  </button>
                  <span className="text-sm text-gray-700">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1.5 border border-gray-300 rounded text-sm hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <>
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 transition-opacity"
            onClick={() => {
              setShowDeleteConfirm(false);
              setLeadToDelete(null);
            }}
          />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md">
            <div className="bg-white rounded-xl shadow-2xl p-6 m-4">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-100 mx-auto mb-4">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">
                Delete Lead
              </h3>
              <p className="text-sm text-gray-600 text-center mb-6">
                Are you sure you want to delete this lead? This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setLeadToDelete(null);
                  }}
                  className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteLead}
                  className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* New Lead Drawer */}
      {showNewLeadDrawer && (
        <LeadFormDrawer
          onClose={() => setShowNewLeadDrawer(false)}
          onSave={handleCreateLead}
          user={user}
        />
      )}

      {/* Lead Details Drawer */}
      {showLeadDetails && selectedLead && !showFullLeadView && (
        <LeadDetailsDrawer
          lead={selectedLead}
          onClose={() => {
            setShowLeadDetails(false);
            setSelectedLead(null);
            setIsEditing(false);
          }}
          onUpdate={handleUpdateLead}
          onDelete={confirmDelete}
          onConvertToDeal={onConvertToDeal}
          isEditing={isEditing}
          setIsEditing={setIsEditing}
          onViewFullProfile={() => {
            setShowLeadDetails(false);
            setShowFullLeadView(true);
          }}
        />
      )}

      {/* Full Lead Profile View */}
      {showFullLeadView && selectedLead && (
        <FullLeadProfile
          lead={selectedLead}
          user={user}
          onClose={() => {
            setShowFullLeadView(false);
            setSelectedLead(null);
          }}
          onUpdate={handleUpdateLead}
        />
      )}
    </div>
  );
}

// New Lead Form Drawer Component
function LeadFormDrawer({ 
  onClose, 
  onSave, 
  user 
}: { 
  onClose: () => void; 
  onSave: (lead: Partial<Lead>) => void;
  user: { name: string; email: string; role: string };
}) {
  const [formData, setFormData] = useState<Partial<Lead>>({
    leadType: 'MCA Loan',
    priority: 'Medium',
    assignedTo: user.name,
    status: 'New',
  });
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');

  const industries = [
    'Restaurants & Food Service',
    'Bars & Nightclubs',
    'Retail - Clothing & Apparel',
    'Retail - Electronics',
    'Retail - General Merchandise',
    'Healthcare - Medical Practice',
    'Healthcare - Dental',
    'Healthcare - Veterinary',
    'Professional Services - Legal',
    'Professional Services - Accounting',
    'Professional Services - Consulting',
    'Construction - General Contractor',
    'Construction - Specialty Trade',
    'Real Estate',
    'Automotive - Sales',
    'Automotive - Repair & Service',
    'Beauty & Personal Care - Salon',
    'Beauty & Personal Care - Spa',
    'Fitness & Wellness',
    'Hospitality - Hotels & Lodging',
    'Transportation & Logistics',
    'Manufacturing',
    'Wholesale & Distribution',
    'Technology & IT Services',
    'Marketing & Advertising',
    'Entertainment & Recreation',
    'Education & Training',
    'Home Services - Plumbing',
    'Home Services - HVAC',
    'Home Services - Electrical',
    'Home Services - Landscaping',
    'Cleaning Services',
    'E-commerce',
    'Insurance',
    'Financial Services',
    'Other'
  ];

  const revenueRanges = [
    { label: '$0 - $10K', value: 5000 },
    { label: '$10K - $25K', value: 17500 },
    { label: '$25K - $50K', value: 37500 },
    { label: '$50K - $100K', value: 75000 },
    { label: '$100K - $250K', value: 175000 },
    { label: '$250K - $500K', value: 375000 },
    { label: '$500K+', value: 500000 }
  ];

  const requestedAmountOptions = [
    { label: '$5,000', value: 5000 },
    { label: '$10,000', value: 10000 },
    { label: '$15,000', value: 15000 },
    { label: '$20,000', value: 20000 },
    { label: '$25,000', value: 25000 },
    { label: '$30,000', value: 30000 },
    { label: '$40,000', value: 40000 },
    { label: '$50,000', value: 50000 },
    { label: '$75,000', value: 75000 },
    { label: '$100,000', value: 100000 },
    { label: '$150,000', value: 150000 },
    { label: '$200,000', value: 200000 },
    { label: '$250,000', value: 250000 },
    { label: '$300,000+', value: 300000 }
  ];

  const creditScoreRanges = [
    { label: 'Excellent (720-850)', value: 'Excellent (720-850)' },
    { label: 'Good (680-719)', value: 'Good (680-719)' },
    { label: 'Fair (640-679)', value: 'Fair (640-679)' },
    { label: 'Poor (580-639)', value: 'Poor (580-639)' },
    { label: 'Very Poor (300-579)', value: 'Very Poor (300-579)' }
  ];

  const usStates = [
    'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut', 
    'Delaware', 'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa', 
    'Kansas', 'Kentucky', 'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan', 
    'Minnesota', 'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire', 
    'New Jersey', 'New Mexico', 'New York', 'North Carolina', 'North Dakota', 'Ohio', 
    'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota', 
    'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington', 'West Virginia', 
    'Wisconsin', 'Wyoming'
  ];

  const formatPhoneNumber = (value: string) => {
    const digits = value.replace(/\D/g, '');
    
    if (digits.length <= 3) {
      return digits;
    } else if (digits.length <= 6) {
      return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    } else {
      return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setFormData({ ...formData, phone: formatted });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.businessName || !firstName || !lastName || !formData.email || !formData.phone) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    // Combine first and last name
    const contactName = `${firstName} ${lastName}`.trim();
    onSave({ ...formData, contactName });
  };

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 transition-opacity"
        onClick={onClose}
      />
      
      {/* Drawer */}
      <div className="fixed right-0 top-0 h-full w-full sm:max-w-2xl bg-white shadow-2xl z-50 overflow-y-auto transform transition-transform">
        <div className="p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h2 className="text-xl sm:text-2xl text-gray-900">New Lead</h2>
            <button 
              onClick={onClose} 
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
          {/* Lead Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Lead Type *</label>
            <select
              value={formData.leadType}
              onChange={(e) => setFormData({ ...formData, leadType: e.target.value as Lead['leadType'] })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
              required
            >
              <option value="MCA Loan">MCA Loan</option>
              <option value="Residual Income">Residual Income</option>
            </select>
          </div>

          {/* Business Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Business Name *</label>
              <input
                type="text"
                value={formData.businessName || ''}
                onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Industry</label>
              <select
                value={formData.industry || ''}
                onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
              >
                <option value="">Select Industry</option>
                {industries.map(industry => (
                  <option key={industry} value={industry}>{industry}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Contact Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">First Name *</label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Last Name *</label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
              <input
                type="email"
                value={formData.email || ''}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Phone *</label>
              <input
                type="tel"
                value={formData.phone || ''}
                onChange={handlePhoneChange}
                placeholder="(555) 123-4567"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Source</label>
            <input
              type="text"
              value={formData.source || ''}
              onChange={(e) => setFormData({ ...formData, source: e.target.value })}
              placeholder="e.g., Referral, Website, Cold Call"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
            />
          </div>

          {/* Financial Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Requested Amount</label>
              <select
                value={formData.requestedAmount || ''}
                onChange={(e) => setFormData({ ...formData, requestedAmount: e.target.value ? parseFloat(e.target.value) : undefined })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
              >
                <option value="">Select Loan Amount</option>
                {requestedAmountOptions.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Estimated Monthly Revenue</label>
              <select
                value={formData.estimatedRevenue || ''}
                onChange={(e) => setFormData({ ...formData, estimatedRevenue: e.target.value ? parseFloat(e.target.value) : undefined })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
              >
                <option value="">Select Revenue Range</option>
                {revenueRanges.map(range => (
                  <option key={range.value} value={range.value}>{range.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Lead Management */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value as Lead['priority'] })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Assigned To</label>
              <input
                type="text"
                value={formData.assignedTo || ''}
                onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Lead Date and Time</label>
            <input
              type="datetime-local"
              value={formData.leadDate || ''}
              onChange={(e) => setFormData({ ...formData, leadDate: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
            />
          </div>

          {/* Additional Business Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Credit Score</label>
              <select
                value={formData.creditScore || ''}
                onChange={(e) => setFormData({ ...formData, creditScore: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
              >
                <option value="">Select Credit Score Range</option>
                {creditScoreRanges.map(range => (
                  <option key={range.value} value={range.value}>{range.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">State</label>
              <select
                value={formData.state || ''}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
              >
                <option value="">Select State</option>
                {usStates.map(state => (
                  <option key={state} value={state}>{state}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Currently Processing Payments?</label>
              <div className="flex gap-4 items-center h-10">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="processingPayments"
                    checked={formData.processingPayments === true}
                    onChange={() => setFormData({ ...formData, processingPayments: true })}
                    className="w-4 h-4 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="text-sm text-gray-700">Yes</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="processingPayments"
                    checked={formData.processingPayments === false}
                    onChange={() => setFormData({ ...formData, processingPayments: false })}
                    className="w-4 h-4 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="text-sm text-gray-700">No</span>
                </label>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Has Business Bank Account?</label>
              <div className="flex gap-4 items-center h-10">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="hasBusinessBankAccount"
                    checked={formData.hasBusinessBankAccount === true}
                    onChange={() => setFormData({ ...formData, hasBusinessBankAccount: true })}
                    className="w-4 h-4 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="text-sm text-gray-700">Yes</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="hasBusinessBankAccount"
                    checked={formData.hasBusinessBankAccount === false}
                    onChange={() => setFormData({ ...formData, hasBusinessBankAccount: false })}
                    className="w-4 h-4 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="text-sm text-gray-700">No</span>
                </label>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
            <textarea
              value={formData.notes || ''}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none resize-none"
              placeholder="Add any additional notes about this lead..."
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
            >
              Create Lead
            </button>
          </div>
        </form>
        </div>
      </div>
    </>
  );
}

// Lead Details Drawer Component
function LeadDetailsDrawer({
  lead,
  onClose,
  onUpdate,
  onDelete,
  onConvertToDeal,
  isEditing,
  setIsEditing,
  onViewFullProfile,
}: {
  lead: Lead;
  onClose: () => void;
  onUpdate: (id: string, updates: Partial<Lead>) => void;
  onDelete: (id: string) => void;
  onConvertToDeal?: (lead: Lead) => void;
  isEditing: boolean;
  setIsEditing: (editing: boolean) => void;
  onViewFullProfile: () => void;
}) {
  const [editedLead, setEditedLead] = useState<Lead>(lead);

  const handleSave = () => {
    onUpdate(lead.id, editedLead);
  };

  const getStatusColor = (status: Lead['status']) => {
    const colors = {
      'New': 'bg-blue-100 text-blue-700',
      'In Progress': 'bg-purple-100 text-purple-700',
      'Closed (Won)': 'bg-green-100 text-green-700',
      'Closed (Lost)': 'bg-red-100 text-red-700',
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 transition-opacity"
        onClick={onClose}
      />
      
      {/* Drawer */}
      <div className="fixed right-0 top-0 h-full w-full sm:max-w-3xl bg-white shadow-2xl z-50 overflow-y-auto transform transition-transform">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xl sm:text-2xl text-gray-900">Lead Details</h2>
            <button 
              onClick={onClose} 
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`inline-flex items-center px-3 py-1 rounded-lg text-sm font-medium ${
              lead.leadType === 'MCA Loan' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
            }`}>
              {lead.leadType}
            </span>
            <span className={`inline-flex items-center px-3 py-1 rounded-lg text-sm font-medium ${getStatusColor(isEditing ? editedLead.status : lead.status)}`}>
              {isEditing ? editedLead.status : lead.status}
            </span>
          </div>
        </div>

        <div className="p-4 sm:p-6 space-y-6">
          {/* Action Buttons */}
          {!isEditing && (
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={onViewFullProfile}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
              >
                <FileText className="w-4 h-4" />
                View Full Profile
              </button>
              {onConvertToDeal && lead.status !== 'Closed (Won)' && (
                <button
                  onClick={() => {
                    onConvertToDeal(lead);
                    onClose();
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <ArrowRight className="w-4 h-4" />
                  Convert to Deal
                </button>
              )}
            </div>
          )}

          {isEditing ? (
            // Edit Mode
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Business Name</label>
                  <input
                    type="text"
                    value={editedLead.businessName}
                    onChange={(e) => setEditedLead({ ...editedLead, businessName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Contact Name</label>
                  <input
                    type="text"
                    value={editedLead.contactName}
                    onChange={(e) => setEditedLead({ ...editedLead, contactName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <input
                    type="email"
                    value={editedLead.email}
                    onChange={(e) => setEditedLead({ ...editedLead, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                  <input
                    type="tel"
                    value={editedLead.phone}
                    onChange={(e) => setEditedLead({ ...editedLead, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Industry</label>
                  <input
                    type="text"
                    value={editedLead.industry || ''}
                    onChange={(e) => setEditedLead({ ...editedLead, industry: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Source</label>
                  <input
                    type="text"
                    value={editedLead.source || ''}
                    onChange={(e) => setEditedLead({ ...editedLead, source: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Requested Amount</label>
                  <input
                    type="number"
                    value={editedLead.requestedAmount || ''}
                    onChange={(e) => setEditedLead({ ...editedLead, requestedAmount: parseFloat(e.target.value) || undefined })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Estimated Monthly Revenue</label>
                  <input
                    type="number"
                    value={editedLead.estimatedRevenue || ''}
                    onChange={(e) => setEditedLead({ ...editedLead, estimatedRevenue: parseFloat(e.target.value) || undefined })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  <select
                    value={editedLead.status}
                    onChange={(e) => setEditedLead({ ...editedLead, status: e.target.value as Lead['status'] })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                  >
                    <option value="New">New</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Closed (Won)">Closed (Won)</option>
                    <option value="Closed (Lost)">Closed (Lost)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                  <select
                    value={editedLead.priority}
                    onChange={(e) => setEditedLead({ ...editedLead, priority: e.target.value as Lead['priority'] })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Lead Type</label>
                  <select
                    value={editedLead.leadType}
                    onChange={(e) => setEditedLead({ ...editedLead, leadType: e.target.value as Lead['leadType'] })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                  >
                    <option value="MCA Loan">MCA Loan</option>
                    <option value="Residual Income">Residual Income</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Assigned To</label>
                  <input
                    type="text"
                    value={editedLead.assignedTo || ''}
                    onChange={(e) => setEditedLead({ ...editedLead, assignedTo: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Lead Date and Time</label>
                  <input
                    type="datetime-local"
                    value={editedLead.leadDate || ''}
                    onChange={(e) => setEditedLead({ ...editedLead, leadDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                <textarea
                  value={editedLead.notes || ''}
                  onChange={(e) => setEditedLead({ ...editedLead, notes: e.target.value })}
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none resize-none"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => {
                    setEditedLead(lead);
                    setIsEditing(false);
                  }}
                  className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="flex-1 px-4 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                >
                  Save Changes
                </button>
              </div>
            </>
          ) : (
            // View Mode
            <>
              {/* Business Info */}
              <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-6 border border-emerald-200">
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Building2 className="w-8 h-8 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl text-gray-900 mb-1">{lead.businessName}</h3>
                    {lead.industry && (
                      <p className="text-sm text-gray-600">{lead.industry}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Contact Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                  <div className="flex items-center gap-3 mb-3">
                    <User className="w-5 h-5 text-gray-500" />
                    <span className="text-sm font-medium text-gray-700">Contact Information</span>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm text-gray-900">{lead.contactName}</p>
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <a href={`mailto:${lead.email}`} className="text-sm text-blue-600 hover:underline">
                        {lead.email}
                      </a>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <a href={`tel:${lead.phone}`} className="text-sm text-blue-600 hover:underline">
                        {lead.phone}
                      </a>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                  <div className="flex items-center gap-3 mb-3">
                    <DollarSign className="w-5 h-5 text-gray-500" />
                    <span className="text-sm font-medium text-gray-700">Financial Details</span>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <p className="text-xs text-gray-500">Requested Amount</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {lead.requestedAmount ? `$${lead.requestedAmount.toLocaleString()}` : '—'}
                      </p>
                    </div>
                    {lead.estimatedRevenue && (
                      <div>
                        <p className="text-xs text-gray-500">Estimated Monthly Revenue</p>
                        <p className="text-sm text-gray-900">
                          ${lead.estimatedRevenue.toLocaleString()}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Lead Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Priority</label>
                  <span className={`inline-flex items-center px-3 py-1 rounded-lg text-sm font-medium ${
                    lead.priority === 'High' ? 'bg-red-100 text-red-700' :
                    lead.priority === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {lead.priority}
                  </span>
                </div>
                {lead.source && (
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Source</label>
                    <p className="text-sm text-gray-900">{lead.source}</p>
                  </div>
                )}
                {lead.assignedTo && (
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Assigned To</label>
                    <p className="text-sm text-gray-900">{lead.assignedTo}</p>
                  </div>
                )}
                {lead.leadDate && (
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Lead Date</label>
                    <div className="flex items-center gap-2 text-sm text-gray-900">
                      <Clock className="w-4 h-4 text-orange-500" />
                      {new Date(lead.leadDate).toLocaleDateString()} at {new Date(lead.leadDate).toLocaleTimeString()}
                    </div>
                  </div>
                )}
              </div>

              {/* Timeline */}
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                <div className="flex items-center gap-3 mb-3">
                  <Calendar className="w-5 h-5 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700">Timeline</span>
                </div>
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex justify-between">
                    <span>Created:</span>
                    <span className="text-gray-900">{new Date(lead.createdDate).toLocaleDateString()}</span>
                  </div>
                  {lead.lastContactDate && (
                    <div className="flex justify-between">
                      <span>Last Contact:</span>
                      <span className="text-gray-900">{new Date(lead.lastContactDate).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Notes */}
              {lead.notes && (
                <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
                  <div className="flex items-center gap-3 mb-2">
                    <FileText className="w-5 h-5 text-amber-600" />
                    <span className="text-sm font-medium text-amber-900">Notes</span>
                  </div>
                  <p className="text-sm text-amber-900 whitespace-pre-wrap">{lead.notes}</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}