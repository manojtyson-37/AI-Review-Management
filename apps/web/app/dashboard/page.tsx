"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell,
} from 'recharts';
import { Star, TrendingUp, TrendingDown, MessageSquare, MapPin, BarChart3, ShieldAlert } from "lucide-react";

const SENTIMENT_COLORS = ['#22c55e', '#eab308', '#ef4444'];

export default function DashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['analytics'],
    queryFn: async () => {
      const res = await apiClient.get('/analytics');
      return res.data;
    }
  });

  if (isLoading || !data) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  const { overview, sentiment, reviewTrend, topKeywords, ratingDistribution } = data;

  const sentimentData = [
    { name: 'Positive', value: sentiment.positive },
    { name: 'Neutral', value: sentiment.neutral },
    { name: 'Negative', value: sentiment.negative },
  ];

  const ratingChangePositive = overview.ratingChange >= 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground mt-1">Your reputation at a glance.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-bl-full" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Reviews</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{overview.totalReviews}</div>
            <div className="flex items-center gap-1 mt-1">
              <TrendingUp className="h-3 w-3 text-green-500" />
              <p className="text-xs text-green-500 font-medium">
                +{overview.reviewsThisMonth - overview.reviewsLastMonth} this month
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-yellow-500/5 rounded-bl-full" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
            <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{overview.averageRating}</div>
            <div className="flex items-center gap-1 mt-1">
              {ratingChangePositive ? (
                <TrendingUp className="h-3 w-3 text-green-500" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-500" />
              )}
              <p className={`text-xs font-medium ${ratingChangePositive ? 'text-green-500' : 'text-red-500'}`}>
                {ratingChangePositive ? '+' : ''}{overview.ratingChange} vs last month
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-bl-full" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Response Rate</CardTitle>
            <BarChart3 className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{overview.responseRate}%</div>
            <div className="w-full bg-muted rounded-full h-2 mt-2">
              <div className="bg-blue-500 h-2 rounded-full transition-all" style={{ width: `${overview.responseRate}%` }} />
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-bl-full" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Locations</CardTitle>
            <MapPin className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{overview.totalLocations}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {overview.reviewsThisMonth} reviews this month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid gap-6 lg:grid-cols-7">
        {/* Review Trend Line Chart */}
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>Review Trend</CardTitle>
            <CardDescription>Monthly review volume and average rating over time.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={reviewTrend}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis yAxisId="left" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis yAxisId="right" orientation="right" domain={[3.5, 5]} stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                  />
                  <Bar yAxisId="left" dataKey="reviews" fill="hsl(var(--primary) / 0.3)" radius={[4, 4, 0, 0]} />
                  <Line yAxisId="right" type="monotone" dataKey="avgRating" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Sentiment Pie Chart */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Sentiment Breakdown</CardTitle>
            <CardDescription>Distribution of review sentiment.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[220px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={sentimentData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {sentimentData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={SENTIMENT_COLORS[index]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-6 mt-2">
              {sentimentData.map((entry, i) => (
                <div key={entry.name} className="flex items-center gap-2 text-sm">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: SENTIMENT_COLORS[i] }} />
                  <span className="text-muted-foreground">{entry.name}</span>
                  <span className="font-semibold">{entry.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Rating Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Rating Distribution</CardTitle>
            <CardDescription>Breakdown of reviews by star rating.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {ratingDistribution.map((item: { stars: number; count: number }) => {
              const percentage = Math.round((item.count / overview.totalReviews) * 100);
              return (
                <div key={item.stars} className="flex items-center gap-3">
                  <div className="flex items-center gap-1 w-12 text-sm font-medium">
                    {item.stars} <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                  </div>
                  <div className="flex-1 bg-muted rounded-full h-3 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${percentage}%`,
                        backgroundColor: item.stars >= 4 ? '#22c55e' : item.stars === 3 ? '#eab308' : '#ef4444'
                      }}
                    />
                  </div>
                  <div className="w-16 text-right text-sm text-muted-foreground">
                    {item.count} ({percentage}%)
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Top Keywords */}
        <Card>
          <CardHeader>
            <CardTitle>Top Keywords</CardTitle>
            <CardDescription>Most frequently mentioned words in reviews.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {topKeywords.map((kw: { keyword: string; count: number }, i: number) => {
                const maxCount = topKeywords[0].count;
                const opacity = 0.4 + (kw.count / maxCount) * 0.6;
                const size = 0.75 + (kw.count / maxCount) * 0.5;
                return (
                  <div
                    key={kw.keyword}
                    className="px-4 py-2 rounded-full border bg-primary/10 text-primary font-medium transition-transform hover:scale-105 cursor-default"
                    style={{
                      opacity,
                      fontSize: `${size}rem`,
                    }}
                  >
                    {kw.keyword}
                    <span className="ml-2 text-xs opacity-70">({kw.count})</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
