import {
    ComposedChart, Bar, Line, XAxis, YAxis,
    CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend,
} from 'recharts';
import { BarChart3 } from 'lucide-react';
import type { Snapshot } from '../api/snapshots';

interface Props { snapshots: Snapshot[]; isLoading: boolean; }

const BARS = [
    '#6366f1', '#f97316', '#22c55e', '#ef4444', '#3b82f6',
    '#a855f7', '#f59e0b', '#14b8a6', '#ec4899', '#84cc16',
    '#0ea5e9', '#fb923c', '#8b5cf6', '#10b981', '#f43f5e',
    '#6366f1', '#f97316', '#22c55e', '#ef4444', '#3b82f6',
];

function CustomTip({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string }) {
    if (!active || !payload?.length) return null;
    return (
        <div className="rounded-2xl p-3 text-xs" style={{ background: 'var(--surface)', border: '1px solid var(--border-2)', boxShadow: 'var(--shadow-lg)', color: 'var(--text)' }}>
            <p className="font-bold mb-2 text-gradient">${label}</p>
            {payload.map((p) => (
                <div key={p.name} className="flex items-center gap-2 mb-1">
                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: p.color }} />
                    <span style={{ color: 'var(--text-muted)' }}>{p.name}:</span>
                    <span className="font-semibold ml-auto pl-3">
                        {p.name === 'Price' ? `$${Number(p.value).toFixed(2)}` : Number(p.value).toLocaleString()}
                    </span>
                </div>
            ))}
        </div>
    );
}

export default function SentimentChart({ snapshots, isLoading }: Props) {
    const data = snapshots.slice(0, 20).map((s) => ({ ticker: s.ticker, Mentions: s.mentions, Price: s.price }));

    return (
        <div className="card p-5 sm:p-6">
            <div className="flex items-center gap-3 mb-5">
                <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: 'var(--accent)', boxShadow: `0 3px 10px var(--accent-glow)` }}
                >
                    <BarChart3 className="w-4 h-4 text-white" />
                </div>
                <div>
                    <h2 className="font-semibold text-sm" style={{ color: 'var(--text)' }}>Sentiment vs. Price</h2>
                    <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>Mentions (bars) · Price (line) · Top {data.length}</p>
                </div>
            </div>

            {isLoading ? (
                <div className="skeleton h-64 sm:h-72 rounded-2xl" />
            ) : data.length === 0 ? (
                <div className="h-64 flex flex-col items-center justify-center" style={{ color: 'var(--text-muted)' }}>
                    <BarChart3 className="w-10 h-10 mb-3 opacity-30" />
                    <p className="text-sm">Fetch data to populate the chart</p>
                </div>
            ) : (
                <ResponsiveContainer width="100%" height={280}>
                    <ComposedChart data={data} margin={{ top: 4, right: 24, bottom: 0, left: -4 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                        <XAxis
                            dataKey="ticker"
                            tick={{ fill: 'var(--text-muted)', fontSize: 11, fontWeight: 600 }}
                            tickLine={false} axisLine={false}
                            interval={0}
                            angle={data.length > 10 ? -40 : 0}
                            textAnchor={data.length > 10 ? 'end' : 'middle'}
                            height={data.length > 10 ? 52 : 28}
                        />
                        <YAxis yAxisId="m" orientation="left"
                            tick={{ fill: 'var(--text-muted)', fontSize: 11 }} tickLine={false} axisLine={false} width={30} />
                        <YAxis yAxisId="p" orientation="right"
                            tick={{ fill: 'var(--accent)', fontSize: 11 }} tickLine={false} axisLine={false} width={50}
                            tickFormatter={(v) => `$${v}`} />
                        <Tooltip content={<CustomTip />} cursor={{ fill: 'var(--border)' }} />
                        <Legend wrapperStyle={{ paddingTop: 14, fontSize: 12, color: 'var(--text-muted)' }} />

                        <Bar yAxisId="m" dataKey="Mentions" radius={[5, 5, 0, 0]} maxBarSize={36}>
                            {data.map((_, i) => <Cell key={i} fill={BARS[i % BARS.length]} fillOpacity={0.85} />)}
                        </Bar>
                        <Line yAxisId="p" type="monotone" dataKey="Price"
                            stroke="var(--accent)" strokeWidth={2}
                            dot={{ r: 3.5, fill: 'var(--accent)', strokeWidth: 0 }}
                            activeDot={{ r: 5.5, fill: 'var(--accent)', stroke: 'var(--accent-glow)', strokeWidth: 4 }}
                        />
                    </ComposedChart>
                </ResponsiveContainer>
            )}
        </div>
    );
}
