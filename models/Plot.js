import mongoose from 'mongoose';

const PlotSchema = new mongoose.Schema(
  {
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
    plotNo:    { type: String, required: true },
    sector:    { type: String, required: true },
    area:      { type: Number, required: true },
    dimensions:{ type: String, required: true },
    facing:    { type: String, default: '' },
    corner:    { type: Boolean, default: false },
    pricePerSqYard: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['available', 'hold', 'sold', 'booked', 'progress'],
      default: 'available',
    },
    notes:      { type: String, default: '' },
    heldByName: { type: String, default: '' },
    heldById:   { type: String, default: '' },
    holdUntil:  { type: Date,   default: null },
  },
  { timestamps: true }
);

// Unique plot number within same sector AND project
PlotSchema.index({ plotNo: 1, sector: 1, projectId: 1 }, { unique: true });

export default mongoose.models.Plot || mongoose.model('Plot', PlotSchema);