import { connectDB } from '@/lib/mongoose';
import Employee from '@/models/Employee';
import { cookies } from 'next/headers';

async function isAdmin() {
  const cookieStore = await cookies();
  return cookieStore.get('auth_role')?.value === 'admin';
}

export async function GET(req) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const q = searchParams.get('q') || '';

    const filter = { active: true };
    if (q) {
      filter.$or = [
        { employeeId: { $regex: q, $options: 'i' } },
        { name:       { $regex: q, $options: 'i' } },
      ];
    }

    const employees = await Employee.find(filter).sort({ employeeId: 1 }).lean();
    return Response.json({ employees });
  } catch (err) {
    console.error(err);
    return Response.json({ error: 'Failed to fetch employees' }, { status: 500 });
  }
}

export async function POST(req) {
  if (!await isAdmin()) return Response.json({ error: 'Forbidden' }, { status: 403 });
  try {
    await connectDB();
    const body = await req.json();
    const { employeeId, name, phone } = body;

    if (!employeeId?.trim() || !name?.trim()) {
      return Response.json({ error: 'Employee ID and Name are required' }, { status: 400 });
    }

    const exists = await Employee.findOne({ employeeId: employeeId.trim().toUpperCase() });
    if (exists) {
      return Response.json({ error: 'Employee ID already exists' }, { status: 409 });
    }

    const employee = await Employee.create({
      employeeId: employeeId.trim().toUpperCase(),
      name: name.trim(),
      phone: phone?.trim() || '',
    });
    return Response.json({ employee }, { status: 201 });
  } catch (err) {
    console.error(err);
    return Response.json({ error: 'Failed to add employee' }, { status: 500 });
  }
}