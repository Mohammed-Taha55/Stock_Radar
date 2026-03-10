import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
    baseURL: API_BASE,
    timeout: 15000,
});

export interface Snapshot {
    ticker: string;
    mentions: number;
    price: number;
    priceChange: number;
    subreddits: string[];
    timestamp: string;
}

export interface HistoryPoint {
    ticker: string;
    mentions: number;
    price: number;
    priceChange: number;
    timestamp: string;
}

/** Fetch the latest snapshot per ticker, sorted by mentions descending */
export async function fetchSnapshots(limit = 20): Promise<Snapshot[]> {
    const res = await api.get<{ success: boolean; data: Snapshot[] }>('/snapshots', {
        params: { limit },
    });
    return res.data.data;
}

/** Fetch 24h history for a specific ticker */
export async function fetchTickerHistory(ticker: string): Promise<HistoryPoint[]> {
    const res = await api.get<{ success: boolean; ticker: string; data: HistoryPoint[] }>(
        `/snapshots/${ticker}/history`
    );
    return res.data.data;
}

/** Manually trigger a full ingestion run */
export async function triggerIngestion(): Promise<{ count: number }> {
    const res = await api.post<{ success: boolean; count: number }>('/snapshots/ingest');
    return { count: res.data.count };
}
