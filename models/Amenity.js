import mongoose from 'mongoose';

const AmenitySchema = new mongoose.Schema(
  {
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
    label:     { type: String, required: true, trim: true },
    area:      { type: String, default: '' },
  },
  { timestamps: true }
);

export default mongoose.models.Amenity || mongoose.model('Amenity', AmenitySchema);