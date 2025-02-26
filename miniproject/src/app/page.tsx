'use client'
import { useEffect, useState } from 'react'

// import { ModeToggle } from '@/components/ModeToggle'
// import MediaPlayer from '@/components/MediaPlayer'
import Funtions from '@/components/Function'


export default function Home() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return (
    <main className="flex min-h-screen flex-col items-center justify-center">
    
      
      {/* <Navbar/> */}

      <Funtions/>

    </main>
  )
}