import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const body = await req.json();
  
  // Simulate network request to Google Business Profile API
  await new Promise(r => setTimeout(r, 1000));

  return NextResponse.json({ success: true, message: "Reply posted successfully" });
}
