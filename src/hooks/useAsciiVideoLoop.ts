import { useEffect, useRef, type RefObject } from 'react'
import {
  computeGridSize,
  drawVideoFit,
  frameToAscii,
  type AsciiToneConfig,
  type FrameToAsciiOptions,
} from '../utils/asciiConverter'

type UseAsciiVideoLoopOptions = {
  videoRef: RefObject<HTMLVideoElement | null>
  canvasRef: RefObject<HTMLCanvasElement | null>
  outputRef: RefObject<HTMLPreElement | null>
  sectionRef: RefObject<HTMLElement | null>
  configOverride?: Partial<AsciiToneConfig>
  getViewportHeight?: (windowHeight: number, aspectHeight: number) => number
  getFrameOptions?: (frameTick: number) => FrameToAsciiOptions
  onReady?: () => void
  onFontSize?: (fontSize: number) => void
}

function isSectionVisible(section: HTMLElement): boolean {
  const rect = section.getBoundingClientRect()
  return rect.bottom > 0 && rect.top < window.innerHeight
}

export function useAsciiVideoLoop({
  videoRef,
  canvasRef,
  outputRef,
  sectionRef,
  configOverride,
  getViewportHeight,
  getFrameOptions,
  onReady,
  onFontSize,
}: UseAsciiVideoLoopOptions) {
  const frameRef = useRef(0)
  const videoFrameRef = useRef(0)
  const getViewportHeightRef = useRef(getViewportHeight)
  const getFrameOptionsRef = useRef(getFrameOptions)
  const onReadyRef = useRef(onReady)
  const onFontSizeRef = useRef(onFontSize)

  getViewportHeightRef.current = getViewportHeight
  getFrameOptionsRef.current = getFrameOptions
  onReadyRef.current = onReady
  onFontSizeRef.current = onFontSize

  useEffect(() => {
    const video = videoRef.current
    const canvas = canvasRef.current
    const output = outputRef.current
    const section = sectionRef.current
    if (!video || !canvas || !output || !section) return

    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    if (!ctx) return

    let cols = 0
    let rows = 0
    let visible = isSectionVisible(section)
    let loopActive = false
    let videoStarted = false

    const resize = () => {
      const vw = video.videoWidth
      const vh = video.videoHeight
      if (!vw || !vh) return

      const aspectHeight = (window.innerWidth * vh) / vw
      const getHeight = getViewportHeightRef.current
      const viewportHeight = getHeight
        ? getHeight(window.innerHeight, aspectHeight)
        : window.innerHeight

      const grid = computeGridSize(
        window.innerWidth,
        viewportHeight,
        vw,
        vh,
        configOverride,
      )
      cols = grid.cols
      rows = grid.rows
      onFontSizeRef.current?.(grid.fontSize)
      canvas.width = grid.cols * grid.sampleScale
      canvas.height = grid.canvasHeight * grid.sampleScale
    }

    const renderFrame = () => {
      if (!visible || video.readyState < 2 || cols <= 0 || rows <= 0) return

      drawVideoFit(ctx, video, canvas.width, canvas.height)
      const frameTick = Math.floor(performance.now() / 80)
      const options = getFrameOptionsRef.current?.(frameTick)
      output.textContent = frameToAscii(ctx, cols, rows, options)
    }

    const scheduleNextFrame = () => {
      if (!loopActive) return

      if (!video.paused && 'requestVideoFrameCallback' in video) {
        videoFrameRef.current = (
          video as HTMLVideoElement & {
            requestVideoFrameCallback: (
              callback: VideoFrameRequestCallback,
            ) => number
          }
        ).requestVideoFrameCallback(() => {
          renderFrame()
          scheduleNextFrame()
        })
        return
      }

      frameRef.current = requestAnimationFrame(() => {
        renderFrame()
        scheduleNextFrame()
      })
    }

    const stopLoop = () => {
      loopActive = false
      cancelAnimationFrame(frameRef.current)
      if ('cancelVideoFrameCallback' in video) {
        ;(
          video as HTMLVideoElement & {
            cancelVideoFrameCallback: (handle: number) => void
          }
        ).cancelVideoFrameCallback(videoFrameRef.current)
      }
    }

    const startLoop = () => {
      if (loopActive) return
      loopActive = true
      scheduleNextFrame()
    }

    const startVideo = () => {
      if (videoStarted) return
      videoStarted = true
      visible = isSectionVisible(section)
      resize()
      onReadyRef.current?.()
      video.play().catch(() => {})
      if (visible) startLoop()
    }

    const tryStart = () => {
      resize()
      if (video.readyState >= 2) startVideo()
    }

    const updateVisibility = () => {
      const nowVisible = isSectionVisible(section)
      if (nowVisible === visible) return

      visible = nowVisible
      if (!videoStarted) return

      if (visible) {
        video.play().catch(() => {})
        startLoop()
      } else {
        stopLoop()
      }
    }

    const onResize = () => {
      resize()
      updateVisibility()
    }

    video.addEventListener('loadedmetadata', tryStart)
    video.addEventListener('canplay', tryStart)
    window.addEventListener('resize', onResize)
    window.addEventListener('scroll', updateVisibility, { passive: true })

    if (video.readyState >= 1) tryStart()
    if (video.readyState >= 3) tryStart()
    requestAnimationFrame(updateVisibility)

    return () => {
      stopLoop()
      video.removeEventListener('loadedmetadata', tryStart)
      video.removeEventListener('canplay', tryStart)
      window.removeEventListener('resize', onResize)
      window.removeEventListener('scroll', updateVisibility)
    }
  }, [videoRef, canvasRef, outputRef, sectionRef, configOverride])
}
