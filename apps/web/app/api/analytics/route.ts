import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    overview: {
      totalReviews: 147,
      averageRating: 4.6,
      responseRate: 78,
      totalLocations: 2,
      reviewsThisMonth: 23,
      reviewsLastMonth: 19,
      ratingChange: +0.2,
    },
    sentiment: {
      positive: 112,
      neutral: 22,
      negative: 13,
    },
    reviewTrend: [
      { month: 'Jan', reviews: 8, avgRating: 4.2 },
      { month: 'Feb', reviews: 12, avgRating: 4.4 },
      { month: 'Mar', reviews: 10, avgRating: 4.3 },
      { month: 'Apr', reviews: 15, avgRating: 4.5 },
      { month: 'May', reviews: 18, avgRating: 4.6 },
      { month: 'Jun', reviews: 14, avgRating: 4.5 },
      { month: 'Jul', reviews: 20, avgRating: 4.7 },
      { month: 'Aug', reviews: 22, avgRating: 4.6 },
      { month: 'Sep', reviews: 19, avgRating: 4.8 },
      { month: 'Oct', reviews: 23, avgRating: 4.6 },
    ],
    topKeywords: [
      { keyword: 'Friendly Staff', count: 42 },
      { keyword: 'Great Service', count: 38 },
      { keyword: 'Clean', count: 31 },
      { keyword: 'Professional', count: 28 },
      { keyword: 'Quick', count: 24 },
      { keyword: 'Value for Money', count: 19 },
      { keyword: 'Recommend', count: 17 },
      { keyword: 'Comfortable', count: 14 },
    ],
    ratingDistribution: [
      { stars: 5, count: 82 },
      { stars: 4, count: 30 },
      { stars: 3, count: 22 },
      { stars: 2, count: 8 },
      { stars: 1, count: 5 },
    ],
  });
}
