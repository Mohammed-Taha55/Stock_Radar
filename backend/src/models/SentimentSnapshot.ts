import mongoose, { Document, Schema } from 'mongoose';

export interface ISentimentSnapshot extends Document {
    ticker: string;
    mentions: number;
    price: number;
    priceChange: number; // % change from previous close
    subreddits: string[];
    timestamp: Date;
}

const SentimentSnapshotSchema = new Schema<ISentimentSnapshot>(
    {
        ticker: { type: String, required: true, uppercase: true, trim: true },
        mentions: { type: Number, required: true, min: 0 },
        price: { type: Number, required: true, min: 0 },
        priceChange: { type: Number, default: 0 },
        subreddits: { type: [String], default: [] },
        timestamp: { type: Date, default: Date.now },
    },
    { versionKey: false }
);

// Index for efficient ticker history queries
SentimentSnapshotSchema.index({ ticker: 1, timestamp: -1 });

export const SentimentSnapshot = mongoose.model<ISentimentSnapshot>(
    'SentimentSnapshot',
    SentimentSnapshotSchema
);
