"use client";

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { CheckCircle2, MapPin } from "lucide-react";

export default function IntegrationsPage() {
  const [isConnected, setIsConnected] = useState(false);

  const connectGoogle = useMutation({
    mutationFn: async () => {
      const res = await apiClient.post('/integrations/google/connect');
      return res.data;
    },
    onSuccess: () => {
      setIsConnected(true);
    }
  });

  const { data: locationsResponse, refetch } = useQuery({
    queryKey: ['googleLocations'],
    queryFn: async () => {
      const res = await apiClient.get('/integrations/google/locations');
      return res.data;
    },
    enabled: isConnected, // Only fetch if connected
  });

  const syncLocation = useMutation({
    mutationFn: async (location: any) => {
      const res = await apiClient.post('/integrations/google/locations/sync', location);
      return res.data;
    },
    onSuccess: () => {
      alert("Location Synced Successfully!");
    }
  });

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Integrations</h2>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Google Business Profile</CardTitle>
            <CardDescription>
              Connect your Google account to import locations and manage reviews automatically.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isConnected ? (
              <div className="flex items-center space-x-2 text-green-600 font-medium">
                <CheckCircle2 className="h-5 w-5" />
                <span>Connected</span>
              </div>
            ) : (
              <Button 
                onClick={() => connectGoogle.mutate()}
                disabled={connectGoogle.isPending}
              >
                {connectGoogle.isPending ? 'Connecting...' : 'Connect Google Account'}
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      {isConnected && (
        <div className="mt-8 space-y-4">
          <h3 className="text-xl font-semibold tracking-tight">Your Locations</h3>
          <div className="grid gap-4 md:grid-cols-3">
            {locationsResponse?.data?.map((loc: any) => (
              <Card key={loc.googleLocationId}>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center space-x-2">
                    <MapPin className="h-5 w-5 text-primary" />
                    <span>{loc.name}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{loc.address}</p>
                </CardContent>
                <CardFooter>
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => syncLocation.mutate(loc)}
                  >
                    Sync to ReviewAssist
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
