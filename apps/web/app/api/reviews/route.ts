import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json([
    {
      id: 'rev_1',
      author: 'Jane Doe',
      rating: 5,
      text: 'Absolutely amazing experience. The staff was super friendly and the service was top notch! Highly recommend.',
      date: '2023-10-12T10:00:00Z',
      reply: null,
      locationId: 'google_loc_1',
    },
    {
      id: 'rev_2',
      author: 'John Smith',
      rating: 4,
      text: 'Great place, but the parking was a bit difficult to find.',
      date: '2023-10-10T14:30:00Z',
      reply: 'Hi John, thanks for the review! We are looking into adding clearer signs for our parking area.',
      locationId: 'google_loc_1',
    },
    {
      id: 'rev_3',
      author: 'Alice Johnson',
      rating: 5,
      text: 'I loved the quick turnaround time. Will definitely be coming back!',
      date: '2023-10-08T09:15:00Z',
      reply: null,
      locationId: 'google_loc_2',
    }
  ]);
}
