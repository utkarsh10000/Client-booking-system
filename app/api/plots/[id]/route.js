import { connectDB } from '@/lib/mongoose';
import Plot from '@/models/Plot';
import { cookies } from 'next/headers';

async function isAdmin() {
  const cookieStore = await cookies();
  return cookieStore.get('auth_role')?.value === 'admin';
}

export async function GET(request, { params }) {
  try {
    await connectDB();
    const { id } = await params;
    const plot = await Plot.findById(id).lean();
    if (!plot) return Response.json({ error: 'Plot not found' }, { status: 404 });

    // Auto-release if hold has expired
    if (plot.status === 'hold' && plot.holdUntil && new Date() > new Date(plot.holdUntil)) {
      const released = await Plot.findByIdAndUpdate(
        id,
        { $set: { status: 'available', heldByName: '', heldById: '', holdUntil: null } },
        { new: true }
      ).lean();
      return Response.json({ plot: released });
    }

    return Response.json({ plot });
  } catch (err) {
    return Response.json({ error: 'Failed to fetch plot' }, { status: 500 });
  }
}

export async function PATCH(request, { params }) {
  try {
    await connectDB();
    const { id } = await params;
    const body = await request.json();

    const allowed = ['status', 'pricePerSqYard', 'facing', 'corner', 'notes', 'plotNo', 'area', 'dimensions', 'heldByName', 'heldById', 'holdUntil'];
    const updates = {};
    for (const key of allowed) {
      if (key in body) updates[key] = body[key];
    }

    // If setting to hold, set holdUntil to 48 hours from now
    if (body.status === 'hold') {
      updates.holdUntil = new Date(Date.now() + 48 * 60 * 60 * 1000);
    }

    // If releasing from hold (setting to available/sold), clear hold fields
    if (body.status === 'available' || body.status === 'sold' || body.status === 'booked') {
      updates.heldByName = '';
      updates.heldById   = '';
      updates.holdUntil  = null;
    }

    const plot = await Plot.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true, runValidators: true }
    ).lean();

    if (!plot) return Response.json({ error: 'Plot not found' }, { status: 404 });
    return Response.json({ plot });
  } catch (err) {
    console.error(err);
    return Response.json({ error: 'Failed to update plot' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  if (!await isAdmin()) return Response.json({ error: 'Forbidden' }, { status: 403 });
  try {
    await connectDB();
    const { id } = await params;
    await Plot.findByIdAndDelete(id);
    return Response.json({ success: true });
  } catch (err) {
    return Response.json({ error: 'Failed to delete plot' }, { status: 500 });
  }
}