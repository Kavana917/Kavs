import { useCallback, useRef, useState } from 'react'
import eyeVideo from '../../media/my_eye.mp4'
import { useAsciiVideoLoop } from '../hooks/useAsciiVideoLoop'
import { HeroDistortion } from './HeroDistortion'
import './AsciiHero.css'

export const HERO_OUTPUT_ID = 'ascii-hero-output'

export function AsciiHero() {
  const sectionRef = useRef<HTMLElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const outputRef = useRef<HTMLPreElement>(null)
  const [fontSize, setFontSize] = useState(10)
  const [ready, setReady] = useState(false)

  const onReady = useCallback(() => setReady(true), [])
  const onFontSize = useCallback((size: number) => setFontSize(size), [])

  useAsciiVideoLoop({
    videoRef,
    canvasRef,
    outputRef,
    sectionRef,
    onReady,
    onFontSize,
  })

  return (
    <section ref={sectionRef} className="ascii-hero" aria-label="Hero">
      <video
        ref={videoRef}
        className="ascii-hero__video"
        src={eyeVideo}
        muted
        playsInline
        loop
        autoPlay
        preload="auto"
      />
      <canvas ref={canvasRef} className="ascii-hero__canvas" aria-hidden="true" />

      <div className="ascii-hero__stage">
        <pre
          ref={outputRef}
          id={HERO_OUTPUT_ID}
          className={`ascii-hero__output${ready ? ' ascii-hero__output--ready' : ''}`}
          style={{ fontSize: `${fontSize}px` }}
          aria-hidden="true"
        />
      </div>
      <HeroDistortion outputRef={outputRef} sectionRef={sectionRef} />
    </section>
  )
}
