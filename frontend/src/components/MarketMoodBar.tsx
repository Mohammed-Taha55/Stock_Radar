import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { Snapshot } from '../api/snapshots';

interface Props { snapshots: Snapshot[]; isLoading: boolean; }

export default function MarketMoodBar({ snapshots, isLoading }: Props) {
    if (isLoading) return <div className="skeleton h-16 rounded-2xl w-full" />;
    if (!snapshots.length) return null;

    const bullish = snapshots.filter((s) => s.priceChange > 1).length;
    const bearish = snapshots.filter((s) => s.priceChange < -1).length;
    const neutral = snapshots.length - bullish - bearish;
    const total = snapshots.length;

    const bullPct = Math.round((bullish / total) * 100);
    const bearPct = Math.round((bearish / total) * 100);
    const neutPct = 100 - bullPct - bearPct;

    const mood = bullPct > bearPct + 10 ? 'bullish' : bearPct > bullPct + 10 ? 'bearish' : 'neutral';
    const moodCfg = {
        bullish: { label: '🚀 Bullish Market', color: 'var(--up)' },
        bearish: { label: '🐻 Bearish Market', color: 'var(--down)' },
        neutral: { label: '⚖️ Neutral Market', color: 'var(--text-muted)' },
    };

    return (
        <div className="card p-4 animate-fade-up" style={{ animationDelay: '100ms' }}>
            <div className="flex flex-wrap items-center justify-between gap-3 mb-2.5">
                <h3 className="font-semibold text-sm" style={{ color: moodCfg[mood].color }}>
                    {moodCfg[mood].label}
                </h3>
                <div className="flex items-center gap-3 text-xs" style={{ color: 'var(--text-muted)' }}>
                    <span className="flex items-center gap-1" style={{ color: 'var(--up)' }}>
                        <TrendingUp className="w-3.5 h-3.5" /> {bullish} bull
                    </span>
                    <span className="flex items-center gap-1">
                        <Minus className="w-3.5 h-3.5" /> {neutral} neutral
                    </span>
                    <span className="flex items-center gap-1" style={{ color: 'var(--down)' }}>
                        <TrendingDown className="w-3.5 h-3.5" /> {bearish} bear
                    </span>
                </div>
            </div>

            {/* Segmented bar */}
            <div className="flex h-2 rounded-full overflow-hidden gap-0.5">
                {bullPct > 0 && (
                    <div className="transition-all duration-1000 rounded-l-full" style={{ width: `${bullPct}%`, background: 'var(--up)' }} />
                )}
                {neutPct > 0 && (
                    <div className="transition-all duration-1000" style={{ width: `${neutPct}%`, background: 'var(--border-2)' }} />
                )}
                {bearPct > 0 && (
                    <div className="transition-all duration-1000 rounded-r-full" style={{ width: `${bearPct}%`, background: 'var(--down)' }} />
                )}
            </div>
            <div className="flex justify-between text-[10px] mt-1.5" style={{ color: 'var(--text-muted)' }}>
                <span>{bullPct}% bull</span>
                <span>{neutPct}% neutral</span>
                <span>{bearPct}% bear</span>
            </div>
        </div>
    );
}
