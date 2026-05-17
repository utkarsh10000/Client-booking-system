import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET() {
  const cookieStore = await cookies();
  const role = cookieStore.get('auth_role')?.value || null;
  const employeeId = cookieStore.get('auth_employee_id')?.value || null;
  const employeeName = cookieStore.get('auth_employee_name')?.value || null;
  return NextResponse.json({ role, employeeId, employeeName });
}