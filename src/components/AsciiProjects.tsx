import { useCallback, useRef, useState } from 'react'
import {
  PROJECTS_ASCII_CHARS,
  PROJECTS_ASCII_CONFIG,
  PROJECTS_CHAR_VARIANTS,
} from '../utils/asciiConverter'
import projectsVideo from '../../media/projects.mp4'
import { useAsciiVideoLoop } from '../hooks/useAsciiVideoLoop'
import { ProjectCarousel } from './ProjectCarousel'
import './AsciiProjects.css'

export function AsciiProjects() {
  const sectionRef = useRef<HTMLElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const outputRef = useRef<HTMLPreElement>(null)
  const [fontSize, setFontSize] = useState(10)
  const [ready, setReady] = useState(false)

  const onReady = useCallback(() => setReady(true), [])
  const onFontSize = useCallback((size: number) => setFontSize(size), [])
  const getViewportHeight = useCallback(
    (_windowHeight: number, _aspectHeight: number) => window.innerHeight,
    [],
  )
  const getFrameOptions = useCallback(
    (frameTick: number) => ({
      palette: PROJECTS_ASCII_CHARS,
      variants: PROJECTS_CHAR_VARIANTS,
      frameTick,
      config: PROJECTS_ASCII_CONFIG,
    }),
    [],
  )

  useAsciiVideoLoop({
    videoRef,
    canvasRef,
    outputRef,
    sectionRef,
    configOverride: PROJECTS_ASCII_CONFIG,
    getViewportHeight,
    getFrameOptions,
    onReady,
    onFontSize,
  })

  return (
    <section ref={sectionRef} className="ascii-projects" aria-label="Projects">
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

      <ProjectCarousel />
    </section>
  )
}
