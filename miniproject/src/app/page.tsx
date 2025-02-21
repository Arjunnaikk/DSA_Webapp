'use client'
import { useEffect, useState } from 'react'

import CustomSortComponent from '@/components/Function'
// import { ModeToggle } from '@/components/ModeToggle'
// import MediaPlayer from '@/components/MediaPlayer'
import SpeedControlSlider from '@/components/SpeedControlSlider'
import Funtions from '@/components/Function'

export default function Home() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-2">
    
      


      <Funtions/>

      



    </main>
  )
}