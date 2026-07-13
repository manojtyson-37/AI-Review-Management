import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json([
      {
        id: 'google_loc_1',
        name: 'ReviewAssist HQ',
        address: '123 Main St, San Francisco, CA 94105',
      },
      {
        id: 'google_loc_2',
        name: 'ReviewAssist NYC',
        address: '456 Broadway, New York, NY 10013',
      },
      {
        id: 'google_loc_3',
        name: 'ReviewAssist London',
        address: '789 Oxford St, London, UK',
      }
  ]);
}
