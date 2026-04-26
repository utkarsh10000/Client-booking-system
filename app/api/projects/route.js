import { connectDB } from '@/lib/mongoose';
import Project from '@/models/Project';
import Plot from '@/models/Plot';
import { cookies } from 'next/headers';

async function isAdmin() {
  const cookieStore = await cookies();
  return cookieStore.get('auth_role')?.value === 'admin';
}

function slugify(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export async function GET() {
  try {
    await connectDB();
    const projects = await Project.find().sort({ createdAt: -1 }).lean();

    // Attach plot stats to each project
    const projectIds = projects.map(p => p._id);
    const plots = await Plot.find({ projectId: { $in: projectIds } }, 'projectId status').lean();

    const statsMap = {};
    for (const plot of plots) {
      const id = plot.projectId.toString();
      if (!statsMap[id]) statsMap[id] = { total: 0, available: 0, hold: 0, sold: 0 };
      statsMap[id].total++;
      if (plot.status === 'available') statsMap[id].available++;
      else if (plot.status === 'hold')  statsMap[id].hold++;
      else if (plot.status === 'sold')  statsMap[id].sold++;
    }

    const enriched = projects.map(p => ({
      ...p,
      stats: statsMap[p._id.toString()] || { total: 0, available: 0, hold: 0, sold: 0 },
    }));

    return Response.json({ projects: enriched });
  } catch (err) {
    console.error(err);
    return Response.json({ error: 'Failed to fetch projects' }, { status: 500 });
  }
}

export async function POST(req) {
  if (!await isAdmin()) return Response.json({ error: 'Forbidden' }, { status: 403 });
  try {
    await connectDB();
    const { name, location } = await req.json();
    if (!name?.trim() || !location?.trim()) {
      return Response.json({ error: 'Name and location are required' }, { status: 400 });
    }

    // Generate unique slug
    let slug = slugify(name);
    const existing = await Project.findOne({ slug });
    if (existing) slug = `${slug}-${Date.now()}`;

    const project = await Project.create({ name: name.trim(), location: location.trim(), slug });
    return Response.json({ project }, { status: 201 });
  } catch (err) {
    console.error(err);
    return Response.json({ error: 'Failed to create project' }, { status: 500 });
  }
}