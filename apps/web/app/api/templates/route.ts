import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json([
    {
      id: 'tpl_1',
      name: 'Grateful Thank You',
      category: 'Thank You',
      text: 'Thank you so much for your kind words, {{author}}! We are thrilled that you had such a wonderful experience with us. Your support means the world to our team, and we look forward to welcoming you back soon!',
    },
    {
      id: 'tpl_2',
      name: 'Short & Sweet Thanks',
      category: 'Thank You',
      text: 'Thanks for the great review, {{author}}! We appreciate you choosing us and hope to see you again soon.',
    },
    {
      id: 'tpl_3',
      name: 'Sincere Apology',
      category: 'Apology',
      text: 'Hi {{author}}, we are truly sorry to hear about your experience. This is not the standard we hold ourselves to. We would love the opportunity to make this right — please reach out to us directly at [contact] so we can resolve this for you.',
    },
    {
      id: 'tpl_4',
      name: 'Constructive Apology',
      category: 'Apology',
      text: 'Thank you for sharing your feedback, {{author}}. We take all concerns seriously and have shared your comments with our team. We are actively working to improve in this area and hope you will give us another chance.',
    },
    {
      id: 'tpl_5',
      name: 'Follow-Up Invite',
      category: 'Follow-up',
      text: 'Hi {{author}}, thank you for your review! We noticed there were some areas where we can improve. We would love for you to visit us again — mention this message and we will make sure your next experience exceeds expectations.',
    },
    {
      id: 'tpl_6',
      name: 'Generic Professional',
      category: 'Generic',
      text: 'Thank you for taking the time to leave a review, {{author}}. We value all feedback as it helps us continuously improve our services. We hope to serve you again in the future.',
    },
  ]);
}
