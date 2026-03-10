import { fetchRedditMentions } from '../services/redditService';
import { fetchPrices } from '../services/priceService';
import { SentimentSnapshot } from '../models/SentimentSnapshot';

/**
 * Core ingestion logic: scrape Reddit → match tickers → fetch prices → save to MongoDB.
 * Returns the number of snapshots saved.
 */
export async function runIngestion(): Promise<number> {
    const subredditsRaw = process.env.SUBREDDITS || 'wallstreetbets,stocks,investing';
    const subreddits = subredditsRaw.split(',').map((s) => s.trim());

    console.log(`[Ingest] Starting ingestion across: r/${subreddits.join(', r/')}`);

    // 1. Fetch Reddit mentions
    const mentions = await fetchRedditMentions(subreddits);
    if (mentions.length === 0) {
        console.warn('[Ingest] No ticker mentions found.');
        return 0;
    }

    console.log(`[Ingest] Found ${mentions.length} tickers with mentions.`);

    // 2. Fetch prices for every ticker that has at least 1 mention
    const tickers = mentions.map((m) => m.ticker);
    const prices = await fetchPrices(tickers);

    // Index prices by ticker for O(1) lookup
    const priceMap: Record<string, { price: number; priceChange: number }> = {};
    for (const p of prices) {
        priceMap[p.ticker] = { price: p.price, priceChange: p.priceChange };
    }

    // 3. Persist snapshots
    const now = new Date();
    const docs = mentions.map((m) => ({
        ticker: m.ticker,
        mentions: m.mentions,
        price: priceMap[m.ticker]?.price ?? 0,
        priceChange: priceMap[m.ticker]?.priceChange ?? 0,
        subreddits: m.subreddits,
        timestamp: now,
    }));

    await SentimentSnapshot.insertMany(docs);
    console.log(`[Ingest] Saved ${docs.length} snapshots at ${now.toISOString()}`);
    return docs.length;
}
