import { useEffect, useRef, useState } from 'react'
import {
  computeGridSize,
  drawVideoFit,
  frameToAscii,
} from '../utils/asciiConverter'
import eyeVideo from '../../media/my_eye.mp4'
import { HeroDistortion } from './HeroDistortion'
import './AsciiHero.css'

export const HERO_OUTPUT_ID = 'ascii-hero-output'

export function AsciiHero() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const outputRef = useRef<HTMLPreElement>(null)
  const frameRef = useRef<number>(0)
  const [fontSize, setFontSize] = useState(10)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const video = videoRef.current
    const canvas = canvasRef.current
    const output = outputRef.current
    if (!video || !canvas || !output) return

    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    if (!ctx) return

    let cols = 0
    let rows = 0

    const resize = () => {
      const vw = video.videoWidth
      const vh = video.videoHeight
      if (!vw || !vh) return

      const grid = computeGridSize(
        window.innerWidth,
        window.innerHeight,
        vw,
        vh,
      )
      cols = grid.cols
      rows = grid.rows
      setFontSize(grid.fontSize)
      canvas.width = grid.cols * grid.sampleScale
      canvas.height = grid.canvasHeight * grid.sampleScale
    }

    const render = () => {
      if (video.readyState >= 2 && cols > 0 && rows > 0) {
        drawVideoFit(ctx, video, canvas.width, canvas.height)
        output.textContent = frameToAscii(ctx, cols, rows)
      }
      frameRef.current = requestAnimationFrame(render)
    }

    const start = () => {
      resize()
      setReady(true)
      video.play().catch(() => {})
      frameRef.current = requestAnimationFrame(render)
    }

    const onMetadata = () => {
      resize()
      if (video.readyState >= 2) start()
    }

    const onCanPlay = () => start()

    video.addEventListener('loadedmetadata', onMetadata)
    video.addEventListener('canplay', onCanPlay)
    window.addEventListener('resize', resize)

    if (video.readyState >= 1) onMetadata()

    return () => {
      cancelAnimationFrame(frameRef.current)
      video.removeEventListener('loadedmetadata', onMetadata)
      video.removeEventListener('canplay', onCanPlay)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return (
    <section className="ascii-hero" aria-label="Hero">
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
      <HeroDistortion outputRef={outputRef} />
    </section>
  )
}
