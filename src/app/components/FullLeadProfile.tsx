import React, { useState } from 'react';
import { 
  X, 
  User, 
  Clock, 
  FileText,
  Mail,
  Phone
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { Lead, LeadNote, LeadAttachment } from './Leads';

interface FullLeadProfileProps {
  lead: Lead;
  user: { name: string; email: string; role: string };
  onClose: () => void;
  onUpdate: (id: string, updates: Partial<Lead>) => void;
}

export function FullLeadProfile({
  lead,
  user,
  onClose,
  onUpdate,
}: FullLeadProfileProps) {
  const [newNote, setNewNote] = useState('');
  const [notes, setNotes] = useState<LeadNote[]>(lead.notesHistory || []);
  const [attachments, setAttachments] = useState<LeadAttachment[]>(lead.attachments || []);

  const handleAddNote = () => {
    if (!newNote.trim()) {
      toast.error('Please enter a note');
      return;
    }

    const note: LeadNote = {
      id: Date.now().toString(),
      leadId: lead.id,
      note: newNote,
      createdBy: user.name,
      createdAt: new Date().toISOString(),
    };

    const updatedNotes = [note, ...notes];
    setNotes(updatedNotes);
    onUpdate(lead.id, { notesHistory: updatedNotes });
    setNewNote('');
    toast.success('Note added successfully!');
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
    <div className="fixed inset-0 bg-gray-50 z-50 overflow-y-auto">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
              <div>
                <h1 className="text-2xl text-gray-900">{lead.businessName}</h1>
                <p className="text-sm text-gray-500">{lead.industry}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center px-3 py-1 rounded-lg text-sm font-medium ${
                lead.leadType === 'MCA Loan' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
              }`}>
                {lead.leadType}
              </span>
              <span className={`inline-flex items-center px-3 py-1 rounded-lg text-sm font-medium ${getStatusColor(lead.status)}`}>
                {lead.status}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 sm:px-6 lg:px-8 py-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Lead Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Contact Information Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Contact Name</label>
                  <p className="text-sm text-gray-900">{lead.contactName}</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Email</label>
                  <a href={`mailto:${lead.email}`} className="text-sm text-blue-600 hover:underline flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    {lead.email}
                  </a>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Phone</label>
                  <a href={`tel:${lead.phone}`} className="text-sm text-blue-600 hover:underline flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    {lead.phone}
                  </a>
                </div>
                {lead.state && (
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">State</label>
                    <p className="text-sm text-gray-900">{lead.state}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Financial Information Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Financial Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Requested Amount</label>
                  <p className="text-lg font-semibold text-gray-900">
                    {lead.requestedAmount ? `$${lead.requestedAmount.toLocaleString()}` : '—'}
                  </p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Estimated Monthly Revenue</label>
                  <p className="text-lg font-semibold text-gray-900">
                    {lead.estimatedRevenue ? `$${lead.estimatedRevenue.toLocaleString()}` : '—'}
                  </p>
                </div>
                {lead.creditScore && (
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Credit Score</label>
                    <p className="text-sm text-gray-900">{lead.creditScore}</p>
                  </div>
                )}
                {lead.processingPayments !== undefined && (
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Processing Payments</label>
                    <p className="text-sm text-gray-900">{lead.processingPayments ? 'Yes' : 'No'}</p>
                  </div>
                )}
                {lead.hasBusinessBankAccount !== undefined && (
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Business Bank Account</label>
                    <p className="text-sm text-gray-900">{lead.hasBusinessBankAccount ? 'Yes' : 'No'}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Notes Feed Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Notes</h3>
              
              {/* Add Note Form */}
              <div className="mb-6 bg-gray-50 rounded-lg p-4 border border-gray-200">
                <textarea
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Add a note about this lead..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none resize-none mb-3"
                />
                <button
                  onClick={handleAddNote}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                >
                  Add Note
                </button>
              </div>

              {/* Notes Feed */}
              <div className="space-y-4">
                {notes.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-8">No notes yet. Add your first note above.</p>
                ) : (
                  notes.map((note) => (
                    <div key={note.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center">
                            <User className="w-4 h-4 text-white" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{note.createdBy}</p>
                            <p className="text-xs text-gray-500">
                              {new Date(note.createdAt).toLocaleDateString()} at {new Date(note.createdAt).toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                      </div>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap pl-10">{note.note}</p>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Attachments Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Attachments</h3>
              
              {/* Upload Area */}
              <div className="mb-6 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-emerald-500 transition-colors cursor-pointer">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600 mb-1">Click to upload or drag and drop</p>
                <p className="text-xs text-gray-500">PDF, DOC, DOCX, XLS, XLSX, PNG, JPG up to 10MB</p>
              </div>

              {/* Attachments List */}
              <div className="space-y-2">
                {attachments.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">No attachments yet</p>
                ) : (
                  attachments.map((attachment) => (
                    <div key={attachment.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <FileText className="w-5 h-5 text-gray-400" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{attachment.fileName}</p>
                        <p className="text-xs text-gray-500">
                          Uploaded by {attachment.uploadedBy} on {new Date(attachment.uploadedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Quick Info Sidebar */}
          <div className="space-y-6">
            {/* Lead Details Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Lead Details</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Priority</label>
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium ${
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
                {lead.nextFollowUp && (
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Next Follow-Up</label>
                    <div className="flex items-center gap-2 text-sm text-gray-900">
                      <Clock className="w-4 h-4 text-orange-500" />
                      {new Date(lead.nextFollowUp).toLocaleString()}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Timeline Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Timeline</h3>
              <div className="space-y-3">
                {lead.leadDate && (
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Lead Date</label>
                    <p className="text-sm text-gray-900">
                      {new Date(lead.leadDate).toLocaleDateString()} at {new Date(lead.leadDate).toLocaleTimeString()}
                    </p>
                  </div>
                )}
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">Created</label>
                  <p className="text-sm text-gray-900">{new Date(lead.createdDate).toLocaleDateString()}</p>
                </div>
                {lead.lastContactDate && (
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Last Contact</label>
                    <p className="text-sm text-gray-900">{new Date(lead.lastContactDate).toLocaleDateString()}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Original Notes Card (if any) */}
            {lead.notes && (
              <div className="bg-amber-50 rounded-xl shadow-sm border border-amber-200 p-6">
                <h3 className="text-lg font-semibold text-amber-900 mb-2">Original Notes</h3>
                <p className="text-sm text-amber-900 whitespace-pre-wrap">{lead.notes}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
