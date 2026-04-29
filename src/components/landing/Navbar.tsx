import React from 'react';
import { Link } from 'react-router-dom';

export default function Navbar() {
  const [isCompact, setIsCompact] = React.useState(false);
  const lastScrollY = React.useRef(0);

  React.useEffect(() => {
    const handleScroll = () => {
      const nextScrollY = window.scrollY;
      if (nextScrollY > lastScrollY.current + 4) {
        setIsCompact(true);
      } else if (nextScrollY < lastScrollY.current - 4) {
        setIsCompact(false);
      }
      lastScrollY.current = Math.max(0, nextScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-slate-200">
      <div className={`max-w-[1280px] mx-auto px-6 md:px-8 flex items-center justify-between transition-[height] duration-200 ${isCompact ? 'h-12' : 'h-14'}`}>
        <div className="flex items-center gap-7 lg:gap-9">
          <Link to="/" className="flex items-center gap-2.5 shrink-0">
            <img src="/logo/difaryx.png" alt="DIFARYX" className={`object-contain transition-[height] duration-200 ${isCompact ? 'h-5' : 'h-6'}`} />
          </Link>
          <nav className="hidden lg:flex items-center gap-5">
            {['PRODUCT','TECHNIQUES','NOTEBOOK LAB','ROADMAP','COMPANY','INVESTOR BRIEFING'].map(item => (
              <a key={item} href={`#${item.toLowerCase().replace(/\s+/g,'-')}`}
                className="text-[12px] font-semibold tracking-[0.04em] text-slate-500 hover:text-slate-900 transition-colors">
                {item}
              </a>
            ))}
          </nav>
        </div>
      </div>
    </header>
  );
}
