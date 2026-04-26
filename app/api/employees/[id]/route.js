import { connectDB } from '@/lib/mongoose';
import Employee from '@/models/Employee';
import { cookies } from 'next/headers';

async function isAdmin() {
  const cookieStore = await cookies();
  return cookieStore.get('auth_role')?.value === 'admin';
}

// GET /api/employees/[id]  → lookup by employeeId string (not mongo _id)
export async function GET(req, { params }) {
  try {
    await connectDB();
    const { id } = await params;
    const employee = await Employee.findOne({
      employeeId: id.toUpperCase(),
      active: true,
    }).lean();

    if (!employee) {
      return Response.json({ error: 'Employee not found' }, { status: 404 });
    }
    return Response.json({ employee });
  } catch (err) {
    console.error(err);
    return Response.json({ error: 'Failed to fetch employee' }, { status: 500 });
  }
}

// PATCH /api/employees/[id]  → update by mongo _id
export async function PATCH(req, { params }) {
  if (!await isAdmin()) return Response.json({ error: 'Forbidden' }, { status: 403 });
  try {
    await connectDB();
    const { id } = await params;
    const body = await req.json();
    const employee = await Employee.findByIdAndUpdate(id, body, { new: true }).lean();
    if (!employee) return Response.json({ error: 'Employee not found' }, { status: 404 });
    return Response.json({ employee });
  } catch (err) {
    console.error(err);
    return Response.json({ error: 'Failed to update employee' }, { status: 500 });
  }
}

// DELETE /api/employees/[id]  → soft-delete by mongo _id
export async function DELETE(req, { params }) {
  if (!await isAdmin()) return Response.json({ error: 'Forbidden' }, { status: 403 });
  try {
    await connectDB();
    const { id } = await params;
    await Employee.findByIdAndUpdate(id, { active: false });
    return Response.json({ success: true });
  } catch (err) {
    console.error(err);
    return Response.json({ error: 'Failed to remove employee' }, { status: 500 });
  }
}