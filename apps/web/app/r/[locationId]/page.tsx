"use client";

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useParams } from "next/navigation";

export default function GuestFlowPage() {
  const params = useParams();
  const locationId = params?.locationId as string;
  const [step, setStep] = useState(1);
  const [feedback, setFeedback] = useState("");
  const [draft, setDraft] = useState("");

  const generateReview = useMutation({
    mutationFn: async (text: string) => {
      // In production, this would call our AI endpoint
      // const res = await apiClient.post('/reviews/generate', { text, locationId: params.locationId });
      // return res.data.draft;
      
      // Simulating network delay
      await new Promise(r => setTimeout(r, 1500));
      return `I had a fantastic experience here! The service was excellent and ${text}. Highly recommend!`;
    },
    onSuccess: (data) => {
      setDraft(data);
      setStep(3);
    }
  });

  const handleSubmit = () => {
    setStep(2);
    generateReview.mutate(feedback);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(draft);
    // In production, log "COPIED" status to Analytics
    // Redirect to Google Place ID URL
    window.location.href = `https://search.google.com/local/writereview?placeid=${locationId}`;
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-muted/20 p-4">
      <div className="w-full max-w-md bg-card rounded-2xl shadow-xl border overflow-hidden p-6">
        
        {step === 1 && (
          <div className="flex flex-col space-y-4 animate-in fade-in slide-in-from-bottom-4">
            <h2 className="text-2xl font-bold text-center">How was your visit?</h2>
            <p className="text-center text-muted-foreground text-sm">
              Tell us what you loved, and our AI will draft a perfect Google review for you in seconds.
            </p>
            <Textarea
              placeholder="e.g. The coffee was amazing and the staff was so friendly!"
              className="min-h-[120px] text-lg mt-4"
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
            />
            <Button 
              size="lg" 
              className="w-full mt-4 text-lg py-6"
              onClick={handleSubmit}
              disabled={feedback.length < 5}
            >
              Generate My Review
            </Button>
          </div>
        )}

        {step === 2 && (
          <div className="flex flex-col items-center justify-center space-y-6 py-12 animate-in fade-in">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            <h3 className="text-xl font-medium animate-pulse">Crafting your review...</h3>
          </div>
        )}

        {step === 3 && (
          <div className="flex flex-col space-y-4 animate-in fade-in slide-in-from-bottom-4">
            <h2 className="text-2xl font-bold text-center text-primary">Your Review is Ready!</h2>
            <p className="text-center text-muted-foreground text-sm">
              Copy this draft and paste it on our Google page. You can edit it there if you'd like!
            </p>
            <div className="bg-muted p-4 rounded-lg mt-4 border">
              <p className="text-foreground">{draft}</p>
            </div>
            <Button 
              size="lg" 
              className="w-full mt-6 text-lg py-6 bg-blue-600 hover:bg-blue-700"
              onClick={handleCopy}
            >
              Copy & Go to Google
            </Button>
            <Button variant="ghost" onClick={() => setStep(1)}>
              Write a different one
            </Button>
          </div>
        )}

      </div>
    </div>
  );
}
