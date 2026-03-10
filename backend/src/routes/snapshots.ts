import { Router, Request, Response } from 'express';
import { SentimentSnapshot } from '../models/SentimentSnapshot';
import { runIngestion } from '../jobs/ingestJob';

const router = Router();

// ─── GET /api/snapshots ─────────────────────────────────────────────────────
// Returns the most recent snapshot per ticker, sorted by mentions descending.
// Optional query param: ?limit=N (default 20)
router.get('/', async (req: Request, res: Response) => {
    try {
        const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);

        // Aggregate to get the latest snapshot per ticker
        const snapshots = await SentimentSnapshot.aggregate([
            { $sort: { timestamp: -1 } },
            {
                $group: {
                    _id: '$ticker',
                    ticker: { $first: '$ticker' },
                    mentions: { $first: '$mentions' },
                    price: { $first: '$price' },
                    priceChange: { $first: '$priceChange' },
                    subreddits: { $first: '$subreddits' },
                    timestamp: { $first: '$timestamp' },
                },
            },
            { $sort: { mentions: -1 } },
            { $limit: limit },
            { $project: { _id: 0, ticker: 1, mentions: 1, price: 1, priceChange: 1, subreddits: 1, timestamp: 1 } },
        ]);

        res.json({ success: true, data: snapshots });
    } catch (err) {
        console.error('[API] GET /snapshots error:', err);
        res.status(500).json({ success: false, error: 'Failed to fetch snapshots' });
    }
});

// ─── GET /api/snapshots/:ticker/history ─────────────────────────────────────
// Returns time-ordered snapshots for a given ticker over the last 24 hours.
router.get('/:ticker/history', async (req: Request, res: Response) => {
    try {
        const ticker = String(req.params.ticker).toUpperCase();
        const since = new Date(Date.now() - 24 * 60 * 60 * 1000); // last 24h

        const history = await SentimentSnapshot.find(
            { ticker, timestamp: { $gte: since } },
            { _id: 0, ticker: 1, mentions: 1, price: 1, priceChange: 1, timestamp: 1 }
        ).sort({ timestamp: 1 });

        res.json({ success: true, ticker, data: history });
    } catch (err) {
        console.error(`[API] GET /snapshots/${req.params.ticker}/history error:`, err);
        res.status(500).json({ success: false, error: 'Failed to fetch history' });
    }
});

// ─── GET/POST /api/ingest ─────────────────────────────────────────────────────
// Manually trigger a full ingestion run (or via Vercel Cron Job).
router.all('/ingest', async (req: Request, res: Response) => {
    // Vercel Cron Security (Optional but recommended)
    if (process.env.VERCEL && process.env.CRON_SECRET) {
        if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
            res.status(401).json({ success: false, error: 'Unauthorized cron request' });
            return;
        }
    }

    try {
        const count = await runIngestion();
        res.json({ success: true, message: `Ingestion complete`, count });
    } catch (err) {
        console.error('[API] /ingest error:', err);
        res.status(500).json({ success: false, error: 'Ingestion failed' });
    }
});

export default router;
