import React, { useState } from 'react';
import { toast } from 'sonner@2.0.3';
import {
  Plus,
  Search,
  Users,
  DollarSign,
  Briefcase,
  Clock,
  Eye,
  Edit,
  X,
  FileText,
  Calendar,
  Mail,
  Phone,
  MapPin,
  Download,
  CheckCircle,
  AlertCircle,
  User,
  Building2,
  TrendingUp,
} from 'lucide-react';

// ── Types ──
type EmploymentType = 'Full-Time' | 'Part-Time' | 'Contractor';
type EmployeeStatus = 'Active' | 'On Leave' | 'Terminated';
type Department = 'Engineering' | 'Sales' | 'Operations' | 'Support';

interface Employee {
  id: string;
  name: string;
  initials: string;
  email: string;
  phone: string;
  role: string;
  department: Department;
  employmentType: EmploymentType;
  startDate: string;
  compensation: string;
  compensationType: 'Salary' | 'Hourly';
  status: EmployeeStatus;
  address: string;
  manager: string;
  timeOffBalance: { vacation: number; sick: number; personal: number };
  documents: { name: string; date: string; status: 'Complete' | 'Missing' }[];
  notes: { text: string; author: string; date: string }[];
}

const employees: Employee[] = [
  {
    id: 'EMP-001',
    name: 'Carlos Rivera',
    initials: 'CR',
    email: 'carlos.r@deltpay.com',
    phone: '(555) 301-4420',
    role: 'Senior Software Engineer',
    department: 'Engineering',
    employmentType: 'Full-Time',
    startDate: 'Jan 15, 2023',
    compensation: '$145,000/yr',
    compensationType: 'Salary',
    status: 'Active',
    address: 'Austin, TX',
    manager: 'John Doe',
    timeOffBalance: { vacation: 12, sick: 5, personal: 3 },
    documents: [
      { name: 'W-4', date: 'Jan 15, 2023', status: 'Complete' },
      { name: 'I-9', date: 'Jan 15, 2023', status: 'Complete' },
      { name: 'Offer Letter', date: 'Dec 28, 2022', status: 'Complete' },
      { name: 'NDA', date: 'Jan 15, 2023', status: 'Complete' },
    ],
    notes: [
      { text: 'Promoted to Senior Engineer — effective Q1 2025. Outstanding performance on Lens AI module.', author: 'John Doe', date: 'Jan 5, 2025' },
      { text: 'Completed AWS Solutions Architect certification.', author: 'HR System', date: 'Sep 12, 2024' },
    ],
  },
  {
    id: 'EMP-002',
    name: 'Patrick Oduya',
    initials: 'PO',
    email: 'patrick.o@deltpay.com',
    phone: '(555) 302-8817',
    role: 'Full-Stack Developer',
    department: 'Engineering',
    employmentType: 'Full-Time',
    startDate: 'Mar 22, 2024',
    compensation: '$125,000/yr',
    compensationType: 'Salary',
    status: 'Active',
    address: 'Brooklyn, NY',
    manager: 'Carlos Rivera',
    timeOffBalance: { vacation: 8, sick: 4, personal: 2 },
    documents: [
      { name: 'W-4', date: 'Mar 22, 2024', status: 'Complete' },
      { name: 'I-9', date: 'Mar 22, 2024', status: 'Complete' },
      { name: 'Offer Letter', date: 'Mar 1, 2024', status: 'Complete' },
      { name: 'NDA', date: 'Mar 22, 2024', status: 'Complete' },
    ],
    notes: [
      { text: 'Ramping up well on merchant portal codebase. Paired with Carlos on onboarding tracker feature.', author: 'Carlos Rivera', date: 'Apr 15, 2024' },
    ],
  },
  {
    id: 'EMP-003',
    name: 'Jason Park',
    initials: 'JP',
    email: 'jason.p@deltpay.com',
    phone: '(555) 303-5590',
    role: 'Sales Manager',
    department: 'Sales',
    employmentType: 'Full-Time',
    startDate: 'Aug 10, 2022',
    compensation: '$110,000/yr',
    compensationType: 'Salary',
    status: 'Active',
    address: 'Miami, FL',
    manager: 'John Doe',
    timeOffBalance: { vacation: 15, sick: 6, personal: 3 },
    documents: [
      { name: 'W-4', date: 'Aug 10, 2022', status: 'Complete' },
      { name: 'I-9', date: 'Aug 10, 2022', status: 'Complete' },
      { name: 'Offer Letter', date: 'Jul 20, 2022', status: 'Complete' },
      { name: 'NDA', date: 'Aug 10, 2022', status: 'Complete' },
    ],
    notes: [
      { text: 'Exceeded Q4 sales target by 140%. Leading new ISO partner onboarding initiative.', author: 'John Doe', date: 'Jan 8, 2025' },
    ],
  },
  {
    id: 'EMP-004',
    name: 'Lyndon Tate',
    initials: 'LT',
    email: 'lyndon.t@deltpay.com',
    phone: '(555) 304-7712',
    role: 'Operations Lead',
    department: 'Operations',
    employmentType: 'Full-Time',
    startDate: 'Jun 5, 2023',
    compensation: '$98,000/yr',
    compensationType: 'Salary',
    status: 'On Leave',
    address: 'Chicago, IL',
    manager: 'John Doe',
    timeOffBalance: { vacation: 3, sick: 2, personal: 0 },
    documents: [
      { name: 'W-4', date: 'Jun 5, 2023', status: 'Complete' },
      { name: 'I-9', date: 'Jun 5, 2023', status: 'Complete' },
      { name: 'Offer Letter', date: 'May 18, 2023', status: 'Complete' },
      { name: 'NDA', date: 'Jun 5, 2023', status: 'Missing' },
    ],
    notes: [
      { text: 'On parental leave — returning May 1, 2026. Coverage handled by Sarah K.', author: 'HR System', date: 'Mar 15, 2026' },
    ],
  },
  {
    id: 'EMP-005',
    name: 'Nina Voskresenskaya',
    initials: 'NV',
    email: 'nina.v@contractor.deltpay.com',
    phone: '(555) 305-9934',
    role: 'QA Engineer',
    department: 'Engineering',
    employmentType: 'Contractor',
    startDate: 'Nov 1, 2025',
    compensation: '$85/hr',
    compensationType: 'Hourly',
    status: 'Active',
    address: 'Remote — Portland, OR',
    manager: 'Carlos Rivera',
    timeOffBalance: { vacation: 0, sick: 0, personal: 0 },
    documents: [
      { name: 'W-4', date: 'N/A', status: 'Missing' },
      { name: 'I-9', date: 'N/A', status: 'Missing' },
      { name: 'Offer Letter', date: 'Oct 20, 2025', status: 'Complete' },
      { name: '1099 Agreement', date: 'Nov 1, 2025', status: 'Complete' },
    ],
    notes: [
      { text: 'Contractor — 1099. Engaged for 6-month QA engagement on merchant portal.', author: 'Carlos Rivera', date: 'Nov 1, 2025' },
    ],
  },
];

