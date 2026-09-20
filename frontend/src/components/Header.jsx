import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Shield, Lightbulb, LayoutDashboard, Activity, Settings, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Header = () => {
  const { user, logout } = useAuth();
  const location = useLocation();

  const navLinks = [
    { name: 'Overview', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Gate Control', path: '/operations/gate', icon: Shield },
    { name: 'Street Lighting', path: '/operations/street-light', icon: Lightbulb },
    { name: 'Logs', path: '/logs', icon: Activity },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <header className="bg-slate-900/90 border-b border-slate-800 sticky top-0 z-40 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Title */}
          <Link to="/dashboard" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 group-hover:border-emerald-400 transition-colors">
              <span className="font-mono font-black text-base tracking-tighter text-emerald-400">SV</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-xs tracking-widest text-slate-400 uppercase">
                  SMARTVIEW
                </span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-cyan-400 font-mono border border-slate-700">
                  v2.0 Platform
                </span>
              </div>
              <h1 className="text-base font-bold text-white tracking-wide">
                IoT Operations Center
              </h1>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-mono font-semibold transition-colors ${
                    isActive
                      ? 'bg-slate-800 text-white border border-slate-700 shadow-sm'
                      : 'text-slate-400 hover:text-white hover:bg-slate-850'
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
            <div className="hidden sm:flex flex-col items-end text-xs font-mono">
              <span className="text-slate-200 font-medium">{user?.email || 'Operator'}</span>
              <span className="text-slate-500 capitalize text-[10px]">{user?.role || 'Admin'}</span>
            </div>

            <button
              onClick={logout}
              title="Sign Out"
              className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors border border-transparent hover:border-slate-700"
              aria-label="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Mobile Navigation bar */}
        <div className="flex lg:hidden overflow-x-auto py-2 border-t border-slate-800/80 gap-2">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = location.pathname === link.path;
            return (
              <Link
                key={link.path}
                to={link.path}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-mono shrink-0 ${
                  isActive
                    ? 'bg-slate-800 text-white border border-slate-700'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {link.name}
              </Link>
            );
          })}
        </div>
      </div>
    </header>
  );
};
