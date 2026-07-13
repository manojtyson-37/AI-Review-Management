"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useParams } from "next/navigation";
import { Star, CheckCircle2 } from "lucide-react";

const TAGS = [
  "Excellent Service", 
  "Friendly Staff", 
  "Great Value", 
  "Clean Environment", 
  "Quick Turnaround",
  "Professional",
  "Highly Recommend"
];

export default function GuestFlowPage() {
  const params = useParams();
  const locationId = params?.locationId as string;
  
  const [step, setStep] = useState(1);
  const [rating, setRating] = useState(0);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [extraDetails, setExtraDetails] = useState("");
  const [draft, setDraft] = useState("");

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const generateReview = useMutation({
    mutationFn: async () => {
      // Simulating AI generation based on answers
      await new Promise(r => setTimeout(r, 1500));
      
      let base = `I had a fantastic experience! `;
      if (selectedTags.length > 0) {
        base += `The ${selectedTags.map(t => t.toLowerCase()).join(' and ')} really stood out to me. `;
      }
      if (extraDetails.length > 0) {
        base += `${extraDetails}. `;
      }
      base += `Highly recommend this place!`;
      return base;
    },
    onSuccess: (data) => {
      setDraft(data);
      setStep(4);
    }
  });

  const handleCopy = () => {
    navigator.clipboard.writeText(draft);
    if (locationId === 'google_loc_2') {
      window.location.href = "https://www.google.com/search?q=Sridatri+physio+care&oq=srid&gs_lcrp=EgZjaHJvbWUqCAgCEEUYJxg7MgYIABBFGDwyCggBEC4YsQMYgAQyCAgCEEUYJxg7MgYIAxBFGDkyBggEEEUYPDIGCAUQRRg8MgYIBhBFGDwyBggHEEUYPNIBCDE5NjBqMGo3qAIAsAIA&sourceid=chrome&source=chrome.ob&ie=UTF-8&zx=1783979428166#lrd=0x3bcb99cef1978d0b:0xb4f762158a9d4a4c,1,,,,";
    } else {
      window.location.href = `https://search.google.com/local/writereview?placeid=${locationId}`;
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-muted/20 p-4">
      <div className="w-full max-w-md bg-card rounded-2xl shadow-xl border overflow-hidden p-8">
        
        {/* Progress Bar */}
        {step < 4 && (
          <div className="w-full bg-muted rounded-full h-2 mb-8">
            <div 
              className="bg-primary h-2 rounded-full transition-all duration-300" 
              style={{ width: `${(step / 3) * 100}%` }}
            />
          </div>
        )}

        {/* Step 1: Star Rating */}
        {step === 1 && (
          <div className="flex flex-col space-y-6 animate-in fade-in slide-in-from-bottom-4">
            <h2 className="text-2xl font-bold text-center">How was your visit?</h2>
            <p className="text-center text-muted-foreground text-sm">
              Please rate your experience with us.
            </p>
            <div className="flex justify-center space-x-2 py-4">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`w-12 h-12 cursor-pointer transition-colors ${
                    rating >= star ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground hover:text-yellow-200"
                  }`}
                  onClick={() => {
                    setRating(star);
                    setTimeout(() => setStep(2), 400); // Auto-advance after short delay
                  }}
                />
              ))}
            </div>
            <Button 
              size="lg" 
              className="w-full"
              onClick={() => setStep(2)}
              disabled={rating === 0}
            >
              Next
            </Button>
          </div>
        )}

        {/* Step 2: Tags */}
        {step === 2 && (
          <div className="flex flex-col space-y-6 animate-in fade-in slide-in-from-bottom-4">
            <h2 className="text-2xl font-bold text-center">What did you like?</h2>
            <p className="text-center text-muted-foreground text-sm">
              Select all that apply. This helps our AI write a great review!
            </p>
            <div className="flex flex-wrap gap-2 justify-center py-2">
              {TAGS.map(tag => (
                <div
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className={`px-4 py-2 rounded-full border cursor-pointer text-sm font-medium transition-colors ${
                    selectedTags.includes(tag) 
                      ? "bg-primary text-primary-foreground border-primary" 
                      : "bg-background text-foreground hover:bg-muted"
                  }`}
                >
                  {tag}
                </div>
              ))}
            </div>
            <div className="flex space-x-3 pt-4">
              <Button variant="outline" className="flex-1" onClick={() => setStep(1)}>Back</Button>
              <Button className="flex-1" onClick={() => setStep(3)}>Next</Button>
            </div>
          </div>
        )}

        {/* Step 3: Extra Details */}
        {step === 3 && (
          <div className="flex flex-col space-y-6 animate-in fade-in slide-in-from-bottom-4">
            <h2 className="text-2xl font-bold text-center">Any specific highlights?</h2>
            <p className="text-center text-muted-foreground text-sm">
              Optional: Mention a staff member's name or a specific detail you loved.
            </p>
            <Textarea
              placeholder="e.g. John was super helpful!"
              className="min-h-[120px] text-lg"
              value={extraDetails}
              onChange={(e) => setExtraDetails(e.target.value)}
            />
            <div className="flex space-x-3 pt-4">
              <Button variant="outline" className="flex-1" onClick={() => setStep(2)}>Back</Button>
              <Button 
                className="flex-1" 
                onClick={() => {
                  setStep(99); // Loading step
                  generateReview.mutate();
                }}
              >
                Generate Review
              </Button>
            </div>
          </div>
        )}

        {/* Loading Step */}
        {step === 99 && (
          <div className="flex flex-col items-center justify-center space-y-6 py-12 animate-in fade-in">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            <h3 className="text-xl font-medium animate-pulse">Crafting your review...</h3>
          </div>
        )}

        {/* Step 4: Final Draft */}
        {step === 4 && (
          <div className="flex flex-col space-y-4 animate-in fade-in slide-in-from-bottom-4">
            <div className="flex justify-center mb-2">
              <CheckCircle2 className="w-16 h-16 text-green-500" />
            </div>
            <h2 className="text-2xl font-bold text-center text-primary">Your Review is Ready!</h2>
            <p className="text-center text-muted-foreground text-sm">
              Copy this draft and paste it on our Google page. You can edit it there if you'd like!
            </p>
            <div className="bg-muted p-4 rounded-lg mt-4 border shadow-inner">
              <p className="text-foreground text-lg leading-relaxed">{draft}</p>
            </div>
            <Button 
              size="lg" 
              className="w-full mt-6 text-lg py-6 bg-blue-600 hover:bg-blue-700 shadow-md transition-transform hover:scale-[1.02]"
              onClick={handleCopy}
            >
              Copy & Go to Google
            </Button>
            <Button variant="ghost" className="mt-2" onClick={() => {
              setStep(1);
              setRating(0);
              setSelectedTags([]);
              setExtraDetails("");
            }}>
              Start Over
            </Button>
          </div>
        )}

      </div>
    </div>
  );
}
