import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Bot, LayoutDashboard, FolderKanban, BookOpen, History, Settings, Search, User } from 'lucide-react';
import { cn } from '../ui/Button';
import { DEFAULT_PROJECT_ID } from '../../data/demoProjects';

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const [isTopbarCompact, setIsTopbarCompact] = React.useState(false);
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
    { label: 'XRD Workspace', icon: FolderKanban, path: `/workspace/xrd?project=${DEFAULT_PROJECT_ID}` },
    { label: 'Multi-Tech', icon: FolderKanban, path: '/workspace/multi?project=cufe2o4-sba15' },
    { label: 'Notebook Lab', icon: BookOpen, path: `/notebook?project=${DEFAULT_PROJECT_ID}` },
    { label: 'Agent Mode', icon: Bot, path: `/demo/agent?project=${DEFAULT_PROJECT_ID}` },
    { label: 'Analysis History', icon: History, path: '/history' },
    { label: 'Settings', icon: Settings, path: '/settings' },
  ];

  return (
    <div className="flex h-screen bg-background overflow-hidden text-text-main">
      {/* Sidebar */}
      <aside className="w-16 md:w-64 border-r border-border bg-surface flex flex-col">
        <div className="h-16 flex items-center justify-center md:justify-start px-2 md:px-6 border-b border-border shrink-0">
          <Link to="/" className="md:bg-white md:px-3 md:py-1.5 rounded flex items-center">
            <img 
              src="/logo/difaryx.png" 
              alt="DIFARYX" 
              className="h-7 md:h-8 object-contain hover:opacity-90 cursor-pointer transition-none"
            />
          </Link>
        </div>
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {navItems.map((item, i) => (
            <Link
              key={i}
              to={item.path}
              className={cn(
                "flex items-center justify-center md:justify-start gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors",
                location.pathname === item.path.split('?')[0]
                  ? "bg-primary/10 text-primary" 
                  : "text-text-muted hover:bg-surface-hover hover:text-text-main"
              )}
            >
              <item.icon size={18} />
              <span className="hidden md:inline">{item.label}</span>
            </Link>
          ))}
        </nav>
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
          <div className="flex items-center gap-3 ml-3">
            <div className="h-7 w-7 rounded-full bg-primary/20 flex items-center justify-center text-primary border border-primary/30">
              <User size={15} />
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
