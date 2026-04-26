import { connectDB } from '@/lib/mongoose';
import Sector from '@/models/Sector';
import Plot from '@/models/Plot';
import { cookies } from 'next/headers';

async function isAdmin() {
  const cookieStore = await cookies();
  return cookieStore.get('auth_role')?.value === 'admin';
}

export async function DELETE(request, { params }) {
  if (!await isAdmin()) return Response.json({ error: 'Forbidden' }, { status: 403 });
  try {
    await connectDB();
    const { name } = await params;
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

    const query = { name: decodeURIComponent(name).toUpperCase() };
    if (projectId) query.projectId = projectId;

    await Sector.deleteOne(query);
    // Also delete all plots in this sector for this project
    const plotQuery = { sector: decodeURIComponent(name).toUpperCase() };
    if (projectId) plotQuery.projectId = projectId;
    await Plot.deleteMany(plotQuery);

    return Response.json({ success: true });
  } catch (err) {
    console.error(err);
    return Response.json({ error: 'Failed to delete sector' }, { status: 500 });
  }
}