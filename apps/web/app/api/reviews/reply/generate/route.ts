import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const body = await req.json();
  const { reviewText, rating, author } = body;
  
  // Simulate AI delay
  await new Promise(r => setTimeout(r, 1500));
  
  let draft = `Hi ${author}, thank you so much for your review! `;
  
  if (rating >= 4) {
    draft += `We are thrilled to hear that you had a great experience with us. Your feedback means a lot to our team and we can't wait to welcome you back again soon.`;
  } else {
    draft += `We are sorry to hear that your experience did not meet expectations. We would love the opportunity to make this right. Please reach out to us directly so we can discuss this further.`;
  }

  return NextResponse.json({ draft });
}
