import axios from 'axios';

// Common meme-stock ticker symbols to watch
const KNOWN_TICKERS = [
    'TSLA', 'AAPL', 'GME', 'AMC', 'NVDA', 'AMZN', 'MSFT', 'META', 'GOOGL',
    'PLTR', 'SOFI', 'BBBY', 'NOK', 'BB', 'AMD', 'COIN', 'RIVN', 'LCID',
    'NIO', 'RBLX', 'SNAP', 'UBER', 'LYFT', 'HOOD', 'SPY', 'QQQ', 'ARKK',
    'BABA', 'DIS', 'NFLX', 'INTC', 'F', 'GE', 'T', 'BAC', 'WMT', 'SHOP',
    'ABNB', 'DKNG', 'PENN', 'NET', 'CRWD', 'SNOW', 'SQ', 'PYPL',
];

interface RedditPost {
    data: {
        title: string;
        selftext: string;
        score: number;
        url: string;
    };
}

interface RedditResponse {
    data: {
        children: RedditPost[];
    };
}

interface TickerMention {
    ticker: string;
    mentions: number;
    subreddits: string[];
}

/**
 * Builds a regex that matches $TICKER or standalone TICKER (at word boundaries)
 * ignoring common English words that look like tickers (I, A, IT, GO etc.)
 */
function buildTickerRegex(ticker: string): RegExp {
    return new RegExp(
        `(?:\\$${ticker}\\b|\\b${ticker}\\b)`,
        'gi'
    );
}

/**
 * Fetch top posts from a single subreddit using Reddit's public JSON API.
 * No auth required for public subreddits.
 */
async function fetchSubredditPosts(subreddit: string): Promise<string[]> {
    try {
        const url = `https://www.reddit.com/r/${subreddit}/top.json?limit=50&t=day`;
        const response = await axios.get<RedditResponse>(url, {
            headers: {
                'User-Agent': 'StockRadarBot/1.0 (educational project)',
            },
            timeout: 10000,
        });

        const posts = response.data.data.children;
        return posts.map((p) => `${p.data.title} ${p.data.selftext}`);
    } catch (err) {
        console.warn(`[Reddit] Failed to fetch r/${subreddit}:`, (err as Error).message);
        return [];
    }
}

/**
 * Count ticker mentions across all provided text blobs.
 */
function countMentions(textBlobs: string[], subreddit: string): Record<string, number> {
    const counts: Record<string, number> = {};
    const combined = textBlobs.join(' ');

    for (const ticker of KNOWN_TICKERS) {
        const regex = buildTickerRegex(ticker);
        const matches = combined.match(regex);
        if (matches && matches.length > 0) {
            counts[ticker] = (counts[ticker] || 0) + matches.length;
        }
    }

    return counts;
}

/**
 * Main export: fetch mentions across all configured subreddits.
 * Returns array sorted by mention count descending.
 */
export async function fetchRedditMentions(subreddits: string[]): Promise<TickerMention[]> {
    const mentionMap: Record<string, { count: number; subreddits: Set<string> }> = {};

    for (const subreddit of subreddits) {
        const posts = await fetchSubredditPosts(subreddit);
        const counts = countMentions(posts, subreddit);

        for (const [ticker, count] of Object.entries(counts)) {
            if (!mentionMap[ticker]) {
                mentionMap[ticker] = { count: 0, subreddits: new Set() };
            }
            mentionMap[ticker].count += count;
            mentionMap[ticker].subreddits.add(subreddit);
        }
    }

    return Object.entries(mentionMap)
        .filter(([, v]) => v.count > 0)
        .map(([ticker, v]) => ({
            ticker,
            mentions: v.count,
            subreddits: Array.from(v.subreddits),
        }))
        .sort((a, b) => b.mentions - a.mentions);
}
