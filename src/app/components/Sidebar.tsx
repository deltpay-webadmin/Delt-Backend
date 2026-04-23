import React from 'react';
import { 
  LayoutDashboard, 
  Calculator, 
  FileText, 
  Building2,
  DollarSign,
  ChevronRight,
  Plus,
  X,
  LogOut,
  User as UserIcon,
  Users
} from 'lucide-react';

type View = 'calculator' | 'dashboard' | 'deals' | 'financials' | 'rbo' | 'profile' | 'deal-details' | 'leads';

interface User {
  email: string;
  name: string;
  role: string;
}

interface SidebarProps {
  activeView: View;
  onNavigate: (view: View) => void;
  onNewDeal: () => void;
  isOpen: boolean;
  onClose: () => void;
  user: User;
  onLogout: () => void;
}

export function Sidebar({ activeView, onNavigate, onNewDeal, isOpen, onClose, user, onLogout }: SidebarProps) {
  const menuItems = [
    { id: 'dashboard' as View, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'leads' as View, label: 'Leads', icon: Users },
    { id: 'calculator' as View, label: 'Calculator', icon: Calculator },
    { id: 'deals' as View, label: 'All Deals', icon: FileText },
    { id: 'rbo' as View, label: 'RBO Analysis', icon: Building2 },
    { id: 'financials' as View, label: 'Financials', icon: DollarSign },
  ];

  // When on deal-details page, highlight 'deals' in the sidebar
  const getActiveView = () => {
    return activeView === 'deal-details' ? 'deals' : activeView;
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <aside className={`
        fixed lg:sticky top-0 h-screen
        w-64 bg-white border-r border-gray-200 
        flex flex-col
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        z-50 lg:z-auto
      `}>
        {/* Logo */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
                <span className="text-white text-lg">D</span>
              </div>
              <div>
                <h1 className="text-xl">Delt Pay</h1>
                <p className="text-xs text-gray-500">MCA Platform</p>
              </div>
            </div>
            {/* Mobile Close Button */}
            <button
              onClick={onClose}
              className="lg:hidden p-2 hover:bg-gray-100 rounded-lg min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label="Close navigation menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 overflow-y-auto">
          <ul className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = getActiveView() === item.id;
              
              return (
                <li key={item.id}>
                  <button
                    onClick={() => {
                      onNavigate(item.id);
                      // Close sidebar on mobile after navigation
                      if (window.innerWidth < 1024) {
                        onClose();
                      }
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                      isActive
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className={`w-5 h-5 ${isActive ? 'text-emerald-600' : 'text-gray-400'}`} />
                    <span className="flex-1 text-left">{item.label}</span>
                    {isActive && <ChevronRight className="w-4 h-4 text-emerald-600" />}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* User Profile */}
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={() => {
              onNavigate('profile');
              if (window.innerWidth < 1024) {
                onClose();
              }
            }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors mb-2 ${
              activeView === 'profile' 
                ? 'bg-emerald-50' 
                : 'hover:bg-gray-50'
            }`}
          >
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center text-white">
              <span className="text-sm">{user.name.split(' ').map(n => n[0]).join('')}</span>
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm">{user.name}</p>
              <p className="text-xs text-gray-500">{user.role}</p>
            </div>
            {activeView === 'profile' && <ChevronRight className="w-4 h-4 text-emerald-600" />}
          </button>
          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors text-sm"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}