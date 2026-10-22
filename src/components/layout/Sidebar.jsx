import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Receipt, 
  BarChart3, 
  Settings, 
  ShieldAlert, 
  Users, 
  LogOut, 
  Building2, 
  HelpCircle,
  Edit2,
  Check,
  X
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Badge } from '../common/Badge';

export function Sidebar({ currentTab, onSelectTab, onOpenSetupGuide, isMobileOpen, onCloseMobile }) {
  const { currentUser, isAdmin, logout, updateDisplayName } = useAuth();

  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInput, setNameInput] = useState('');

  const getDisplayName = () => {
    return currentUser?.displayName || currentUser?.email || 'Company Personnel';
  };

  const handleStartEditName = () => {
    setNameInput(getDisplayName());
    setIsEditingName(true);
  };

  const handleSaveName = async () => {
    if (nameInput.trim()) {
      await updateDisplayName(nameInput.trim());
    }
    setIsEditingName(false);
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'transactions', label: 'Transaction Register', icon: Receipt },
    { id: 'reports', label: 'Financial Reports', icon: BarChart3 },
    ...(isAdmin ? [
      { id: 'settings', label: 'Company Settings', icon: Settings, adminOnly: true },
      { id: 'audit', label: 'Audit History', icon: ShieldAlert, adminOnly: true },
      { id: 'team', label: 'Team Accounts', icon: Users, adminOnly: true },
    ] : [])
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      <aside className={`
        fixed top-0 bottom-0 left-0 z-40 w-64 bg-slate-950 text-slate-300 flex flex-col border-r border-slate-800 transition-transform duration-200 ease-in-out lg:translate-x-0
        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Brand & Organization */}
        <div className="p-4 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img 
              src="/infotree-logo.png" 
              alt="InfoTreeTech Logo" 
              className="w-10 h-10 rounded-xl object-contain bg-white p-1 shadow-md shadow-indigo-950/40 border border-slate-700/50"
            />
            <div>
              <h1 className="text-sm font-bold text-white tracking-tight leading-none">InfoTreeTech</h1>
              <p className="text-[11px] text-slate-400 font-medium mt-1">Finance Manager</p>
            </div>
          </div>

          {/* Mobile close button */}
          <button
            onClick={onCloseMobile}
            className="lg:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors cursor-pointer"
            aria-label="Close sidebar navigation"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation items */}
        <div className="flex-1 py-5 px-3 space-y-1.5 overflow-y-auto touch-scroll">
          <div className="px-3 mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Core Ledger
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onSelectTab(item.id);
                  onCloseMobile && onCloseMobile();
                }}
                className={`
                  w-full min-h-[44px] flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer
                  ${isActive 
                    ? 'bg-slate-800 text-white shadow-sm font-semibold' 
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'}
                `}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-sky-400' : 'text-slate-400'}`} />
                <span>{item.label}</span>
                {item.adminOnly && (
                  <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300 font-mono">
                    ADMIN
                  </span>
                )}
              </button>
            );
          })}

          <div className="pt-4 px-3 mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Resources & System
          </div>

          <button
            onClick={() => {
              onOpenSetupGuide();
              onCloseMobile && onCloseMobile();
            }}
            className="w-full min-h-[44px] flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-900 transition-colors cursor-pointer"
          >
            <HelpCircle className="w-4 h-4 text-slate-400" />
            <span>Setup & Security Guide</span>
          </button>
        </div>

        {/* User profile footer */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-950/70 pb-safe">
          <div className="flex items-center justify-between mb-3">
            <div className="min-w-0 pr-2 flex-1">
              {isEditingName ? (
                <div className="flex items-center gap-1.5 mb-1">
                  <input
                    type="text"
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    placeholder="Enter your name"
                    autoFocus
                    className="w-full bg-slate-900 border border-indigo-500 rounded px-2 py-0.5 text-xs text-white focus:outline-none"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveName();
                      if (e.key === 'Escape') setIsEditingName(false);
                    }}
                  />
                  <button
                    onClick={handleSaveName}
                    title="Save Name"
                    className="p-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white cursor-pointer"
                  >
                    <Check className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => setIsEditingName(false)}
                    title="Cancel"
                    className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <div 
                  className="flex items-center gap-1.5 group cursor-pointer" 
                  onClick={handleStartEditName} 
                  title="Click to edit your display name"
                >
                  <p className="text-xs font-semibold text-white truncate group-hover:text-indigo-400 transition-colors">
                    {getDisplayName()}
                  </p>
                  <Edit2 className="w-2.5 h-2.5 text-slate-500 group-hover:text-indigo-400 opacity-60 group-hover:opacity-100 transition-all flex-shrink-0" />
                </div>
              )}
              <p className="text-[11px] text-slate-400 font-mono truncate mt-0.5">
                {currentUser?.phoneNumber || currentUser?.email}
              </p>
            </div>
            <Badge variant={isAdmin ? 'admin' : 'member'} size="sm">
              {currentUser?.role || 'MEMBER'}
            </Badge>
          </div>

          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-medium text-slate-400 hover:text-rose-400 hover:bg-rose-950/20 border border-slate-800 hover:border-rose-900/40 transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
}
