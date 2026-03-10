import { useState, useEffect, useCallback } from 'react';
import { AlertTriangle, Search, SlidersHorizontal, Layers, DollarSign, Hash, TrendingUp } from 'lucide-react';
import { fetchSnapshots, type Snapshot } from '../api/snapshots';
import HeatList from '../components/HeatList';
import TickerCard from '../components/TickerCard';
import SentimentChart from '../components/SentimentChart';
import MarketMoodBar from '../components/MarketMoodBar';

interface Props { refreshKey: number; onLoadComplete: (d: Date) => void; }

const STATS = [
    { key: 'tracked', label: 'Tickers Tracked', icon: Layers, color: '#6366f1', bg: 'rgba(99,102,241,0.1)', border: 'rgba(99,102,241,0.18)', compute: (s: Snapshot[]) => s.length.toString() },
    { key: 'mentions', label: 'Total Mentions', icon: Hash, color: '#0ea5e9', bg: 'rgba(14,165,233,0.1)', border: 'rgba(14,165,233,0.18)', compute: (s: Snapshot[]) => s.reduce((t, x) => t + x.mentions, 0).toLocaleString() },
    { key: 'ticker', label: 'Top Ticker', icon: TrendingUp, color: '#ef4444', bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.18)', compute: (s: Snapshot[]) => s[0]?.ticker ? `$${s[0].ticker}` : '—' },
    { key: 'price', label: 'Top Price', icon: DollarSign, color: '#16a34a', bg: 'rgba(22,163,74,0.1)', border: 'rgba(22,163,74,0.18)', compute: (s: Snapshot[]) => s[0]?.price ? `$${s[0].price.toFixed(2)}` : '—' },
];

