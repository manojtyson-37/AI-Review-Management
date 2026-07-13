import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json([
    {
      id: 'fb_1',
      rating: 2,
      tags: ['Long Wait Time', 'Unprofessional Staff'],
      details: 'Had to wait over an hour despite having an appointment. The receptionist was rude when I asked about the delay.',
      date: '2023-10-13T15:20:00Z',
      locationId: 'google_loc_1',
      locationName: 'ReviewAssist HQ',
      status: 'unread',
    },
    {
      id: 'fb_2',
      rating: 1,
      tags: ['Poor Service', 'Overpriced'],
      details: 'Terrible experience. Charged way too much for a basic service that took forever.',
      date: '2023-10-11T11:45:00Z',
      locationId: 'google_loc_2',
      locationName: 'Downtown Branch',
      status: 'unread',
    },
    {
      id: 'fb_3',
      rating: 3,
      tags: ['Long Wait Time'],
      details: '',
      date: '2023-10-09T09:00:00Z',
      locationId: 'google_loc_1',
      locationName: 'ReviewAssist HQ',
      status: 'read',
    },
    {
      id: 'fb_4',
      rating: 2,
      tags: ['Unclean Environment', 'Other'],
      details: 'The bathroom was dirty and the waiting area chairs were stained.',
      date: '2023-10-05T16:30:00Z',
      locationId: 'google_loc_2',
      locationName: 'Downtown Branch',
      status: 'resolved',
    },
    {
      id: 'fb_5',
      rating: 1,
      tags: ['Poor Service', 'Unprofessional Staff'],
      details: 'Staff seemed completely disinterested. No one acknowledged me for 15 minutes.',
      date: '2023-10-02T13:10:00Z',
      locationId: 'google_loc_1',
      locationName: 'ReviewAssist HQ',
      status: 'read',
    },
  ]);
}
