import { connectDB } from '@/lib/mongoose';
import Sector from '@/models/Sector';
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

    const query = {};
    if (projectId) query.projectId = projectId;

    const sectors = await Sector.find(query).sort({ name: 1 }).lean();
    return Response.json({ sectors });
  } catch (err) {
    console.error(err);
    return Response.json({ error: 'Failed to fetch sectors' }, { status: 500 });
  }
}

export async function POST(request) {
  if (!await isAdmin()) return Response.json({ error: 'Forbidden' }, { status: 403 });
  try {
    await connectDB();
    const { name, projectId } = await request.json();

    if (!name?.trim() || !projectId) {
      return Response.json({ error: 'Name and projectId are required' }, { status: 400 });
    }

    const sector = await Sector.create({ name: name.trim().toUpperCase(), projectId });
    return Response.json({ sector }, { status: 201 });
  } catch (err) {
    if (err.code === 11000) return Response.json({ error: 'Sector already exists in this project' }, { status: 409 });
    console.error(err);
    return Response.json({ error: 'Failed to create sector' }, { status: 500 });
  }
}