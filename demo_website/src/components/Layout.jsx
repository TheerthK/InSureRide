import React, { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { ShieldCheck, LayoutDashboard, UserPlus, FileText, Calculator, AlertTriangle, Brain, Building2, Menu, X, ChevronRight, Shield } from 'lucide-react';

const NAV_ITEMS = [
  { path: '/', icon: LayoutDashboard, label: 'Dashboard', description: 'Rider home' },
  { path: '/register', icon: UserPlus, label: 'Registration', description: 'Onboarding' },
  { path: '/policies', icon: FileText, label: 'Policies', description: 'Management' },
  { path: '/premium', icon: Calculator, label: 'Premium', description: 'Calculator' },
  { path: '/claims', icon: AlertTriangle, label: 'Claims', description: 'Management' },
  { path: '/fraud', icon: Brain, label: 'Fraud Intel', description: 'AI Detection' },
  { path: '/advanced', icon: Shield, label: 'Advanced AI', description: '10-System Defense' },
  { path: '/command', icon: Building2, label: 'Command', description: 'Insurer View' },
];

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/60 z-40 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed lg:sticky top-0 left-0 h-screen z-50 flex flex-col bg-slate-900/95 backdrop-blur-xl border-r border-slate-800/50 transition-all duration-300 ${sidebarOpen ? 'w-64' : 'w-20'} ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-slate-800/50">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center flex-shrink-0 shadow-lg shadow-indigo-500/20">
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
          {sidebarOpen && (
            <div className="overflow-hidden">
              <h1 className="text-lg font-bold bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent whitespace-nowrap">GigGuard AI</h1>
              <p className="text-[10px] text-slate-500 uppercase tracking-widest">Income Protection</p>
            </div>
          )}
        </div>

        {/* Nav Items */}
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group ${isActive ? 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/20' : 'text-slate-400 hover:text-white hover:bg-slate-800/50 border border-transparent'}`}
            >
              <item.icon className={`w-5 h-5 flex-shrink-0`} />
              {sidebarOpen && (
                <div className="overflow-hidden">
                  <p className="text-sm font-medium truncate">{item.label}</p>
                  <p className="text-[10px] text-slate-500 truncate">{item.description}</p>
                </div>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Collapse toggle */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="hidden lg:flex items-center justify-center py-4 border-t border-slate-800/50 text-slate-500 hover:text-white transition-colors"
        >
          <ChevronRight className={`w-4 h-4 transition-transform duration-300 ${sidebarOpen ? 'rotate-180' : ''}`} />
        </button>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex items-center justify-between px-4 lg:px-8 py-3 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/30">
          <button
            onClick={() => setMobileOpen(true)}
            className="lg:hidden p-2 text-slate-400 hover:text-white"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3 ml-auto">
            <div className="flex items-center gap-2 bg-emerald-500/10 text-emerald-400 px-3 py-1.5 rounded-full text-xs font-semibold border border-emerald-500/20">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              System Active
            </div>
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xs font-bold">RK</div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 px-4 lg:px-8 py-6 overflow-x-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
