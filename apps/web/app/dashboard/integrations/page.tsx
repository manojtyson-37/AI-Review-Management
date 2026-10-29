"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { CheckCircle2, MapPin } from "lucide-react";

interface GoogleLocation {
  googleAccountId: string;
  googleLocationId: string;
  name: string;
  address?: string;
}

function IntegrationsContent() {
  const queryClient = useQueryClient();
  const params = useSearchParams();
  const result = params.get("google");

  const { data: status } = useQuery({
    queryKey: ["googleStatus"],
    queryFn: async () => (await apiClient.get("/integrations/google/status")).data,
  });
  const businessId: string | undefined = status?.businessId;
  const connected = !!status?.connected;

  const connectGoogle = useMutation({
    mutationFn: async () => (await apiClient.get("/integrations/google/connect-url", { params: { businessId } })).data,
    onSuccess: (data) => {
      window.location.href = data.url;
    },
    onError: () => window.alert("Could not start the Google connection."),
  });

  const { data: locations } = useQuery<GoogleLocation[]>({
    queryKey: ["googleLocations", businessId],
    queryFn: async () => (await apiClient.get("/integrations/google/locations", { params: { businessId } })).data.data,
    enabled: connected,
  });

  const selectLocation = useMutation({
    mutationFn: async (location: GoogleLocation) =>
      (await apiClient.post("/integrations/google/locations/sync", { businessId, ...location })).data,
    onSuccess: () => window.alert("Location selected. Use Reviews > Sync to import its reviews."),
  });

  const disconnect = useMutation({
    mutationFn: async () => (await apiClient.post("/integrations/google/disconnect", { businessId })).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["googleStatus"] }),
  });

  const deleteData = useMutation({
    mutationFn: async () => (await apiClient.delete("/integrations/google/data", { params: { businessId } })).data,
    onSuccess: () => window.alert("Synced Google reviews deleted."),
  });

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <h2 className="text-3xl font-bold tracking-tight">Integrations</h2>

      {result === "error" && (
        <p className="text-sm text-red-600">Google connection failed or was cancelled. Please try again.</p>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Google Business Profile</CardTitle>
            <CardDescription>
              Lets ReviewAssist read your Google reviews and post replies that you approve. Nothing is posted
              without your approval. Disconnecting revokes access and deletes the reviews we synced.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {connected ? (
              <div className="flex items-center space-x-2 text-green-600 font-medium">
                <CheckCircle2 className="h-5 w-5" />
                <span>Connected{status?.googleEmail ? ` as ${status.googleEmail}` : ""}</span>
              </div>
            ) : (
              <Button onClick={() => connectGoogle.mutate()} disabled={!businessId || connectGoogle.isPending}>
                {connectGoogle.isPending ? "Redirecting..." : "Connect Google Business Profile"}
              </Button>
            )}
          </CardContent>
          {connected && (
            <CardFooter className="gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  if (window.confirm("Disconnect Google? This revokes access and deletes synced reviews.")) disconnect.mutate();
                }}
                disabled={disconnect.isPending}
              >
                Disconnect
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  if (window.confirm("Delete all synced Google reviews and drafts?")) deleteData.mutate();
                }}
                disabled={deleteData.isPending}
              >
                Delete synced data
              </Button>
            </CardFooter>
          )}
        </Card>
      </div>

      {connected && (
        <div className="mt-8 space-y-4">
          <h3 className="text-xl font-semibold tracking-tight">Choose locations to sync</h3>
          <div className="grid gap-4 md:grid-cols-3">
            {locations?.map((loc) => (
              <Card key={`${loc.googleAccountId}/${loc.googleLocationId}`}>
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
                  <Button variant="outline" className="w-full" onClick={() => selectLocation.mutate(loc)}>
                    Use this location
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

export default function IntegrationsPage() {
  return (
    <Suspense fallback={null}>
      <IntegrationsContent />
    </Suspense>
  );
}
