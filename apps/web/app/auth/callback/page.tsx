"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Cookies from "js-cookie";

function AuthCallback() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const token = searchParams.get("token");
    if (token) {
      Cookies.set("auth_token", token, { expires: 7 }); // expires in 7 days
      router.replace("/dashboard");
    } else {
      router.replace("/login");
    }
  }, [router, searchParams]);

  return (
    <div className="flex h-screen w-full items-center justify-center">
      <div className="animate-pulse flex flex-col items-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="mt-4 text-sm text-muted-foreground">Authenticating...</p>
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AuthCallback />
    </Suspense>
  );
}
