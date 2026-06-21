import { useEffect, useRef, useState } from 'react'
import {
  computeGridSize,
  drawVideoFit,
  frameToAscii,
  PROJECTS_ASCII_CHARS,
  PROJECTS_ASCII_CONFIG,
  PROJECTS_CHAR_VARIANTS,
} from '../utils/asciiConverter'
import projectsVideo from '../../media/projects.mp4'
import './AsciiProjects.css'

export function AsciiProjects() {
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

      const aspectHeight = (window.innerWidth * vh) / vw
      const viewportHeight = Math.max(window.innerHeight * 0.7, aspectHeight)

      const grid = computeGridSize(
        window.innerWidth,
        viewportHeight,
        vw,
        vh,
        PROJECTS_ASCII_CONFIG,
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
        const frameTick = Math.floor(performance.now() / 80)
        output.textContent = frameToAscii(ctx, cols, rows, {
          palette: PROJECTS_ASCII_CHARS,
          variants: PROJECTS_CHAR_VARIANTS,
          frameTick,
          config: PROJECTS_ASCII_CONFIG,
        })
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
    <section className="ascii-projects" aria-label="Projects">
      <video
        ref={videoRef}
        className="ascii-projects__video"
        src={projectsVideo}
        muted
        playsInline
        loop
        autoPlay
        preload="auto"
      />
      <canvas ref={canvasRef} className="ascii-projects__canvas" aria-hidden="true" />

      <div className="ascii-projects__stage">
        <pre
          ref={outputRef}
          className={`ascii-projects__output${ready ? ' ascii-projects__output--ready' : ''}`}
          style={{ fontSize: `${fontSize}px` }}
          aria-hidden="true"
        />
      </div>
    </section>
  )
}
