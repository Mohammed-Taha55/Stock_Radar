import { Flame, TrendingUp, TrendingDown, Crown } from 'lucide-react';
import type { Snapshot } from '../api/snapshots';

interface Props { snapshots: Snapshot[]; isLoading: boolean; }

const RANKS = [
    { color: '#f59e0b', shadow: 'rgba(245,158,11,0.3)', label: <Crown className="w-3.5 h-3.5" style={{ color: '#fff' }} />, bg: 'linear-gradient(135deg,#f59e0b,#ef4444)' },
    { color: '#9ca3af', shadow: 'rgba(156,163,175,0.3)', label: '#2', bg: 'linear-gradient(135deg,#9ca3af,#6b7280)' },
    { color: '#b45309', shadow: 'rgba(180,83,9,0.3)', label: '#3', bg: 'linear-gradient(135deg,#b45309,#92400e)' },
    { color: '#6366f1', shadow: 'rgba(99,102,241,0.3)', label: '#4', bg: 'linear-gradient(135deg,#6366f1,#4f46e5)' },
    { color: '#8b5cf6', shadow: 'rgba(139,92,246,0.3)', label: '#5', bg: 'linear-gradient(135deg,#8b5cf6,#7c3aed)' },
];

function SkeletonRow({ i }: { i: number }) {
    return (
        <div className="flex items-center gap-3 p-3 animate-fade-in" style={{ animationDelay: `${i * 55}ms` }}>
            <div className="skeleton w-8 h-8 rounded-xl flex-shrink-0" />
            <div className="flex-1 space-y-2">
                <div className="skeleton h-3 w-14 rounded" />
                <div className="skeleton h-1.5 w-full rounded-full" />
            </div>
            <div className="skeleton h-4 w-14 rounded flex-shrink-0" />
        </div>
    );
}

export default function HeatList({ snapshots, isLoading }: Props) {
    const top5 = snapshots.slice(0, 5);
    const max = top5[0]?.mentions || 1;

    return (
        <div className="card p-5 h-full flex flex-col">
            {/* Header */}
            <div className="flex items-center gap-2.5 mb-4">
                <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: 'linear-gradient(135deg,#ef4444,#f97316)', boxShadow: '0 3px 10px rgba(239,68,68,0.3)' }}
                >
                    <Flame className="w-4 h-4 text-white" />
                </div>
                <div>
                    <p className="font-semibold text-sm" style={{ color: 'var(--text)' }}>Buzz Heat List</p>
                    <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>Top 5 most mentioned today</p>
                </div>
            </div>

            <div className="flex-1 space-y-0.5">
                {isLoading
                    ? Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} i={i} />)
                    : top5.length === 0
                        ? (
                            <div className="flex flex-col items-center justify-center py-10" style={{ color: 'var(--text-muted)' }}>
                                <Flame className="w-9 h-9 mb-2 opacity-30" />
                                <p className="text-sm">No data — click "Fetch Data"</p>
                            </div>
                        )
                        : top5.map((snap, i) => {
                            const rank = RANKS[i];
                            const pct = Math.round((snap.mentions / max) * 100);
                            const isPos = snap.priceChange >= 0;
                            return (
                                <div
                                    key={snap.ticker}
                                    className="flex items-center gap-3 p-3 rounded-2xl animate-fade-up cursor-default transition-colors duration-150"
                                    style={{ animationDelay: `${i * 65}ms` }}
                                    onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = 'var(--surface-2)')}
                                    onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = '')}
                                >
                                    {/* Rank */}
                                    <div
                                        className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 font-black text-xs text-white"
                                        style={{ background: rank.bg, boxShadow: `0 3px 10px ${rank.shadow}` }}
                                    >
                                        {rank.label}
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between mb-1.5">
                                            <span className="font-bold text-sm" style={{ color: 'var(--text)' }}>${snap.ticker}</span>
                                            <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{snap.mentions.toLocaleString()}</span>
                                        </div>
                                        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--surface-2)' }}>
                                            <div
                                                className="h-full rounded-full"
                                                style={{
                                                    width: `${pct}%`,
                                                    background: rank.bg,
                                                    boxShadow: `0 0 8px ${rank.shadow}`,
                                                    animation: `bar-fill 0.9s cubic-bezier(0.22,1,0.36,1) ${i * 65 + 200}ms both`,
                                                }}
                                            />
                                        </div>
                                    </div>

                                    {/* Price */}
                                    <div className="text-right flex-shrink-0">
                                        <div className="font-bold text-sm tabular-nums" style={{ color: 'var(--text)' }}>${snap.price.toFixed(2)}</div>
                                        <div className={isPos ? 'badge-up' : 'badge-down'}>
                                            {isPos ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                                            {isPos ? '+' : ''}{snap.priceChange.toFixed(2)}%
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                }
            </div>
        </div>
    );
}