export default function Dashboard({ refreshKey, onLoadComplete }: Props) {
    const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    const [sortBy, setSortBy] = useState<'mentions' | 'price' | 'change'>('mentions');
    const [showChart, setShowChart] = useState(true);

    const load = useCallback(async () => {
        setLoading(true); setError(null);
        try {
            const data = await fetchSnapshots(50);
            setSnapshots(data);
            onLoadComplete(new Date());
        } catch {
            setError('Cannot reach the backend. Make sure it is running on port 5000.');
        } finally {
            setLoading(false);
        }
    }, [onLoadComplete]);

    useEffect(() => { load(); }, [load, refreshKey]);

    const filtered = snapshots
        .filter((s) => !search || s.ticker.toLowerCase().includes(search.toLowerCase()))
        .sort((a, b) => sortBy === 'price' ? b.price - a.price : sortBy === 'change' ? b.priceChange - a.priceChange : b.mentions - a.mentions);

    if (error) return (
        <div className="max-w-sm mx-auto mt-20 px-4 animate-fade-up">
            <div className="card p-6 text-center">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
                    style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
                    <AlertTriangle className="w-7 h-7" style={{ color: 'var(--down)' }} />
                </div>
                <h3 className="font-bold text-lg mb-2" style={{ color: 'var(--text)' }}>Backend Unreachable</h3>
                <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>{error}</p>
                <pre className="text-left text-xs font-mono p-3 rounded-xl mb-4 overflow-x-auto"
                    style={{ background: 'rgba(99,102,241,0.07)', border: '1px solid rgba(99,102,241,0.15)', color: 'var(--accent)' }}>
                    {'cd backend\nnpm run dev'}
                </pre>
                <button onClick={load} className="btn-primary w-full justify-center">Retry</button>
            </div>
        </div>
    );

    return (
        <div className="relative z-10 max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-5 sm:space-y-7">

            {/* Hero */}
            <div className="animate-fade-up">
                <h2 className="font-bold text-2xl sm:text-3xl lg:text-4xl leading-snug" style={{ color: 'var(--text)' }}>
                    <span className="text-gradient">Meme Stock</span> Sentiment Radar
                </h2>
                <p className="text-xs sm:text-sm mt-1.5" style={{ color: 'var(--text-muted)' }}>
                    Reddit buzz tracked live · tap any card for 24h history
                </p>
            </div>

            {/* Mood bar */}
            <MarketMoodBar snapshots={snapshots} isLoading={loading} />

            {/* Stat cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                {STATS.map((s, i) => {
                    const Icon = s.icon;
                    return (
                        <div key={s.key} className="stat-card group" style={{ animationDelay: `${i * 55}ms`, border: `1px solid ${s.border}` }}>
                            <div className="flex items-start justify-between mb-2">
                                <p className="text-[10px] sm:text-xs leading-snug" style={{ color: 'var(--text-muted)' }}>{s.label}</p>
                                <div className="w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110"
                                    style={{ background: s.bg }}>
                                    <Icon className="w-3.5 h-3.5" style={{ color: s.color }} />
                                </div>
                            </div>
                            {loading
                                ? <div className="skeleton h-7 w-20 rounded-lg" />
                                : <p className="font-bold text-2xl sm:text-3xl animate-fade-up tabular-nums"
                                    style={{ color: s.color, animationDelay: `${i * 55 + 80}ms` }}>
                                    {s.compute(snapshots)}
                                </p>
                            }
                        </div>
                    );
                })}
            </div>

            {/* Mobile chart/list toggle */}
            <div className="flex gap-2 sm:hidden">
                {(['Chart', 'Heat List'] as const).map((t) => (
                    <button key={t} onClick={() => setShowChart(t === 'Chart')}
                        className="flex-1 text-xs py-2.5 rounded-xl font-semibold transition-all"
                        style={(showChart && t === 'Chart') || (!showChart && t !== 'Chart')
                            ? { background: 'var(--accent)', color: '#fff', boxShadow: `0 2px 10px var(--accent-glow)` }
                            : { background: 'var(--surface-2)', color: 'var(--text-muted)', border: '1px solid var(--border)' }
                        }>
                        {t}
                    </button>
                ))}
            </div>

            {/* Chart + HeatList */}
            <div className="grid lg:grid-cols-3 gap-4 sm:gap-5 animate-fade-up" style={{ animationDelay: '180ms' }}>
                <div className={`lg:col-span-2 ${!showChart ? 'hidden sm:block' : ''}`}>
                    <SentimentChart snapshots={snapshots} isLoading={loading} />
                </div>
                <div className={`${showChart && 'hidden sm:block'}`}>
                    <HeatList snapshots={snapshots} isLoading={loading} />
                </div>
            </div>

            {/* Ticker grid */}
            <div className="animate-fade-up" style={{ animationDelay: '260ms' }}>
                {/* Toolbar */}
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mb-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                        <input type="text" placeholder="Search ticker…" value={search}
                            onChange={(e) => setSearch(e.target.value)} className="input pl-9 w-full" />
                    </div>
                    <div className="flex items-center gap-1.5">
                        <SlidersHorizontal className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--text-muted)' }} />
                        {(['mentions', 'price', 'change'] as const).map((opt) => (
                            <button key={opt} onClick={() => setSortBy(opt)}
                                className="text-xs px-3 py-2 rounded-xl font-medium transition-all"
                                style={sortBy === opt
                                    ? { background: 'var(--accent)', color: '#fff', boxShadow: `0 2px 8px var(--accent-glow)` }
                                    : { background: 'var(--surface-2)', color: 'var(--text-muted)', border: '1px solid var(--border)' }
                                }>
                                {opt.charAt(0).toUpperCase() + opt.slice(1)}
                            </button>
                        ))}
                    </div>
                </div>

                {loading || filtered.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
                        {loading
                            ? Array.from({ length: 12 }).map((_, i) => (
                                <div key={i} className="skeleton rounded-2xl h-52 animate-fade-up" style={{ animationDelay: `${i * 28}ms` }} />
                            ))
                            : filtered.map((snap, i) => <TickerCard key={snap.ticker} snapshot={snap} index={i} />)
                        }
                    </div>
                ) : (
                    <div className="card text-center py-16 animate-fade-up">
                        <p className="text-5xl mb-3">📡</p>
                        <h3 className="font-bold text-lg mb-1" style={{ color: 'var(--text-2)' }}>
                            {search ? `No results for "${search}"` : 'No Data Yet'}
                        </h3>
                        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                            {search ? 'Try a different ticker symbol' : 'Click "Fetch Data" in the navbar'}
                        </p>
                    </div>
                )}
            </div>
            <div className="h-4 sm:h-0" />
        </div>
    );
}
