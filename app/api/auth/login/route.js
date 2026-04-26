import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';


export async function POST(request) {
  const { role, password } = await request.json();

  const adminPass    = process.env.ADMIN_PASSWORD?.trim();
  const employeePass = process.env.EMPLOYEE_PASSWORD?.trim();

  let valid = false;
  if (role === 'admin'    && password === adminPass)    valid = true;
  if (role === 'employee' && password === employeePass) valid = true;

  if (!valid) {
    return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
  }

  const cookieStore = await cookies();
  cookieStore.set('auth_role', role, {
    httpOnly: true,
    path: '/',
    maxAge: 60 * 60 * 8,
    sameSite: 'lax',
  });

  return NextResponse.json({ success: true, role });
}