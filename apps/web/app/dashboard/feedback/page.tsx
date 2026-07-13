"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Star, ShieldAlert, Eye, CheckCircle, Clock, MapPin, Filter } from "lucide-react";
import { useState } from "react";

interface Feedback {
  id: string;
  rating: number;
  tags: string[];
  details: string;
  date: string;
  locationId: string;
  locationName: string;
  status: 'unread' | 'read' | 'resolved';
}

export default function FeedbackPage() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<'all' | 'unread' | 'read' | 'resolved'>('all');

  const { data: feedbackList, isLoading } = useQuery<Feedback[]>({
    queryKey: ['feedback'],
    queryFn: async () => {
      const res = await apiClient.get('/feedback');
      return res.data;
    }
  });

  const markAs = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      // Mock — in production this would call the API
      await new Promise(r => setTimeout(r, 300));
      return { id, status };
    },
    onSuccess: (result) => {
      queryClient.setQueryData(['feedback'], (old: Feedback[] | undefined) => {
        if (!old) return old;
        return old.map(f => f.id === result.id ? { ...f, status: result.status as Feedback['status'] } : f);
      });
    }
  });

  const filteredFeedback = feedbackList?.filter(f => filter === 'all' || f.status === filter) || [];
  const unreadCount = feedbackList?.filter(f => f.status === 'unread').length || 0;

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <ShieldAlert className="h-8 w-8 text-orange-500" />
            Private Feedback
          </h2>
          <p className="text-muted-foreground mt-1">
            Negative feedback captured before it reached Google. {unreadCount > 0 && (
              <span className="text-orange-500 font-semibold">{unreadCount} unread</span>
            )}
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
          {(['all', 'unread', 'read', 'resolved'] as const).map(f => (
            <Button
              key={f}
              variant={filter === f ? "default" : "ghost"}
              size="sm"
              onClick={() => setFilter(f)}
              className="capitalize"
            >
              {f}
              {f === 'unread' && unreadCount > 0 && (
                <span className="ml-1.5 bg-orange-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid gap-4">
        {filteredFeedback.map(fb => (
          <Card key={fb.id} className={`overflow-hidden transition-all ${fb.status === 'unread' ? 'border-l-4 border-l-orange-500 bg-orange-50/5' : ''}`}>
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 space-y-3">
                  {/* Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map(star => (
                          <Star
                            key={star}
                            className={`w-4 h-4 ${star <= fb.rating ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`}
                          />
                        ))}
                      </div>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        fb.status === 'unread' ? 'bg-orange-100 text-orange-700' :
                        fb.status === 'read' ? 'bg-blue-100 text-blue-700' :
                        'bg-green-100 text-green-700'
                      }`}>
                        {fb.status === 'unread' && <Clock className="inline w-3 h-3 mr-1" />}
                        {fb.status === 'read' && <Eye className="inline w-3 h-3 mr-1" />}
                        {fb.status === 'resolved' && <CheckCircle className="inline w-3 h-3 mr-1" />}
                        {fb.status}
                      </span>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {new Date(fb.date).toLocaleDateString()}
                    </span>
                  </div>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-2">
                    {fb.tags.map(tag => (
                      <span key={tag} className="px-3 py-1 bg-red-50 text-red-700 border border-red-200 rounded-full text-xs font-medium">
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* Details */}
                  {fb.details && (
                    <p className="text-foreground leading-relaxed">{fb.details}</p>
                  )}

                  {/* Location */}
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <MapPin className="h-3 w-3" />
                    {fb.locationName}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex md:flex-col gap-2 md:justify-start">
                  {fb.status === 'unread' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => markAs.mutate({ id: fb.id, status: 'read' })}
                      className="gap-1"
                    >
                      <Eye className="w-3 h-3" /> Mark Read
                    </Button>
                  )}
                  {fb.status !== 'resolved' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => markAs.mutate({ id: fb.id, status: 'resolved' })}
                      className="gap-1 text-green-600 hover:text-green-700"
                    >
                      <CheckCircle className="w-3 h-3" /> Resolve
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {filteredFeedback.length === 0 && (
          <div className="text-center py-12 bg-muted/20 rounded-xl border border-dashed">
            <ShieldAlert className="mx-auto h-12 w-12 text-muted-foreground mb-4 opacity-50" />
            <h3 className="text-lg font-medium">No feedback found</h3>
            <p className="text-muted-foreground">
              {filter === 'all' ? 'No private feedback has been captured yet.' : `No ${filter} feedback.`}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
