import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import cron from 'node-cron';
import dotenv from 'dotenv';

dotenv.config();

import snapshotRoutes from './routes/snapshots';
import { runIngestion } from './jobs/ingestJob';

const app = express();
const PORT = parseInt(process.env.PORT || '5000', 10);

// ─── Middleware ────────────────────────────────────────────────────────────────
app.use(cors({ origin: '*' }));
app.use(express.json());

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/snapshots', snapshotRoutes);

// Health check
app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── MongoDB Connection ────────────────────────────────────────────────────────
async function connectDB(): Promise<void> {
    const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/stock_radar';
    try {
        await mongoose.connect(uri);
        console.log(`[DB] Connected to MongoDB: ${uri}`);
    } catch (err) {
        console.error('[DB] Connection failed:', err);
        process.exit(1);
    }
}

// ─── Cron Job ─────────────────────────────────────────────────────────────────
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

// ─── Bootstrap ────────────────────────────────────────────────────────────────
async function bootstrap(): Promise<void> {
    await connectDB();
    startCronJob();

    app.listen(PORT, () => {
        console.log(`\n🚀 Stock Radar API running at http://localhost:${PORT}`);
        console.log(`   Health:    http://localhost:${PORT}/api/health`);
        console.log(`   Snapshots: http://localhost:${PORT}/api/snapshots`);
        console.log(`   Ingest:    POST http://localhost:${PORT}/api/snapshots/ingest`);
        console.log('\n   Run initial ingestion with:');
        console.log(`   curl -X POST http://localhost:${PORT}/api/snapshots/ingest\n`);
    });
}

bootstrap().catch(console.error);
