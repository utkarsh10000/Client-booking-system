import { connectDB } from '@/lib/mongoose';
import Amenity from '@/models/Amenity';
import { cookies } from 'next/headers';

async function isAdmin() {
  const cookieStore = await cookies();
  return cookieStore.get('auth_role')?.value === 'admin';
}

export async function DELETE(request, { params }) {
  if (!await isAdmin()) return Response.json({ error: 'Forbidden' }, { status: 403 });
  await connectDB();
  await Amenity.findByIdAndDelete(params.id);
  return Response.json({ success: true });
}