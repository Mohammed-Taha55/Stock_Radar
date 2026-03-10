import { useState, useEffect, useRef, useCallback } from 'react';
import { TrendingUp, RefreshCw, Zap, Activity, Sun, Moon, Menu, X } from 'lucide-react';
import { triggerIngestion } from '../api/snapshots';
import toast from 'react-hot-toast';

interface NavbarProps {
    onRefresh: () => void;
    isRefreshing: boolean;
    lastUpdated: Date | null;
    isDark: boolean;
    onToggleTheme: () => void;
}

export default function Navbar({ onRefresh, isRefreshing, lastUpdated, isDark, onToggleTheme }: NavbarProps) {
    const [time, setTime] = useState(new Date());
    const [isIngesting, setIsIngesting] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const intervalRef = useRef<ReturnType<typeof setInterval>>(null);

    useEffect(() => {
        intervalRef.current = setInterval(() => setTime(new Date()), 1000);
        return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
    }, []);

    useEffect(() => {
        const fn = () => setScrolled(window.scrollY > 12);
        window.addEventListener('scroll', fn, { passive: true });
        return () => window.removeEventListener('scroll', fn);
    }, []);

    // Close mobile menu on outside click
    useEffect(() => {
        const fn = () => setMobileOpen(false);
        document.addEventListener('click', fn);
        return () => document.removeEventListener('click', fn);
    }, []);

    const handleIngest = useCallback(async () => {
        setIsIngesting(true);
        try {
            const { count } = await triggerIngestion();
            toast.success(`${count} fresh snapshots saved!`, {
                icon: '🚀',
                style: {
                    background: 'var(--surface)',
                    color: 'var(--text)',
                    border: '1px solid var(--border-2)',
                    borderRadius: '12px',
                    boxShadow: 'var(--shadow-md)',
                    fontSize: '14px',
                },
                duration: 3500,
            });
            onRefresh();
        } catch {
            toast.error('Backend unreachable — is it running?', {
                style: {
                    background: 'var(--surface)',
                    color: 'var(--text)',
                    border: '1px solid var(--border-2)',
                    borderRadius: '12px',
                    boxShadow: 'var(--shadow-md)',
                    fontSize: '14px',
                },
            });
        } finally {
            setIsIngesting(false);
        }
    }, [onRefresh]);

    const navStyle: React.CSSProperties = {
        background: scrolled ? 'var(--nav-bg)' : 'transparent',
        backdropFilter: scrolled ? 'blur(20px)' : 'none',
        WebkitBackdropFilter: scrolled ? 'blur(20px)' : 'none',
        borderBottom: `1px solid ${scrolled ? 'var(--border-2)' : 'transparent'}`,
        boxShadow: scrolled ? 'var(--shadow-sm)' : 'none',
        transition: 'all 0.3s ease',
    };

    return (
        <nav className="sticky top-0 z-50" style={navStyle}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16 gap-3">

                    {/* ── Logo ─────────────────────────────── */}
                    <div className="flex items-center gap-2.5 flex-shrink-0 select-none">
                        <div
                            className="w-9 h-9 rounded-xl flex items-center justify-center relative"
                            style={{ background: 'var(--accent)', boxShadow: `0 3px 12px var(--accent-glow)` }}
                        >
                            <TrendingUp className="w-4.5 h-4.5 text-white w-5 h-5" />
                            {/* Live dot */}
                            <span className="absolute -top-1 -right-1 w-3 h-3">
                                <span className="absolute inset-0 rounded-full bg-green-500 opacity-70" style={{ animation: 'ping-slow 1.8s ease-out infinite' }} />
                                <span className="relative block w-3 h-3 rounded-full bg-green-500 border-2" style={{ borderColor: 'var(--bg)' }} />
                            </span>
                        </div>
                        <div>
                            <h1 className="font-bold text-base sm:text-lg leading-none" style={{ color: 'var(--text)' }}>
                                <span className="text-gradient">Stock</span> Radar
                            </h1>
                            <p className="text-[10px] hidden sm:block mt-0.5" style={{ color: 'var(--text-muted)', letterSpacing: '0.08em' }}>Sentiment Engine</p>
                        </div>
                    </div>

                    {/* ── Clock (desktop) ───────────────────── */}
                    <div className="hidden md:flex items-center gap-2.5">
                        <div
                            className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs"
                            style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text-muted)', boxShadow: 'var(--shadow-sm)' }}
                        >
                            <Activity className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'var(--accent)' }} />
                            <span className="font-mono tabular-nums">{time.toLocaleTimeString()}</span>
                        </div>
                        {lastUpdated && (
                            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                                Updated {lastUpdated.toLocaleTimeString()}
                            </span>
                        )}
                    </div>

                    {/* ── Desktop actions ───────────────────── */}
                    <div className="hidden sm:flex items-center gap-2">
                        {/* Theme toggle */}
                        <button
                            onClick={onToggleTheme}
                            className="btn-ghost w-10 h-10 p-0 justify-center rounded-xl"
                            title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
                            aria-label="Toggle theme"
                        >
                            {isDark
                                ? <Sun className="w-4 h-4" style={{ color: '#f59e0b' }} />
                                : <Moon className="w-4 h-4" style={{ color: '#6366f1' }} />
                            }
                        </button>

                        <button onClick={onRefresh} disabled={isRefreshing} className="btn-ghost">
                            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                            Refresh
                        </button>

                        <button onClick={handleIngest} disabled={isIngesting} className="btn-primary">
                            <Zap className={`w-4 h-4 ${isIngesting ? 'animate-pulse' : ''}`} />
                            {isIngesting ? 'Fetching…' : 'Fetch Data'}
                        </button>
                    </div>

                    {/* ── Mobile: theme toggle + hamburger ─── */}
                    <div className="sm:hidden flex items-center gap-2">
                        <button
                            onClick={onToggleTheme}
                            className="btn-ghost w-9 h-9 p-0 justify-center rounded-xl"
                            aria-label="Toggle theme"
                        >
                            {isDark
                                ? <Sun className="w-4 h-4" style={{ color: '#f59e0b' }} />
                                : <Moon className="w-4 h-4" style={{ color: '#6366f1' }} />
                            }
                        </button>
                        <button
                            className="w-9 h-9 flex items-center justify-center rounded-xl"
                            style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}
                            onClick={(e) => { e.stopPropagation(); setMobileOpen((v) => !v); }}
                            aria-label="Menu"
                        >
                            {mobileOpen ? <X className="w-4 h-4" style={{ color: 'var(--text-2)' }} /> : <Menu className="w-4 h-4" style={{ color: 'var(--text-2)' }} />}
                        </button>
                    </div>

                </div>
            </div>

            {/* ── Mobile menu ───────────────────────────── */}
            {mobileOpen && (
                <div
                    className="sm:hidden border-t animate-fade-in"
                    style={{ background: 'var(--nav-bg)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', borderColor: 'var(--border)' }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col gap-3">
                        {/* Clock */}
                        <div className="flex items-center justify-between text-xs pb-3" style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                            <div className="flex items-center gap-2">
                                <Activity className="w-3.5 h-3.5" style={{ color: 'var(--accent)' }} />
                                <span className="font-mono tabular-nums">{time.toLocaleTimeString()}</span>
                            </div>
                            {lastUpdated && <span>Updated {lastUpdated.toLocaleTimeString()}</span>}
                        </div>
                        {/* Buttons */}
                        <div className="flex gap-2">
                            <button onClick={() => { onRefresh(); setMobileOpen(false); }} disabled={isRefreshing} className="btn-ghost flex-1 justify-center">
                                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} /> Refresh
                            </button>
                            <button onClick={() => { handleIngest(); setMobileOpen(false); }} disabled={isIngesting} className="btn-primary flex-1 justify-center">
                                <Zap className={`w-4 h-4 ${isIngesting ? 'animate-pulse' : ''}`} />
                                {isIngesting ? 'Fetching…' : 'Fetch Data'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </nav>
    );
}
