import { cn } from "@/lib/utils";
import { Button } from "./ui/button";
import Link from "next/link";

interface HeroSectionProps {
  className?: string;
}

export function HeroSection({ className }: HeroSectionProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden py-20 md:py-36 flex flex-col items-center justify-center text-center",
        className
      )}
    >
      {/* Background decoration elements */}
      <div className="absolute top-0 left-0 w-72 h-72 bg-orange-500/10 rounded-full filter blur-3xl opacity-30 -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full filter blur-3xl opacity-30 translate-x-1/2 translate-y-1/2" />
      
      <div className="relative container px-4 z-10">
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
          Visualize{" "}
          <span className="bg-gradient-to-r from-orange-500 via-pink-500 to-purple-500 text-transparent bg-clip-text">
            Algorithms
          </span>{" "}
          With Ease
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
          Explore, learn, and understand data structures and algorithms through 
          interactive visualizations. Perfect for students, educators, and coding enthusiasts.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild size="lg" className="bg-gradient-to-r from-orange-500 to-pink-500 hover:opacity-90">
            <Link href="#algorithms">Explore Algorithms</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/about">Learn More</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}