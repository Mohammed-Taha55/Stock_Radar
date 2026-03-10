import { useState } from 'react';
import { TrendingUp, TrendingDown, MessageSquare, Clock, Zap, ChevronRight } from 'lucide-react';
import type { Snapshot } from '../api/snapshots';
import TickerModal from './TickerModal';

interface Props { snapshot: Snapshot; index?: number; }

const BUZZ = {
    high: { label: 'HOT 🔥', color: '#ef4444', bg: 'rgba(239,68,68,0.09)', border: 'rgba(239,68,68,0.2)' },
    mid: { label: 'BUZZ', color: '#f97316', bg: 'rgba(249,115,22,0.09)', border: 'rgba(249,115,22,0.2)' },
    low: { label: 'QUIET', color: 'var(--accent)', bg: 'var(--accent-glow)', border: 'color-mix(in srgb, var(--accent) 30%, transparent)' },
};

const SUB: Record<string, { label: string; color: string }> = {
    wallstreetbets: { label: 'r/wsb', color: '#f97316' },
    stocks: { label: 'r/stocks', color: '#3b82f6' },
    investing: { label: 'r/investing', color: '#22c55e' },
};

function timeAgo(s: string) {
    const d = Math.floor((Date.now() - new Date(s).getTime()) / 1000);
    if (d < 60) return `${d}s ago`;
    if (d < 3600) return `${Math.floor(d / 60)}m ago`;
    if (d < 86400) return `${Math.floor(d / 3600)}h ago`;
    return `${Math.floor(d / 86400)}d ago`;
}

export default function TickerCard({ snapshot, index = 0 }: Props) {
    const { ticker, mentions, price, priceChange, subreddits, timestamp } = snapshot;
    const [open, setOpen] = useState(false);
    const isPos = priceChange >= 0;
    const buzz = mentions > 50 ? BUZZ.high : mentions > 15 ? BUZZ.mid : BUZZ.low;

    return (
        <>
            <button
                onClick={() => setOpen(true)}
                className="card p-4 sm:p-5 flex flex-col gap-3 animate-fade-up w-full text-left group"
                style={{ animationDelay: `${index * 40}ms`, cursor: 'pointer' }}
                aria-label={`View ${ticker} details`}
            >
                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-lg sm:text-xl tracking-wide" style={{ color: 'var(--text)' }}>
                                ${ticker}
                            </span>
                            <span
                                className="text-[10px] font-bold tracking-wide px-2 py-0.5 rounded-full flex-shrink-0"
                                style={{ color: buzz.color, background: buzz.bg, border: `1px solid ${buzz.border}` }}
                            >
                                {buzz.label}
                            </span>
                        </div>
                        <div className="flex items-center gap-1.5 mt-1 text-[11px]" style={{ color: 'var(--text-muted)' }}>
                            <Clock className="w-3 h-3 flex-shrink-0" />
                            {timeAgo(timestamp)}
                        </div>
                    </div>

                    <div className="text-right flex-shrink-0">
                        <div className="font-bold text-xl sm:text-2xl tabular-nums" style={{ color: 'var(--text)' }}>
                            ${price.toFixed(2)}
                        </div>
                        <div className={`flex items-center gap-0.5 justify-end mt-1 ${isPos ? 'badge-up' : 'badge-down'}`}>
                            {isPos ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                            {isPos ? '+' : ''}{priceChange.toFixed(2)}%
                        </div>
                    </div>
                </div>

                <div style={{ height: 1, background: 'var(--border)' }} />

                {/* Mentions */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-muted)' }}>
                        <MessageSquare className="w-3.5 h-3.5 flex-shrink-0" /> Reddit mentions
                    </div>
                    <div className="flex items-center gap-1.5">
                        {mentions > 30 && <Zap className="w-3.5 h-3.5 text-amber-500" />}
                        <span className="font-semibold text-sm tabular-nums" style={{ color: 'var(--text)' }}>{mentions.toLocaleString()}</span>
                    </div>
                </div>

                {/* Mini bar */}
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--surface-2)' }}>
                    <div
                        className="h-full rounded-full"
                        style={{
                            width: `${Math.min(100, mentions * 2)}%`,
                            background: `linear-gradient(to right, ${buzz.color}88, ${buzz.color})`,
                            animation: `bar-fill 0.9s ease ${index * 40 + 150}ms both`,
                        }}
                    />
                </div>

                {/* Tags + hint */}
                <div className="flex items-center justify-between gap-2">
                    <div className="flex flex-wrap gap-1.5 min-w-0">
                        {subreddits.slice(0, 2).map((sub) => {
                            const cfg = SUB[sub] ?? { label: `r/${sub}`, color: 'var(--text-muted)' };
                            return (
                                <span
                                    key={sub}
                                    className="text-[11px] font-medium px-2 py-0.5 rounded-full whitespace-nowrap"
                                    style={{ color: cfg.color, background: `color-mix(in srgb,${cfg.color} 12%,transparent)`, border: `1px solid color-mix(in srgb,${cfg.color} 25%,transparent)` }}
                                >
                                    {cfg.label}
                                </span>
                            );
                        })}
                    </div>
                    <div className="flex items-center gap-0.5 text-[10px] flex-shrink-0 transition-colors duration-150 group-hover:text-accent"
                        style={{ color: 'var(--text-muted)' }}>
                        <span className="hidden sm:inline" style={{ color: 'var(--accent)' }}>Details</span>
                        <ChevronRight className="w-3.5 h-3.5" style={{ color: 'var(--accent)' }} />
                    </div>
                </div>
            </button>

            {open && (
                <TickerModal
                    ticker={ticker} currentPrice={price}
                    currentChange={priceChange} currentMentions={mentions}
                    onClose={() => setOpen(false)}
                />
            )}
        </>
    );
}
