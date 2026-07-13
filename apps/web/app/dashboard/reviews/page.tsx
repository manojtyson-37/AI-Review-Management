"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Star, MessageSquareReply, Bot, Check, Send } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";

interface Review {
  id: string;
  author: string;
  rating: number;
  text: string;
  date: string;
  reply: string | null;
  locationId: string;
}

export default function ReviewsPage() {
  const queryClient = useQueryClient();
  const [activeReplyId, setActiveReplyId] = useState<string | null>(null);
  const [draftReply, setDraftReply] = useState<string>("");

  const { data: reviews, isLoading } = useQuery<Review[]>({
    queryKey: ['reviews'],
    queryFn: async () => {
      const res = await apiClient.get('/reviews');
      return res.data;
    }
  });

  const generateReply = useMutation({
    mutationFn: async (review: Review) => {
      const res = await apiClient.post('/reviews/reply/generate', {
        reviewText: review.text,
        rating: review.rating,
        author: review.author,
      });
      return res.data.draft;
    },
    onSuccess: (draft, variables) => {
      setDraftReply(draft);
      setActiveReplyId(variables.id);
    },
    onError: () => {
      window.alert("Failed to generate AI reply.");
    }
  });

  const sendReply = useMutation({
    mutationFn: async ({ reviewId, reply }: { reviewId: string, reply: string }) => {
      const res = await apiClient.post('/reviews/reply/send', { reviewId, reply });
      return res.data;
    },
    onSuccess: (_, variables) => {
      window.alert("Reply posted to Google successfully!");
      setActiveReplyId(null);
      
      // Optimistically update the UI
      queryClient.setQueryData(['reviews'], (old: Review[] | undefined) => {
        if (!old) return old;
        return old.map(r => r.id === variables.reviewId ? { ...r, reply: variables.reply } : r);
      });
    },
    onError: () => {
      window.alert("Failed to post reply to Google.");
    }
  });

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Google Reviews</h2>
        <p className="text-muted-foreground mt-2">
          Manage your customer reviews and reply instantly using AI.
        </p>
      </div>

      <div className="grid gap-6">
        {reviews?.map((review) => (
          <Card key={review.id} className="overflow-hidden">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-6">
                
                {/* Review Details */}
                <div className="flex-1 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="font-semibold text-lg">{review.author}</div>
                      <span className="text-sm text-muted-foreground">
                        • {new Date(review.date).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-4 h-4 ${star <= review.rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"}`}
                        />
                      ))}
                    </div>
                  </div>
                  
                  <p className="text-foreground leading-relaxed">{review.text}</p>
                  
                  {/* Existing Reply */}
                  {review.reply && (
                    <div className="mt-4 bg-muted/50 p-4 rounded-lg border border-l-4 border-l-primary">
                      <div className="flex items-center gap-2 mb-2">
                        <Check className="w-4 h-4 text-primary" />
                        <span className="font-semibold text-sm">Replied by Owner</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{review.reply}</p>
                    </div>
                  )}

                  {/* Actions */}
                  {!review.reply && activeReplyId !== review.id && (
                    <div className="pt-2">
                      <Button 
                        onClick={() => generateReply.mutate(review)}
                        disabled={generateReply.isPending}
                        className="gap-2"
                      >
                        {generateReply.isPending && generateReply.variables?.id === review.id ? (
                          <div className="w-4 h-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                        ) : (
                          <Bot className="w-4 h-4" />
                        )}
                        Draft AI Reply
                      </Button>
                    </div>
                  )}
                </div>

                {/* Active Reply Editor */}
                {activeReplyId === review.id && (
                  <div className="flex-1 bg-muted/30 p-4 rounded-lg border space-y-4 animate-in fade-in zoom-in-95">
                    <div className="flex items-center gap-2">
                      <Bot className="w-5 h-5 text-primary" />
                      <span className="font-semibold">AI Drafted Reply</span>
                    </div>
                    
                    <Textarea 
                      value={draftReply}
                      onChange={(e) => setDraftReply(e.target.value)}
                      className="min-h-[120px] bg-background resize-none"
                    />
                    
                    <div className="flex justify-end gap-2">
                      <Button 
                        variant="ghost" 
                        onClick={() => setActiveReplyId(null)}
                      >
                        Cancel
                      </Button>
                      <Button 
                        className="gap-2"
                        disabled={sendReply.isPending}
                        onClick={() => sendReply.mutate({ reviewId: review.id, reply: draftReply })}
                      >
                        {sendReply.isPending ? (
                          <div className="w-4 h-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                        ) : (
                          <Send className="w-4 h-4" />
                        )}
                        Post to Google
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}

        {reviews?.length === 0 && (
          <div className="text-center py-12 bg-muted/20 rounded-xl border border-dashed">
            <MessageSquareReply className="mx-auto h-12 w-12 text-muted-foreground mb-4 opacity-50" />
            <h3 className="text-lg font-medium text-foreground">No reviews yet</h3>
            <p className="text-muted-foreground">When customers leave Google reviews, they'll appear here.</p>
          </div>
        )}
      </div>
    </div>
  );
}
