import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-2 bg-background text-foreground">
      <main className="flex flex-col items-center justify-center w-full flex-1 px-20 text-center">
        <h1 className="text-6xl font-bold">
          Welcome to <span className="text-primary">ReviewAssist AI</span>
        </h1>
        <p className="mt-3 text-2xl">
          Turn Happy Customers into Authentic Google Reviews.
        </p>
        <div className="flex flex-wrap items-center justify-around max-w-4xl mt-6 sm:w-full">
          <Link href="/dashboard" passHref>
            <Button size="lg" className="mt-8 text-xl px-8 py-6 rounded-full">
              Go to Dashboard
            </Button>
          </Link>
        </div>
      </main>
    </div>
  );
}
