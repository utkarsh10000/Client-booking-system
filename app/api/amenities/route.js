import { connectDB } from '@/lib/mongoose';
import Amenity from '@/models/Amenity';
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

    const amenities = await Amenity.find(query).sort({ label: 1 }).lean();
    return Response.json({ amenities });
  } catch (err) {
    console.error(err);
    return Response.json({ error: 'Failed to fetch amenities' }, { status: 500 });
  }
}

export async function POST(request) {
  if (!await isAdmin()) return Response.json({ error: 'Forbidden' }, { status: 403 });
  try {
    await connectDB();
    const { label, area, projectId } = await request.json();

    if (!label?.trim() || !projectId) {
      return Response.json({ error: 'Label and projectId are required' }, { status: 400 });
    }

    const amenity = await Amenity.create({ label: label.trim(), area: area || '', projectId });
    return Response.json({ amenity }, { status: 201 });
  } catch (err) {
    console.error(err);
    return Response.json({ error: 'Failed to create amenity' }, { status: 500 });
  }
}