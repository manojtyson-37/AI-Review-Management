import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const body = await req.json();
  
  // Return the location as if it was saved
  return NextResponse.json({ 
    success: true, 
    data: { 
      ...body, 
      id: "mock_id_" + body.googleLocationId 
    } 
  });
}
