import React from 'react'
import { HeroSection } from '../components/HeroSection'
import { FeaturedSection } from '../components/FeaturedSection'
import { TrailerSection } from '../components/TrailerSection'

export function Home(){

  return(
    <>
      <HeroSection />
      <FeaturedSection />
      <TrailerSection />
    </>
  )
}