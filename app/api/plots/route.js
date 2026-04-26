import { connectDB } from '@/lib/mongoose';
import Plot from '@/models/Plot';
import { cookies } from 'next/headers';

async function isAdmin() {
  const cookieStore = await cookies();
  return cookieStore.get('auth_role')?.value === 'admin';
}

export async function GET(request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const sector    = searchParams.get('sector');
    const status    = searchParams.get('status');

    const query = {};
    if (projectId) query.projectId = projectId;
    if (sector)    query.sector = sector.toUpperCase();
    if (status)    query.status = status;

    const plots = await Plot.find(query).sort({ sector: 1, plotNo: 1 }).lean();
    return Response.json({ plots });
  } catch (err) {
    console.error(err);
    return Response.json({ error: 'Failed to fetch plots' }, { status: 500 });
  }
}

export async function POST(request) {
  if (!await isAdmin()) return Response.json({ error: 'Forbidden' }, { status: 403 });
  try {
    await connectDB();
    const body = await request.json();
    const { plotNo, sector, area, dimensions, facing, corner, pricePerSqYard, notes, projectId } = body;

    if (!plotNo || !sector || !area || !dimensions || !projectId) {
      return Response.json({ error: 'plotNo, sector, area, dimensions and projectId are required' }, { status: 400 });
    }

    const plot = await Plot.create({
      projectId,
      plotNo,
      sector: sector.toUpperCase(),
      area: Number(area),
      dimensions,
      facing: facing || '',
      corner: Boolean(corner),
      pricePerSqYard: Number(pricePerSqYard) || 0,
      status: 'available',
      notes: notes || '',
    });
    return Response.json({ plot }, { status: 201 });
  } catch (err) {
    if (err.code === 11000) return Response.json({ error: 'Plot number already exists in this sector' }, { status: 409 });
    console.error(err);
    return Response.json({ error: 'Failed to create plot' }, { status: 500 });
  }
}