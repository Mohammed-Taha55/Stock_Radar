import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import cron from 'node-cron';
import dotenv from 'dotenv';
import snapshotRoutes from './routes/snapshots';
import { runIngestion } from './jobs/ingestJob';

dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT || '5000', 10);

// ─── Serverless DB Connection ──────────────────────────────────────────────────
let isConnected = false;
async function connectDB() {
    if (isConnected) return;
    const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/stock_radar';
    try {
        await mongoose.connect(uri);
        isConnected = true;
        console.log(`[DB] Connected to MongoDB`);
    } catch (err) {
        console.error('[DB] Connection failed:', err);
    }
}

// Connect to DB before handling any request (Serverless pattern)
app.use(async (_req, _res, next) => {
    await connectDB();
    next();
});

// ─── Middleware ────────────────────────────────────────────────────────────────
app.use(cors({ origin: '*' }));
app.use(express.json());

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/snapshots', snapshotRoutes);

// Health check
app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── Cron Job (For Local / Render Only) ───────────────────────────────────────
function startCronJob(): void {
    const schedule = process.env.CRON_SCHEDULE || '*/15 * * * *';
    cron.schedule(schedule, async () => {
        console.log(`[Cron] Running ingestion at ${new Date().toISOString()}`);
        try {
            await runIngestion();
        } catch (err) {
            console.error('[Cron] Ingestion error:', err);
        }
    });
    console.log(`[Cron] Scheduled ingestion: "${schedule}"`);
}

// ─── Bootstrap (Local / Render) ───────────────────────────────────────────────
// Vercel sets VERCEL=1, so we only listen and start cron if NOT on Vercel
if (!process.env.VERCEL) {
    connectDB().then(() => {
        startCronJob();
        app.listen(PORT, () => {
            console.log(`\n🚀 Stock Radar API running at http://localhost:${PORT}`);
        });
    });
}

// Required for Vercel Serverless Functions
export default app;
