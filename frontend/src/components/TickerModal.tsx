import { useEffect, useState, useCallback } from 'react';
import { X, TrendingUp, TrendingDown, BarChart3, Clock, ExternalLink } from 'lucide-react';
import { fetchTickerHistory, type HistoryPoint } from '../api/snapshots';
import {
    AreaChart, Area, XAxis, YAxis, Tooltip,
    ResponsiveContainer, CartesianGrid,
} from 'recharts';

interface Props {
    ticker: string;
    currentPrice: number;
    currentChange: number;
    currentMentions: number;
    onClose: () => void;
}

const fmt = (iso: string) =>
    new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

function CustomTip({ active, payload }: { active?: boolean; payload?: Array<{ value: number; name: string }> }) {
    if (!active || !payload?.length) return null;
    return (
        <div className="rounded-xl p-3 text-xs" style={{ background: 'var(--surface)', border: '1px solid var(--border-2)', boxShadow: 'var(--shadow-md)', color: 'var(--text)' }}>
            {payload.map((p) => (
                <div key={p.name} className="flex items-center gap-2">
                    <span style={{ color: 'var(--text-muted)' }}>{p.name}:</span>
                    <span className="font-semibold">{p.name === 'Price' ? `$${Number(p.value).toFixed(2)}` : p.value}</span>
                </div>
            ))}
        </div>
    );
}

export default function TickerModal({ ticker, currentPrice, currentChange, currentMentions, onClose }: Props) {
    const [history, setHistory] = useState<HistoryPoint[]>([]);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState<'price' | 'mentions'>('price');
    const isPos = currentChange >= 0;

    const load = useCallback(async () => {
        setLoading(true);
        try { setHistory(await fetchTickerHistory(ticker)); }
        catch { /* no-op */ }
        finally { setLoading(false); }
    }, [ticker]);

    useEffect(() => {
        load();
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = ''; };
    }, [load]);

    useEffect(() => {
        const fn = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', fn);
        return () => window.removeEventListener('keydown', fn);
    }, [onClose]);

    const chartData = history.map((h) => ({ time: fmt(h.timestamp), Price: h.price, Mentions: h.mentions }));
    const dataKey = tab === 'price' ? 'Price' : 'Mentions';
    const lineColor = tab === 'price' ? 'var(--accent)' : '#f97316';

    const min = chartData.length ? Math.min(...chartData.map((d) => d[dataKey])) * 0.985 : 0;
    const max = chartData.length ? Math.max(...chartData.map((d) => d[dataKey])) * 1.015 : 100;

    return (
        <div
            className="fixed inset-0 z-[90] flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in"
            style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(6px)' }}
            onClick={onClose}
        >
            <div
                className="relative w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl p-5 sm:p-7 animate-fade-up"
                style={{
                    background: 'var(--surface)',
                    border: '1px solid var(--border-2)',
                    boxShadow: 'var(--shadow-lg)',
                    maxHeight: '92dvh',
                    overflowY: 'auto',
                }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Close */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 w-8 h-8 rounded-xl flex items-center justify-center transition-colors"
                    style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}
                >
                    <X className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                </button>

                {/* Header */}
                <div className="flex items-start gap-4 mb-5 pr-10">
                    <div
                        className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
                        style={{ background: 'var(--accent)', boxShadow: `0 4px 16px var(--accent-glow)` }}
                    >
                        <span className="font-bold text-sm text-white">{ticker.slice(0, 2)}</span>
                    </div>
                    <div className="flex-1">
                        <h3 className="font-bold text-2xl text-gradient">${ticker}</h3>
                        <div className="flex flex-wrap items-center gap-3 mt-1">
                            <span className="font-semibold text-lg" style={{ color: 'var(--text)' }}>${currentPrice.toFixed(2)}</span>
                            <span className={isPos ? 'badge-up' : 'badge-down'}>
                                {isPos ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                                {isPos ? '+' : ''}{currentChange.toFixed(2)}%
                            </span>
                            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{currentMentions} mentions today</span>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-1 mb-4 p-1 rounded-xl" style={{ background: 'var(--surface-2)' }}>
                    {(['price', 'mentions'] as const).map((t) => (
                        <button
                            key={t}
                            onClick={() => setTab(t)}
                            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all duration-200"
                            style={tab === t
                                ? { background: 'var(--surface)', color: 'var(--accent)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border)' }
                                : { color: 'var(--text-muted)' }
                            }
                        >
                            {t === 'price' ? <BarChart3 className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                            {t === 'price' ? 'Price (24h)' : 'Mentions (24h)'}
                        </button>
                    ))}
                </div>

                {/* Chart */}
                {loading ? (
                    <div className="skeleton h-48 rounded-2xl" />
                ) : chartData.length === 0 ? (
                    <div className="h-48 flex flex-col items-center justify-center" style={{ color: 'var(--text-muted)' }}>
                        <BarChart3 className="w-8 h-8 mb-2 opacity-25" />
                        <p className="text-sm">No history yet — wait for more ingestion cycles</p>
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height={200}>
                        <AreaChart data={chartData} margin={{ top: 4, right: 8, bottom: 0, left: -16 }}>
                            <defs>
                                <linearGradient id={`grad-${tab}`} x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor={lineColor} stopOpacity={0.25} />
                                    <stop offset="100%" stopColor={lineColor} stopOpacity={0.02} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                            <XAxis dataKey="time" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                            <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 10 }} tickLine={false} axisLine={false} domain={[min, max]} tickFormatter={(v) => tab === 'price' ? `$${v.toFixed(0)}` : v} />
                            <Tooltip content={<CustomTip />} cursor={{ stroke: lineColor, strokeWidth: 1, strokeDasharray: '4 4' }} />
                            <Area type="monotone" dataKey={dataKey} stroke={lineColor} strokeWidth={2} fill={`url(#grad-${tab})`} dot={false} activeDot={{ r: 4, fill: lineColor, strokeWidth: 0 }} />
                        </AreaChart>
                    </ResponsiveContainer>
                )}

                {/* Footer */}
                <div className="mt-4 pt-4 flex items-center justify-between" style={{ borderTop: '1px solid var(--border)' }}>
                    <p className="text-xs flex items-center gap-1.5" style={{ color: 'var(--text-muted)' }}>
                        <Clock className="w-3 h-3" /> Last 24h · updates every 15 min
                    </p>
                    <a
                        href={`https://finance.yahoo.com/quote/${ticker}`}
                        target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs font-medium transition-opacity hover:opacity-80"
                        style={{ color: 'var(--accent)' }}
                    >
                        <ExternalLink className="w-3 h-3" /> Yahoo Finance
                    </a>
                </div>
            </div>
        </div>
    );
}
