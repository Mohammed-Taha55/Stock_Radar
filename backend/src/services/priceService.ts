import axios from 'axios';

const FINNHUB_BASE = 'https://finnhub.io/api/v1';

// Realistic mock prices for demo mode (used when API key is "demo" or missing)
const MOCK_PRICES: Record<string, { price: number; change: number }> = {
    TSLA: { price: 185.20, change: 2.3 },
    AAPL: { price: 213.45, change: 0.8 },
    GME: { price: 21.50, change: -1.2 },
    AMC: { price: 4.89, change: -3.5 },
    NVDA: { price: 875.30, change: 4.1 },
    AMZN: { price: 194.50, change: 1.5 },
    MSFT: { price: 415.10, change: 0.5 },
    META: { price: 510.20, change: 2.8 },
    GOOGL: { price: 175.80, change: 1.9 },
    PLTR: { price: 23.40, change: 3.7 },
    SOFI: { price: 8.15, change: -0.6 },
    AMD: { price: 168.20, change: 2.1 },
    COIN: { price: 235.60, change: 5.2 },
    RIVN: { price: 12.30, change: -2.8 },
    NIO: { price: 5.89, change: -1.4 },
    RBLX: { price: 41.20, change: 0.9 },
    SNAP: { price: 11.50, change: -1.1 },
    UBER: { price: 75.60, change: 1.3 },
    HOOD: { price: 18.40, change: 4.6 },
    SPY: { price: 519.80, change: 0.4 },
    QQQ: { price: 449.30, change: 0.7 },
    ARKK: { price: 45.60, change: 1.8 },
    F: { price: 12.90, change: -0.3 },
    BAC: { price: 41.20, change: 0.6 },
    NFLX: { price: 618.40, change: 2.2 },
    BABA: { price: 92.30, change: -1.7 },
    DIS: { price: 114.50, change: 0.8 },
    SQ: { price: 74.30, change: 3.1 },
    PYPL: { price: 63.80, change: -0.9 },
    NET: { price: 95.60, change: 2.4 },
    CRWD: { price: 378.90, change: 3.8 },
    SNOW: { price: 158.20, change: 1.6 },
    SHOP: { price: 112.40, change: 2.9 },
};

function addJitter(base: number): number {
    // Add ±2% random jitter to mock prices to simulate live data
    const jitter = 1 + (Math.random() * 0.04 - 0.02);
    return parseFloat((base * jitter).toFixed(2));
}

export interface PriceData {
    ticker: string;
    price: number;
    priceChange: number;
}

async function fetchPriceFinnhub(ticker: string, apiKey: string): Promise<PriceData | null> {
    try {
        const res = await axios.get(`${FINNHUB_BASE}/quote`, {
            params: { symbol: ticker, token: apiKey },
            timeout: 8000,
        });
        const { c: price, dp: priceChange } = res.data;
        if (!price || price === 0) return null;
        return { ticker, price, priceChange: parseFloat((priceChange ?? 0).toFixed(2)) };
    } catch {
        return null;
    }
}

function getMockPrice(ticker: string): PriceData {
    const mock = MOCK_PRICES[ticker];
    if (mock) {
        return { ticker, price: addJitter(mock.price), priceChange: mock.change };
    }
    // Unknown ticker: generate plausible random price
    const price = parseFloat((Math.random() * 200 + 10).toFixed(2));
    return { ticker, price, priceChange: parseFloat((Math.random() * 10 - 5).toFixed(2)) };
}

/**
 * Fetch current prices for a list of tickers.
 * Falls back to mock data if Finnhub key is "demo" or API call fails.
 */
export async function fetchPrices(tickers: string[]): Promise<PriceData[]> {
    const apiKey = process.env.FINNHUB_API_KEY || 'demo';
    const useMock = !apiKey || apiKey === 'demo' || apiKey === 'your_finnhub_api_key_here';

    if (useMock) {
        console.log('[Prices] Using mock price data (set FINNHUB_API_KEY in .env to use live prices)');
        return tickers.map(getMockPrice);
    }

    const results: PriceData[] = [];
    // Rate-limit: Finnhub free tier allows 60 req/min
    for (const ticker of tickers) {
        const data = await fetchPriceFinnhub(ticker, apiKey);
        if (data) {
            results.push(data);
        } else {
            // Fallback to mock for this particular ticker
            results.push(getMockPrice(ticker));
        }
        // Small delay between requests to respect rate limits
        await new Promise((r) => setTimeout(r, 200));
    }

    return results;
}
