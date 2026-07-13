"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import QRCode from "react-qr-code";
import { Button } from "@/components/ui/button";
import { Copy, ExternalLink, MapPin } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function LocationsPage() {
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    // Get the base URL (e.g. localhost:3000 or production Vercel URL)
    setOrigin(window.location.origin);
  }, []);

  const { data: locations, isLoading } = useQuery({
    queryKey: ['myLocations'],
    queryFn: async () => {
      const res = await apiClient.get('/locations/my-locations');
      return res.data;
    },
  });

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("Copied link to clipboard!");
  };

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Locations & QR Codes</h2>
          <p className="text-muted-foreground mt-2">
            Print these QR codes and place them in your store. Guests scan them to leave reviews!
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : locations?.length === 0 ? (
        <div className="text-center p-12 border rounded-xl bg-muted/20">
          <h3 className="text-xl font-semibold mb-2">No locations found</h3>
          <p className="text-muted-foreground mb-4">You need to sync your locations from Google first.</p>
          <Link href="/dashboard/integrations">
            <Button>Go to Integrations</Button>
          </Link>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mt-4">
          {locations?.map((loc: any) => {
            const guestLink = `${origin}/r/${loc.id}`;
            return (
              <Card key={loc.id} className="flex flex-col items-center p-6 text-center shadow-lg">
                <CardHeader className="w-full pb-2">
                  <CardTitle className="text-xl">{loc.name}</CardTitle>
                  <CardDescription className="flex items-center justify-center space-x-1 mt-1">
                    <MapPin className="h-4 w-4" />
                    <span className="truncate">{loc.address}</span>
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center mt-4">
                  <div className="bg-white p-4 rounded-xl border shadow-sm">
                    {origin && (
                      <QRCode 
                        value={guestLink} 
                        size={200}
                        style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                        viewBox={`0 0 256 256`}
                      />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-4 w-full truncate bg-muted p-2 rounded-md border">
                    {guestLink}
                  </p>
                </CardContent>
                <CardFooter className="flex w-full space-x-2 mt-auto pt-4">
                  <Button variant="outline" className="flex-1" onClick={() => copyToClipboard(guestLink)}>
                    <Copy className="h-4 w-4 mr-2" />
                    Copy Link
                  </Button>
                  <Link href={`/r/${loc.id}`} target="_blank" className="flex-1">
                    <Button className="w-full">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Test Flow
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
