// models/ClientCounter.js
import mongoose from 'mongoose';

const ClientCounterSchema = new mongoose.Schema({
  projectCode: { type: String, required: true, unique: true }, // e.g. "HWC", "HGC", "0ER"
  seq:         { type: Number, default: 0 },
});

export default mongoose.models.ClientCounter ||
  mongoose.model('ClientCounter', ClientCounterSchema);