import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, FolderKanban, BookOpen, History, Settings, Search, User } from 'lucide-react';
import { cn } from '../ui/Button';

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();

  const navItems = [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    { label: 'XRD Workspace', icon: FolderKanban, path: '/workspace/xrd' },
    { label: 'Multi-Tech', icon: FolderKanban, path: '/workspace/multi' },
    { label: 'Notebook Lab', icon: BookOpen, path: '/notebook' },
    { label: 'Analysis History', icon: History, path: '#' },
    { label: 'Settings', icon: Settings, path: '#' },
  ];

  return (
    <div className="flex h-screen bg-background overflow-hidden text-text-main">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border bg-surface flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-border shrink-0">
          <Link to="/" className="bg-white px-3 py-1.5 rounded flex items-center">
            <img 
              src="/logo/difaryx.png" 
              alt="DIFARYX" 
              className="h-8 object-contain hover:opacity-90 cursor-pointer transition-none"
            />
          </Link>
        </div>
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {navItems.map((item, i) => (
            <Link
              key={i}
              to={item.path}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors",
                location.pathname === item.path 
                  ? "bg-primary/10 text-primary" 
                  : "text-text-muted hover:bg-surface-hover hover:text-text-main"
              )}
            >
              <item.icon size={18} />
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="h-16 border-b border-border bg-surface/50 backdrop-blur flex items-center justify-between px-6 shrink-0">
          <div className="flex-1 max-w-xl">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
              <input 
                type="text" 
                placeholder="Search projects, patterns, or tags..." 
                className="w-full bg-surface-hover border border-border rounded-md pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-primary transition-colors text-text-main placeholder:text-text-muted/50"
              />
            </div>
          </div>
          <div className="flex items-center gap-4 ml-4">
            <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary border border-primary/30">
              <User size={16} />
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-hidden flex flex-col">
          {children}
        </main>
      </div>
    </div>
  );
}
