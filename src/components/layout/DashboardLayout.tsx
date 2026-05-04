import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Bot, LayoutDashboard, FolderKanban, BookOpen, History, Settings, Search, User, PanelLeftClose, PanelLeftOpen, ChevronDown, LogOut } from 'lucide-react';
import { cn } from '../ui/Button';
import { DEFAULT_PROJECT_ID } from '../../data/demoProjects';

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [isTopbarCompact, setIsTopbarCompact] = React.useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = React.useState(true);
  const [isProfileOpen, setIsProfileOpen] = React.useState(false);
  const [isDemoAuthenticated, setIsDemoAuthenticated] = React.useState(() => {
    try {
      return localStorage.getItem('demoAuth') === 'true';
    } catch {
      return false;
    }
  });
  const [profile] = React.useState(() => {
    try {
      const savedProfile = localStorage.getItem('demoProfile');
      if (savedProfile) return JSON.parse(savedProfile) as { name?: string; email?: string; organization?: string };
    } catch {
      // Ignore malformed demo profile data.
    }
    return { name: 'Demo Researcher', email: 'demo@difaryx.local', organization: 'DIFARYX Demo Lab' };
  });
  const lastScrollY = React.useRef(0);

  React.useEffect(() => {
    const getScrollTop = (target: EventTarget | null) => {
      if (target === document || target === window || target === document.documentElement || target === document.body) {
        return window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0;
      }
      if (target instanceof HTMLElement) return target.scrollTop;
      return window.scrollY || 0;
    };

    const handleScroll = (event: Event) => {
      const nextScrollY = getScrollTop(event.target);
      if (nextScrollY > lastScrollY.current + 4) {
        setIsTopbarCompact(true);
      } else if (nextScrollY < lastScrollY.current - 4) {
        setIsTopbarCompact(false);
      }
      lastScrollY.current = Math.max(0, nextScrollY);
    };

    document.addEventListener('scroll', handleScroll, { capture: true, passive: true });
    return () => document.removeEventListener('scroll', handleScroll, { capture: true });
  }, []);

  const navItems = [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    { label: 'Workspace', icon: FolderKanban, path: '/workspace' },
    { label: 'Multi-Tech', icon: FolderKanban, path: '/workspace/multi?project=cufe2o4-sba15' },
    { label: 'Notebook Lab', icon: BookOpen, path: `/notebook?project=${DEFAULT_PROJECT_ID}` },
    { label: 'Agent Mode', icon: Bot, path: `/demo/agent?project=${DEFAULT_PROJECT_ID}` },
    { label: 'Analysis History', icon: History, path: '/history' },
    { label: 'Settings', icon: Settings, path: '/settings' },
  ];

  const handleSignOut = () => {
    localStorage.removeItem('demoAuth');
    localStorage.removeItem('demoProfile');
    setIsDemoAuthenticated(false);
    setIsProfileOpen(false);
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden text-text-main">
      {/* Sidebar */}
      <aside
        className={cn(
          "border-r border-border bg-surface flex flex-col transition-[width] duration-200 shrink-0",
          isSidebarCollapsed ? "w-16 md:w-[72px]" : "w-64"
        )}
      >
        <div
          className={cn(
            "h-14 flex items-center border-b border-border shrink-0 px-2",
            isSidebarCollapsed ? "justify-center" : "justify-between"
          )}
        >
          <Link to="/" className={cn("rounded flex items-center", !isSidebarCollapsed && "bg-white px-3 py-1.5")}>
            <img 
              src="/logo/difaryx.png" 
              alt="DIFARYX" 
              className={cn(
                "object-contain hover:opacity-90 cursor-pointer transition-none",
                isSidebarCollapsed ? "h-7 w-9 object-cover object-left" : "h-8"
              )}
            />
          </Link>
          {!isSidebarCollapsed && (
            <button
              type="button"
              onClick={() => setIsSidebarCollapsed(true)}
              className="inline-flex h-8 w-8 items-center justify-center rounded-md text-text-muted hover:bg-surface-hover hover:text-text-main"
              aria-label="Collapse sidebar"
            >
              <PanelLeftClose size={17} />
            </button>
          )}
        </div>
        <nav className={cn("flex-1 overflow-y-auto py-4 space-y-2", isSidebarCollapsed ? "px-2" : "px-3")}>
          {navItems.map((item, i) => (
            <Link
              key={i}
              to={item.path}
              title={isSidebarCollapsed ? item.label : undefined}
              className={cn(
                "flex items-center rounded-md text-sm font-medium transition-colors",
                isSidebarCollapsed ? "h-11 justify-center px-0" : "justify-start gap-3 px-3 py-2.5",
                location.pathname === item.path.split('?')[0]
                  ? "bg-primary/10 text-primary" 
                  : "text-text-muted hover:bg-surface-hover hover:text-text-main"
              )}
            >
              <item.icon size={isSidebarCollapsed ? 20 : 18} />
              <span className={cn(isSidebarCollapsed ? "sr-only" : "inline")}>{item.label}</span>
            </Link>
          ))}
        </nav>
        {isSidebarCollapsed && (
          <div className="border-t border-border p-2">
            <button
              type="button"
              onClick={() => setIsSidebarCollapsed(false)}
              className="flex h-10 w-full items-center justify-center rounded-md text-text-muted hover:bg-surface-hover hover:text-text-main"
              aria-label="Expand sidebar"
              title="Expand sidebar"
            >
              <PanelLeftOpen size={18} />
            </button>
          </div>
        )}
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className={`sticky top-0 z-40 border-b border-border bg-surface/50 backdrop-blur flex items-center justify-between px-3 md:px-5 shrink-0 transition-[height] duration-200 ${isTopbarCompact ? 'h-12' : 'h-14'}`}>
          <div className="hidden sm:block flex-1 max-w-lg">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
              <input 
                type="text" 
                placeholder="Search projects, patterns, or tags..." 
                className="h-9 w-full bg-surface-hover border border-border rounded-md pl-9 pr-3 text-sm focus:outline-none focus:border-primary transition-colors text-text-main placeholder:text-text-muted/50"
              />
            </div>
          </div>
          <div className="relative flex items-center gap-3 ml-3">
            {!isDemoAuthenticated ? (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="inline-flex h-8 items-center justify-center rounded-md border border-border bg-background px-3 text-xs font-bold text-text-main transition-colors hover:border-primary/40 hover:bg-primary/5 hover:text-primary"
                >
                  Sign In
                </Link>
                <Link
                  to="/login"
                  className="inline-flex h-8 items-center justify-center rounded-md bg-primary px-3 text-xs font-bold text-white shadow-sm shadow-primary/20 transition-colors hover:bg-primary/90"
                >
                  Continue Demo
                </Link>
              </div>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setIsProfileOpen((open) => !open)}
                  className="flex h-8 items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-1.5 pr-2 text-primary transition-colors hover:bg-primary/15"
                  aria-label="Open profile menu"
                  aria-expanded={isProfileOpen}
                >
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/20">
                    <User size={14} />
                  </span>
                  <ChevronDown size={13} />
                </button>
                {isProfileOpen && (
                  <div className="absolute right-0 top-10 z-50 w-64 rounded-lg border border-border bg-white p-2 shadow-xl shadow-slate-900/10">
                    <div className="rounded-md border border-border bg-background px-3 py-2">
                      <p className="text-sm font-bold text-text-main">{profile.name ?? 'Demo Researcher'}</p>
                      <p className="mt-0.5 truncate text-xs text-text-muted">{profile.email ?? 'demo@difaryx.local'}</p>
                      <p className="mt-1 text-[11px] font-semibold text-primary">{profile.organization ?? 'DIFARYX Demo Lab'}</p>
                    </div>
                    <div className="mt-2 space-y-1">
                      <Link
                        to="/settings"
                        onClick={() => setIsProfileOpen(false)}
                        className="flex h-9 items-center gap-2 rounded-md px-3 text-sm font-medium text-text-main hover:bg-surface-hover"
                      >
                        <Settings size={15} /> Profile settings
                      </Link>
                      <Link
                        to="/login"
                        onClick={() => setIsProfileOpen(false)}
                        className="flex h-9 items-center gap-2 rounded-md px-3 text-sm font-medium text-text-main hover:bg-surface-hover"
                      >
                        <User size={15} /> Switch account
                      </Link>
                      <button
                        type="button"
                        onClick={handleSignOut}
                        className="flex h-9 w-full items-center gap-2 rounded-md px-3 text-left text-sm font-medium text-red-600 hover:bg-red-50"
                      >
                        <LogOut size={15} /> Sign out
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
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
