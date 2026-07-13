import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json({ success: true, message: "Mock Google Account Connected" });
}
