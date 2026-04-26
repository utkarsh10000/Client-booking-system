import mongoose from 'mongoose';

const SectorSchema = new mongoose.Schema(
  {
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
    name:      { type: String, required: true, uppercase: true, trim: true },
  },
  { timestamps: true }
);

// Sector name unique per project (not globally)
SectorSchema.index({ name: 1, projectId: 1 }, { unique: true });

export default mongoose.models.Sector || mongoose.model('Sector', SectorSchema);