// ── Helpers ──
const empTypeCls = (t: EmploymentType) => {
  switch (t) {
    case 'Full-Time': return 'bg-indigo-50 text-indigo-700 border-indigo-200';
    case 'Part-Time': return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'Contractor': return 'bg-purple-50 text-purple-700 border-purple-200';
  }
};

const statusCls = (s: EmployeeStatus) => {
  switch (s) {
    case 'Active': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'On Leave': return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'Terminated': return 'bg-red-50 text-red-600 border-red-200';
  }
};

const deptCls = (d: Department) => {
  switch (d) {
    case 'Engineering': return 'bg-blue-50 text-blue-700';
    case 'Sales': return 'bg-emerald-50 text-emerald-700';
    case 'Operations': return 'bg-orange-50 text-orange-700';
    case 'Support': return 'bg-pink-50 text-pink-700';
  }
};

// ── Stat Card ──
function StatCard({ label, value, icon, sub }: { label: string; value: string; icon: React.ReactNode; sub?: string }) {
  return (
    <div className="bg-white rounded-[8px] border border-gray-200 p-5">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm text-gray-600">{label}</p>
        <div className="text-gray-400">{icon}</div>
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
    </div>
  );
}

// ── Employee Detail Panel ──
function EmployeeDetailPanel({ employee, onClose }: { employee: Employee; onClose: () => void }) {
  const [detailTab, setDetailTab] = useState<'info' | 'documents' | 'notes' | 'reviews'>('info');
  const [notes, setNotes] = useState(employee.notes);
  const [noteText, setNoteText] = useState('');

  const addNote = () => {
    if (!noteText.trim()) { toast.error('Please enter a note'); return; }
    const today = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    setNotes(prev => [{ text: noteText.trim(), author: 'You', date: today }, ...prev]);
    setNoteText('');
    toast.success('Note added');
  };

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="absolute right-0 top-0 bottom-0 w-full max-w-xl bg-white shadow-2xl flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-5">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-brand/10 flex items-center justify-center">
                <span className="text-brand text-lg font-semibold">{employee.initials}</span>
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">{employee.name}</h2>
                <p className="text-sm text-gray-500">{employee.role}</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-[6px] transition-colors">
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
          <div className="flex items-center gap-2">
            <span className={`px-2.5 py-1 rounded-md text-xs font-medium border ${statusCls(employee.status)}`}>{employee.status}</span>
            <span className={`px-2.5 py-1 rounded-md text-xs font-medium border ${empTypeCls(employee.employmentType)}`}>{employee.employmentType}</span>
            <span className={`px-2.5 py-1 rounded-md text-xs font-medium ${deptCls(employee.department)}`}>{employee.department}</span>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 px-6 flex gap-1">
          {(['info', 'documents', 'notes', 'reviews'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setDetailTab(tab)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors capitalize ${
                detailTab === tab ? 'border-brand text-brand' : 'border-transparent text-gray-500 hover:text-gray-900'
              }`}
            >
              {tab === 'info' ? 'Details' : tab === 'reviews' ? 'Reviews' : tab}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {detailTab === 'info' && (
            <div className="space-y-6">
              {/* Contact */}
              <div>
                <h3 className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-3">Contact</h3>
                <div className="space-y-2.5">
                  <div className="flex items-center gap-3 text-sm"><Mail className="w-4 h-4 text-gray-400" /><span className="text-gray-700">{employee.email}</span></div>
                  <div className="flex items-center gap-3 text-sm"><Phone className="w-4 h-4 text-gray-400" /><span className="text-gray-700">{employee.phone}</span></div>
                  <div className="flex items-center gap-3 text-sm"><MapPin className="w-4 h-4 text-gray-400" /><span className="text-gray-700">{employee.address}</span></div>
                </div>
              </div>

              {/* Role & Compensation */}
              <div>
                <h3 className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-3">Role & Compensation</h3>
                <div className="bg-gray-50 rounded-[8px] p-4 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Title</span>
                    <span className="font-medium text-gray-900">{employee.role}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Department</span>
                    <span className="font-medium text-gray-900">{employee.department}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Reports To</span>
                    <span className="font-medium text-gray-900">{employee.manager}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Start Date</span>
                    <span className="font-medium text-gray-900">{employee.startDate}</span>
                  </div>
                  <div className="border-t border-gray-200 pt-3 flex justify-between text-sm">
                    <span className="text-gray-500">Compensation</span>
                    <span className="font-bold text-gray-900">{employee.compensation}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Type</span>
                    <span className="font-medium text-gray-900">{employee.compensationType}</span>
                  </div>
                </div>
              </div>

              {/* Time Off */}
              <div>
                <h3 className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-3">Time-Off Balance</h3>
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-blue-50 rounded-[8px] p-3 text-center">
                    <p className="text-2xl font-bold text-blue-700">{employee.timeOffBalance.vacation}</p>
                    <p className="text-xs text-blue-600 mt-0.5">Vacation Days</p>
                  </div>
                  <div className="bg-amber-50 rounded-[8px] p-3 text-center">
                    <p className="text-2xl font-bold text-amber-700">{employee.timeOffBalance.sick}</p>
                    <p className="text-xs text-amber-600 mt-0.5">Sick Days</p>
                  </div>
                  <div className="bg-purple-50 rounded-[8px] p-3 text-center">
                    <p className="text-2xl font-bold text-purple-700">{employee.timeOffBalance.personal}</p>
                    <p className="text-xs text-purple-600 mt-0.5">Personal Days</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {detailTab === 'documents' && (
            <div className="space-y-3">
              {employee.documents.map((doc, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-[8px]">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${doc.status === 'Complete' ? 'bg-emerald-50' : 'bg-red-50'}`}>
                      <FileText className={`w-4 h-4 ${doc.status === 'Complete' ? 'text-emerald-600' : 'text-red-500'}`} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{doc.name}</p>
                      <p className="text-xs text-gray-500">{doc.date}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {doc.status === 'Complete' ? (
                      <span className="flex items-center gap-1 text-xs text-emerald-600 font-medium"><CheckCircle className="w-3.5 h-3.5" /> Complete</span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs text-red-500 font-medium"><AlertCircle className="w-3.5 h-3.5" /> Missing</span>
                    )}
                    {doc.status === 'Complete' && (
                      <button onClick={() => toast.success(`Downloading ${doc.name}`)} className="p-1.5 hover:bg-gray-100 rounded-[6px]"><Download className="w-4 h-4 text-gray-400" /></button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {detailTab === 'notes' && (
            <div className="space-y-4">
              {notes.map((note, i) => (
                <div key={i} className="bg-gray-50 rounded-[8px] p-4">
                  <p className="text-sm text-gray-800">{note.text}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs text-gray-500">{note.author}</span>
                    <span className="text-xs text-gray-300">&middot;</span>
                    <span className="text-xs text-gray-500">{note.date}</span>
                  </div>
                </div>
              ))}
              <textarea value={noteText} onChange={e => setNoteText(e.target.value)} placeholder="Add a note..." className="w-full px-4 py-3 bg-white border border-gray-200 rounded-[8px] text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand resize-none" rows={3} />
              <button onClick={addNote} className="px-4 py-2 bg-brand text-white text-sm font-medium rounded-[6px] hover:bg-brand-hover transition-colors">Add Note</button>
            </div>
          )}

          {detailTab === 'reviews' && (
            <div className="space-y-6">
              {/* Latest Review */}
              <div>
                <h3 className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-3">Latest Performance Review</h3>
                <div className="bg-white border border-gray-200 rounded-[8px] p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">Q1 2026 Review</p>
                      <p className="text-xs text-gray-500">Reviewed by {employee.manager} &middot; Mar 28, 2026</p>
                    </div>
                    <span className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md text-xs font-semibold">
                      {employee.department === 'Engineering' ? 'Exceeds Expectations' : employee.status === 'On Leave' ? 'Meets Expectations' : 'Exceeds Expectations'}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: 'Technical Skills', score: employee.department === 'Engineering' ? 5 : 4 },
                      { label: 'Communication', score: 4 },
                      { label: 'Teamwork', score: employee.department === 'Sales' ? 5 : 4 },
                      { label: 'Initiative', score: employee.department === 'Engineering' ? 5 : 3 },
                    ].map(metric => (
                      <div key={metric.label} className="flex items-center justify-between bg-gray-50 rounded-[6px] px-3 py-2">
                        <span className="text-xs text-gray-600">{metric.label}</span>
                        <div className="flex gap-0.5">
                          {[1,2,3,4,5].map(n => (
                            <div key={n} className={`w-3 h-3 rounded-full ${n <= metric.score ? 'bg-brand' : 'bg-gray-200'}`} />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="bg-blue-50 rounded-[6px] p-3">
                    <p className="text-xs text-blue-800">
                      <span className="font-medium">Manager Notes:</span> {employee.name.split(' ')[0]} has consistently demonstrated strong performance this quarter.
                      {employee.department === 'Engineering' ? ' Key contributions to the Lens AI module and merchant portal.' : employee.department === 'Sales' ? ' Exceeded all sales targets and mentored junior agents effectively.' : ' Reliable operations leadership with excellent process improvements.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Review History */}
              <div>
                <h3 className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-3">Review History</h3>
                <div className="space-y-2">
                  {[
                    { period: 'Q4 2025', rating: 'Meets Expectations', date: 'Dec 20, 2025' },
                    { period: 'Q3 2025', rating: 'Exceeds Expectations', date: 'Sep 30, 2025' },
                  ].map(review => (
                    <div key={review.period} className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-[8px]">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{review.period}</p>
                        <p className="text-xs text-gray-500">{review.date}</p>
                      </div>
                      <span className={`px-2.5 py-1 rounded-md text-xs font-medium ${review.rating === 'Exceeds Expectations' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-blue-50 text-blue-700 border border-blue-200'}`}>{review.rating}</span>
                    </div>
                  ))}
                </div>
              </div>

              <button onClick={() => toast.info(`Starting new performance review for ${employee.name}…`)} className="w-full px-4 py-2.5 bg-brand text-white text-sm font-medium rounded-[6px] hover:bg-brand-hover transition-colors">Start New Review</button>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="bg-white border-t border-gray-200 px-6 py-4 flex items-center gap-3">
          <button onClick={() => toast.info(`Editing ${employee.name}…`)} className="flex-1 px-4 py-2.5 bg-brand text-white text-sm font-medium rounded-[6px] hover:bg-brand-hover transition-colors flex items-center justify-center gap-2">
            <Edit className="w-4 h-4" /> Edit Employee
          </button>
          <button onClick={() => toast.info(`Managing leave for ${employee.name}…`)} className="px-4 py-2.5 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded-[6px] hover:bg-gray-50 transition-colors">
            Manage Leave
          </button>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════
// Main Component
// ════════════════════════════════════════
export function BackendEmployees() {
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const totalEmployees = employees.filter(e => e.status !== 'Terminated').length;
  const monthlyPayroll = 52_416;
  const openPositions = 3;
  const avgTenure = 18;

  const filtered = employees.filter(e =>
    e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.department.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-full flex flex-col bg-canvas">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Employees</h1>
            <p className="text-sm text-gray-600 mt-1">{totalEmployees} active employees across all departments</p>
          </div>
          <button onClick={() => toast.info('Opening new employee form…')} className="px-4 py-2 bg-brand text-white text-sm font-medium rounded-[6px] hover:bg-brand-hover transition-colors flex items-center gap-2">
            <Plus className="w-4 h-4" /> Add Employee
          </button>
        </div>
      </div>

      <div className="px-6 py-6 flex-1 overflow-y-auto space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total Employees" value={totalEmployees.toString()} icon={<Users className="w-5 h-5" />} sub="+1 this month" />
          <StatCard label="Monthly Payroll Cost" value={`$${monthlyPayroll.toLocaleString()}`} icon={<DollarSign className="w-5 h-5" />} sub="Semi-monthly cycle" />
          <StatCard label="Open Positions" value={openPositions.toString()} icon={<Briefcase className="w-5 h-5" />} sub="2 Engineering, 1 Support" />
          <StatCard label="Avg Tenure" value={`${avgTenure} mo`} icon={<Clock className="w-5 h-5" />} sub="Across all departments" />
        </div>

        {/* Search */}
        <div className="bg-white rounded-[8px] border border-gray-200 p-4">
          <div className="flex flex-col lg:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, role, or department..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-[8px] text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand"
              />
            </div>
            <select className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-[8px] text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand">
              <option>All Departments</option><option>Engineering</option><option>Sales</option><option>Operations</option><option>Support</option>
            </select>
            <select className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-[8px] text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand">
              <option>All Types</option><option>Full-Time</option><option>Part-Time</option><option>Contractor</option>
            </select>
            <select className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-[8px] text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand">
              <option>All Status</option><option>Active</option><option>On Leave</option><option>Terminated</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-[8px] border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide">Name</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide">Role / Title</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide">Department</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide">Type</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide">Start Date</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide">Compensation</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wide">Status</th>
                  <th className="px-5 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filtered.map(emp => (
                  <tr key={emp.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-brand/10 flex items-center justify-center shrink-0">
                          <span className="text-brand text-xs font-semibold">{emp.initials}</span>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{emp.name}</p>
                          <p className="text-xs text-gray-500">{emp.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-700">{emp.role}</td>
                    <td className="px-5 py-4">
                      <span className={`px-2.5 py-1 rounded-md text-xs font-medium ${deptCls(emp.department)}`}>{emp.department}</span>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`px-2.5 py-1 rounded-md text-xs font-medium border ${empTypeCls(emp.employmentType)}`}>{emp.employmentType}</span>
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-600">{emp.startDate}</td>
                    <td className="px-5 py-4 text-sm font-semibold text-gray-900">{emp.compensation}</td>
                    <td className="px-5 py-4">
                      <span className={`px-2.5 py-1 rounded-md text-xs font-medium border ${statusCls(emp.status)}`}>{emp.status}</span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => setSelectedEmployee(emp)} className="p-2 hover:bg-gray-100 rounded-[6px] transition-colors" title="View">
                          <Eye className="w-4 h-4 text-gray-500" />
                        </button>
                        <button onClick={() => setSelectedEmployee(emp)} className="p-2 hover:bg-gray-100 rounded-[6px] transition-colors" title="Edit">
                          <Edit className="w-4 h-4 text-gray-500" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Detail Panel */}
      {selectedEmployee && <EmployeeDetailPanel employee={selectedEmployee} onClose={() => setSelectedEmployee(null)} />}
    </div>
  );
}
