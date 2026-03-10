import { useState, useCallback, useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';

export default function App() {
    // ── Theme ─────────────────────────────────────────
    const [isDark, setIsDark] = useState<boolean>(() => {
        if (typeof window === 'undefined') return true;
        const saved = localStorage.getItem('theme');
        if (saved) return saved === 'dark';
        return window.matchMedia('(prefers-color-scheme: dark)').matches;
    });

    useEffect(() => {
        const root = document.documentElement;
        root.classList.toggle('dark', isDark);
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
    }, [isDark]);

    const toggleTheme = useCallback(() => setIsDark((d) => !d), []);

    // ── Refresh ────────────────────────────────────────
    const [refreshKey, setRefreshKey] = useState(0);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

    const handleRefresh = useCallback(() => {
        setIsRefreshing(true);
        setRefreshKey((k) => k + 1);
        setTimeout(() => setIsRefreshing(false), 1500);
    }, []);

    const handleLoadComplete = useCallback((date: Date) => {
        setLastUpdated(date);
        setIsRefreshing(false);
    }, []);

    return (
        <>
            <Toaster
                position="top-right"
                containerStyle={{ top: 72 }}
                toastOptions={{ style: { maxWidth: 340 } }}
            />

            {/* Ambient background */}
            <div className="grid-bg" aria-hidden />
            <div className="orb orb-1" aria-hidden />
            <div className="orb orb-2" aria-hidden />
            <div className="orb orb-3" aria-hidden />

            {/* Shell */}
            <div className="relative flex flex-col min-h-dvh">
                <Navbar
                    onRefresh={handleRefresh}
                    isRefreshing={isRefreshing}
                    lastUpdated={lastUpdated}
                    isDark={isDark}
                    onToggleTheme={toggleTheme}
                />
                <main className="flex-1">
                    <Dashboard refreshKey={refreshKey} onLoadComplete={handleLoadComplete} />
                </main>
                <footer className="relative z-10 py-4 text-center border-t" style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}>
                    <p className="text-[11px]">Stock Radar · Reddit sentiment · Prices via Finnhub</p>
                </footer>
            </div>
        </>
    );
}
