import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const EXPRESSWAY_ID = '69e9f2d2ba997b5b04a4c900';

const PlotSchema = new mongoose.Schema({ projectId: mongoose.Schema.Types.ObjectId }, { strict: false });
const SectorSchema = new mongoose.Schema({ projectId: mongoose.Schema.Types.ObjectId }, { strict: false });

const Plot = mongoose.models.Plot || mongoose.model('Plot', PlotSchema);
const Sector = mongoose.models.Sector || mongoose.model('Sector', SectorSchema);

await mongoose.connect(process.env.MONGODB_URI);

const plotResult = await Plot.updateMany(
  { projectId: { $exists: false } },
  { $set: { projectId: new mongoose.Types.ObjectId(EXPRESSWAY_ID) } }
);
console.log('Plots updated:', plotResult.modifiedCount);

const sectorResult = await Sector.updateMany(
  { projectId: { $exists: false } },
  { $set: { projectId: new mongoose.Types.ObjectId(EXPRESSWAY_ID) } }
);
console.log('Sectors updated:', sectorResult.modifiedCount);

await mongoose.disconnect();
console.log('Done!');