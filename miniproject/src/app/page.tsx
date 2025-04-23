'use client'
import { useEffect, useState } from 'react'
import { AlgorithmsSection } from "../components/algorithms-section";
import { HeroSection } from "../components/hero-section";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { BarChart2, BookOpen, Code2, GitBranch, GitGraph, GraduationCap, List, Zap, BrainCircuit, User } from "lucide-react"
import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/theme.toggle";
import { signIn, signOut, useSession } from "next-auth/react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export default function Home() {
  const [mounted, setMounted] = useState(false)
  const { data: session } = useSession()

  useEffect(() => {
    setMounted(true)
    // Save user data to localStorage when session changes
    if (session?.user) {
      localStorage.setItem('user', JSON.stringify(session.user))
    } else {
      localStorage.removeItem('user')
    }
  }, [session])

  if (!mounted) return null

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="p-2 container flex h-16 items-center">
          <div className="mr-4 flex">
            <Link href="/" className="flex items-center space-x-2">
              <span className="font-bold text-xl bg-gradient-to-r from-orange-500 to-pink-500 text-transparent bg-clip-text">
                EzzAlgo
              </span>
            </Link>
          </div>
          <div className="flex flex-1 items-center justify-end space-x-4">
            <nav className="flex items-center space-x-2">
              <ThemeToggle />
              {session?.user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger>
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={session.user.image || undefined} />
                      <AvatarFallback>
                        {session.user.name?.charAt(0) || session.user.email?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>
                      {session.user.name || session.user.email}
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/profile">Profile</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/settings">Settings</Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={() => signOut()}
                      className="text-red-600 focus:text-red-600 dark:text-red-400 dark:focus:text-red-400"
                    >
                      Log out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button
                  onClick={() => signIn()}
                  variant="outline"
                  className="flex items-center h-[33px] w-[90px] p-0 gap-2 border-2 border-zinc-400 bg-zinc-100 hover:bg-zinc-900 text-gray-800 hover:text-gray-100"
                >
                  <User className="h-5 w-5" />
                  <span className="font-small">Login</span>
                </Button>
              )}
            </nav>
          </div>
        </div>
      </header>
      <main className="flex min-h-screen flex-col items-center justify-center">
        <div className="w-full">
          {/* Hero Section */}
          <HeroSection />
          
          {/* Algorithm Cards */}
          <AlgorithmsSection />
          
          {/* Features Section */}
          <section className="py-16 bg-muted/50">
            <div className="container px-4">
              <h2 className="text-3xl font-bold mb-2 text-center">Why Choose EzzAlgo?</h2>
              <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
                Our platform makes learning algorithms intuitive and engaging through interactive visualizations
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {[
                  {
                    title: "Interactive Learning",
                    description: "Learn by watching algorithms in action with step-by-step visual explanations",
                    icon: <BookOpen className="h-8 w-8 text-orange-500" />,
                  },
                  {
                    title: "Code Analysis",
                    description: "See the code and implementation details alongside visualizations",
                    icon: <Code2 className="h-8 w-8 text-orange-500" />,
                  },
                  {
                    title: "Comprehensive Coverage",
                    description: "From basic sorting to advanced graph algorithms, we cover it all",
                    icon: <GraduationCap className="h-8 w-8 text-orange-500" />,
                  },
                  {
                    title: "Customizable Speed",
                    description: "Control the animation speed to understand at your own pace",
                    icon: <Zap className="h-8 w-8 text-orange-500" />,
                  },
                  {
                    title: "Algorithm Comparison",
                    description: "Compare different algorithms side by side to understand trade-offs",
                    icon: <BarChart2 className="h-8 w-8 text-orange-500" />,
                  },
                  {
                    title: "Knowledge Testing",
                    description: "Test your understanding with interactive quizzes and visual results",
                    icon: <BrainCircuit className="h-8 w-8 text-orange-500" />,
                  },
                ].map((feature, index) => (
                  <Card key={index} className="border-none shadow-sm">
                    <CardContent className="pt-6">
                      <div className="flex flex-col items-center text-center">
                        <div className="mb-4 p-3 rounded-full bg-orange-100 dark:bg-orange-950/30">
                          {feature.icon}
                        </div>
                        <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                        <p className="text-muted-foreground">{feature.description}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </section>
          
          {/* Test Your Knowledge Section */}
          <section className="py-16">
            <div className="container px-4">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold mb-4">Test Your Knowledge</h2>
                <p className="text-muted-foreground max-w-2xl mx-auto">
                  Challenge yourself with our algorithm quizzes and track your progress with beautiful visualizations
                </p>
              </div>
              
              <div className="flex justify-center">
                <Button asChild size="lg" className="bg-gradient-to-r from-purple-500 to-pink-500 hover:opacity-90">
                  <Link href="/test">Take a Test</Link>
                </Button>
              </div>
            </div>
          </section>
          
          {/* CTA Section */}
          <section className="py-20 relative overflow-hidden bg-muted/50">
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-orange-500/10 rounded-full filter blur-3xl" />
            <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-pink-500/10 rounded-full filter blur-3xl" />
            
            <div className="container px-4 relative z-10">
              <div className="max-w-3xl mx-auto text-center">
                <h2 className="text-3xl font-bold mb-4">Ready to Master Algorithms?</h2>
                <p className="text-muted-foreground mb-8">
                  Start exploring our interactive visualizations and take your algorithm understanding to the next level.
                </p>
                <Button asChild size="lg" className="bg-gradient-to-r from-orange-500 to-pink-500 hover:opacity-90">
                  <Link href="#algorithms">Get Started Now</Link>
                </Button>
              </div>
            </div>
          </section>
        </div>
      </main>
    </>
  )
}