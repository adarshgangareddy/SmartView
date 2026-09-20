import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Shield, Radio, LogOut, Activity, Settings, LayoutDashboard, Clock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Header = ({ isOnline = false, lastSeen = null }) => {
  const { user, logout } = useAuth();
  const location = useLocation();

  const navLinks = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Activity Logs', path: '/logs', icon: Activity },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <header className="bg-slate-900/90 border-b border-slate-800 sticky top-0 z-40 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-sm tracking-widest text-slate-400 uppercase">
                  GATE-CONTROL
                </span>
                <span className="text-xs px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                  v1.0.0
                </span>
              </div>
              <h1 className="text-lg font-bold text-white tracking-wide flex items-center gap-2">
                REMOTE GATE CONTROL
              </h1>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-slate-800 text-white border border-slate-700'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {link.name}
                </Link>
              );
            })}
          </nav>

          {/* User Badge & Logout */}
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex flex-col items-end text-xs">
              <span className="text-slate-200 font-medium">{user?.email || 'Operator'}</span>
              <span className="text-slate-400 capitalize">{user?.role || 'admin'}</span>
            </div>

            <button
              onClick={logout}
              title="Sign Out"
              className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors border border-transparent hover:border-slate-700"
              aria-label="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
