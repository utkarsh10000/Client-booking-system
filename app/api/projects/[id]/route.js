import { connectDB } from '@/lib/mongoose';
import Project from '@/models/Project';
import Plot from '@/models/Plot';
import Sector from '@/models/Sector';
import Amenity from '@/models/Amenity';
import { cookies } from 'next/headers';

async function isAdmin() {
  const cookieStore = await cookies();
  return cookieStore.get('auth_role')?.value === 'admin';
}

export async function GET(req, { params }) {
  try {
    await connectDB();
    const { id } = await params;
    const project = await Project.findById(id).lean();
    if (!project) return Response.json({ error: 'Project not found' }, { status: 404 });
    return Response.json({ project });
  } catch (err) {
    return Response.json({ error: 'Failed to fetch project' }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  if (!await isAdmin()) return Response.json({ error: 'Forbidden' }, { status: 403 });
  try {
    await connectDB();
    const { id } = await params;
    // Cascade delete all related data
    await Promise.all([
      Project.findByIdAndDelete(id),
      Plot.deleteMany({ projectId: id }),
      Sector.deleteMany({ projectId: id }),
      Amenity.deleteMany({ projectId: id }),
    ]);
    return Response.json({ success: true });
  } catch (err) {
    console.error(err);
    return Response.json({ error: 'Failed to delete project' }, { status: 500 });
  }
}