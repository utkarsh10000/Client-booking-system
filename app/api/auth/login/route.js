import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { connectDB } from '@/lib/mongoose';
import Employee from '@/models/Employee';

export async function POST(request) {
  const body = await request.json();
  const { role, password, employeeId } = body;

  const adminPass      = process.env.ADMIN_PASSWORD?.trim();
  const accountantPass = process.env.ACCT_PASSWORD?.trim();

  // Employee: check DB with employeeId + password
  if (role === 'employee') {
    const empId = employeeId?.trim().toUpperCase();
    if (!empId) {
      return NextResponse.json({ error: 'Employee ID is required' }, { status: 400 });
    }
    await connectDB();
    const emp = await Employee.findOne({ employeeId: empId, active: true });
    if (!emp || emp.password !== password) {
      return NextResponse.json({ error: 'Invalid Employee ID or password' }, { status: 401 });
    }
    const cookieStore = await cookies();
    cookieStore.set('auth_role', 'employee', { httpOnly: true, path: '/', maxAge: 60 * 60 * 8, sameSite: 'lax' });
    cookieStore.set('auth_employee_id', emp.employeeId, { httpOnly: true, path: '/', maxAge: 60 * 60 * 8, sameSite: 'lax' });
    cookieStore.set('auth_employee_name', emp.name, { httpOnly: true, path: '/', maxAge: 60 * 60 * 8, sameSite: 'lax' });
    return NextResponse.json({ success: true, role: 'employee' });
  }

  // Admin and Accountant: env variable passwords
  let valid = false;
  if (role === 'admin'      && password === adminPass)      valid = true;
  if (role === 'accountant' && password === accountantPass) valid = true;

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