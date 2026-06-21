import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type TouchEvent as ReactTouchEvent,
} from 'react'
import {
  getProjectsByCategory,
  type Project,
  type ProjectCategory,
} from '../data/projects'
import { ProjectDetail } from './ProjectDetail'
import { ProjectFolder } from './ProjectFolder'
import './ProjectCarousel.css'

const STEP_ANGLE = 20
const RADIUS = 400
const VISIBLE_RANGE = 2
const SCROLL_SENSITIVITY = 0.0025
const SNAP_DELAY = 120
const LERP_SPEED = 0.14
const NORMALIZE_THRESHOLD = 50

type CarouselSlot = {
  key: string
  project: Project
  diff: number
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function wrapIndex(index: number, count: number): number {
  if (count === 0) return 0
  return ((index % count) + count) % count
}

/** Build symmetric slots around center — true infinite ring, always 2 above + 2 below */
function getCarouselSlots(projects: Project[], scrollOffset: number): CarouselSlot[] {
  const count = projects.length
  if (count === 0) return []

  const rounded = Math.round(scrollOffset)
  const slots: CarouselSlot[] = []

  for (let slot = -VISIBLE_RANGE; slot <= VISIBLE_RANGE; slot++) {
    const diff = slot - (scrollOffset - rounded)
    const projectIndex = wrapIndex(rounded + slot, count)
    const project = projects[projectIndex]
    slots.push({
      key: `${project.id}-slot-${rounded + slot}`,
      project,
      diff,
    })
  }

  return slots
}

function normalizeOffset(offset: number, count: number): number {
  if (count === 0) return 0
  const rounded = Math.round(offset)
  if (Math.abs(rounded) < count * NORMALIZE_THRESHOLD) return offset

  const wrapped = wrapIndex(rounded, count)
  const shift = rounded - wrapped
  return offset - shift
}

function folderStyle(diff: number, showDetails: boolean): CSSProperties {
  const angle = -diff * STEP_ANGLE
  const absDiff = Math.abs(diff)
  const t = clamp(absDiff / VISIBLE_RANGE, 0, 1)
  const ease = t * t
  const isCenter = absDiff < 0.35

  let opacity = clamp(1 - absDiff * 0.24, 0.16, 1)
  if (showDetails && !isCenter) {
    opacity = 0
  }

  const scale = 1 - ease * 0.42
  const scaleY = scale * (1 - ease * 0.38)

  return {
    transform: `translate(-50%, -50%) rotateX(${angle}deg) translateZ(${RADIUS}px) scale(${scale}, ${scaleY})`,
    opacity,
    zIndex: isCenter ? 110 : Math.round(100 - absDiff * 20),
    pointerEvents: showDetails && !isCenter ? 'none' : undefined,
  }
}

function resetScroll(
  scrollOffsetRef: React.MutableRefObject<number>,
  targetOffsetRef: React.MutableRefObject<number>,
  setScrollOffset: (v: number) => void,
) {
  scrollOffsetRef.current = 0
  targetOffsetRef.current = 0
  setScrollOffset(0)
}

export function ProjectCarousel() {
  const scrollZoneRef = useRef<HTMLDivElement>(null)
  const scrollOffsetRef = useRef(0)
  const targetOffsetRef = useRef(0)
  const snapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const rafRef = useRef(0)
  const touchStartYRef = useRef(0)
  const inZoneRef = useRef(false)

  const [category, setCategory] = useState<ProjectCategory>('tech')
  const [visibleProjects, setVisibleProjects] = useState<Project[]>(() =>
    getProjectsByCategory('tech'),
  )
  const [scrollOffset, setScrollOffset] = useState(0)
  const [inZone, setInZone] = useState(false)
  const [centerHovered, setCenterHovered] = useState(false)
  const [imagesHovered, setImagesHovered] = useState(false)
  const [detailsPinned, setDetailsPinned] = useState(false)
  const hoverLeaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [reducedMotion, setReducedMotion] = useState(false)

  const count = visibleProjects.length
  const activeIndex = wrapIndex(Math.round(scrollOffset), count)
  const activeProject = visibleProjects[activeIndex]
  const carouselSlots = getCarouselSlots(visibleProjects, scrollOffset)
  const showDetails = centerHovered || imagesHovered || detailsPinned

  const clearHoverLeaveTimer = useCallback(() => {
    if (hoverLeaveTimerRef.current) {
      clearTimeout(hoverLeaveTimerRef.current)
      hoverLeaveTimerRef.current = null
    }
  }, [])

  const scheduleHoverEnd = useCallback(() => {
    if (detailsPinned) return
    clearHoverLeaveTimer()
    hoverLeaveTimerRef.current = setTimeout(() => {
      setCenterHovered(false)
      setImagesHovered(false)
    }, 100)
  }, [clearHoverLeaveTimer, detailsPinned])

  inZoneRef.current = inZone

  const switchCategory = useCallback((next: ProjectCategory) => {
    setCategory(next)
    setVisibleProjects(getProjectsByCategory(next))
    setCenterHovered(false)
    setImagesHovered(false)
    setDetailsPinned(false)
    resetScroll(scrollOffsetRef, targetOffsetRef, setScrollOffset)
    if (snapTimerRef.current) clearTimeout(snapTimerRef.current)
    cancelAnimationFrame(rafRef.current)
    rafRef.current = 0
  }, [])

  const dismissDetails = useCallback(() => {
    setDetailsPinned(false)
    setCenterHovered(false)
    setImagesHovered(false)
  }, [])

  useEffect(() => {
    if (!detailsPinned) return

    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as HTMLElement
      if (target.closest('.project-folder--center')) return
      dismissDetails()
    }

    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [detailsPinned, dismissDetails])

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReducedMotion(mq.matches)
    const onChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  const syncOffset = useCallback((value: number) => {
    const normalized = normalizeOffset(value, count)
    scrollOffsetRef.current = normalized
    targetOffsetRef.current = normalizeOffset(targetOffsetRef.current, count)
    setScrollOffset(normalized)
  }, [count])

  const animate = useCallback(() => {
    if (count === 0) return

    const target = targetOffsetRef.current
    const current = scrollOffsetRef.current
    const diff = target - current

    if (Math.abs(diff) < 0.001) {
      const settled = normalizeOffset(target, count)
      scrollOffsetRef.current = settled
      targetOffsetRef.current = settled
      setScrollOffset(settled)
      rafRef.current = 0
      return
    }

    const next = reducedMotion ? target : current + diff * LERP_SPEED
    scrollOffsetRef.current = next
    setScrollOffset(next)
    rafRef.current = requestAnimationFrame(animate)
  }, [count, reducedMotion])

  const scheduleAnimate = useCallback(() => {
    if (!rafRef.current) {
      rafRef.current = requestAnimationFrame(animate)
    }
  }, [animate])

  const applyTarget = useCallback(
    (snap: boolean) => {
      if (count === 0) return

      if (snap) {
        targetOffsetRef.current = Math.round(targetOffsetRef.current)
      }

      if (reducedMotion) {
        syncOffset(targetOffsetRef.current)
        return
      }

      scheduleAnimate()
    },
    [count, reducedMotion, scheduleAnimate, syncOffset],
  )

  const scheduleSnap = useCallback(() => {
    if (snapTimerRef.current) clearTimeout(snapTimerRef.current)
    snapTimerRef.current = setTimeout(() => applyTarget(true), SNAP_DELAY)
  }, [applyTarget])

  const nudgeScroll = useCallback(
    (delta: number) => {
      if (count === 0) return
      targetOffsetRef.current += delta
      applyTarget(false)
      scheduleSnap()
    },
    [applyTarget, count, scheduleSnap],
  )

  const nudgeStep = useCallback(
    (steps: number) => {
      if (count === 0) return
      targetOffsetRef.current = Math.round(targetOffsetRef.current) + steps
      applyTarget(true)
    },
    [applyTarget, count],
  )

  useEffect(() => {
    const zone = scrollZoneRef.current
    if (!zone) return

    const onWheel = (e: WheelEvent) => {
      if (!inZoneRef.current) return
      e.preventDefault()
      nudgeScroll(e.deltaY * SCROLL_SENSITIVITY)
    }

    zone.addEventListener('wheel', onWheel, { passive: false })
    return () => zone.removeEventListener('wheel', onWheel)
  }, [nudgeScroll])

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        nudgeStep(1)
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        nudgeStep(-1)
      } else if (e.key === 'Escape') {
        dismissDetails()
      }
    },
    [nudgeStep, dismissDetails],
  )

  const onTouchStart = useCallback((e: ReactTouchEvent) => {
    touchStartYRef.current = e.touches[0].clientY
  }, [])

  const onTouchEnd = useCallback(
    (e: ReactTouchEvent) => {
      const deltaY = touchStartYRef.current - e.changedTouches[0].clientY
      if (Math.abs(deltaY) > 30) {
        nudgeStep(deltaY > 0 ? 1 : -1)
      }
    },
    [nudgeStep],
  )

  useEffect(() => {
    return () => {
      if (snapTimerRef.current) clearTimeout(snapTimerRef.current)
      if (hoverLeaveTimerRef.current) clearTimeout(hoverLeaveTimerRef.current)
      cancelAnimationFrame(rafRef.current)
    }
  }, [])

  return (
    <div className="project-carousel" role="region" aria-label="Project carousel">
      <div className="project-carousel__cluster">
        <button
          type="button"
          className={`project-carousel__category project-carousel__category--left${
            category === 'tech' ? ' project-carousel__category--active' : ''
          }`}
          onClick={() => switchCategory('tech')}
          aria-pressed={category === 'tech'}
        >
          [Technical]
        </button>

        <div
          ref={scrollZoneRef}
          className={`project-carousel__viewport${inZone ? ' project-carousel__viewport--active' : ''}`}
          onMouseEnter={() => setInZone(true)}
          onMouseLeave={() => {
            setInZone(false)
            if (!detailsPinned) setCenterHovered(false)
          }}
          onKeyDown={onKeyDown}
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
          tabIndex={0}
          role="group"
          aria-label="Project scroll area"
        >
          {activeProject && (
            <ProjectDetail
              project={activeProject}
              visible={showDetails}
              onImagesEnter={() => {
                clearHoverLeaveTimer()
                setImagesHovered(true)
              }}
              onImagesLeave={scheduleHoverEnd}
            />
          )}
          <div
            className={`project-carousel__drum${showDetails ? ' project-carousel__drum--details' : ''}`}
          >
            {carouselSlots.map(({ key, project, diff }) => {
              const isCenter = Math.abs(diff) < 0.35
              return (
                <ProjectFolder
                  key={key}
                  folderId={project.id}
                  title={project.title}
                  folderColor={project.folderColor}
                  isCenter={isCenter}
                  style={folderStyle(diff, showDetails)}
                  onCenterEnter={() => {
                    clearHoverLeaveTimer()
                    setCenterHovered(true)
                  }}
                  onCenterLeave={scheduleHoverEnd}
                  onCenterClick={() => setDetailsPinned((p) => !p)}
                />
              )
            })}
          </div>
        </div>

        <button
          type="button"
          className={`project-carousel__category project-carousel__category--right${
            category === 'creative' ? ' project-carousel__category--active' : ''
          }`}
          onClick={() => switchCategory('creative')}
          aria-pressed={category === 'creative'}
        >
          [Creative]
        </button>
      </div>

      <p className="project-carousel__hint" aria-hidden="true">
        {inZone && !showDetails ? 'Scroll to browse · hover folder for details' : ''}
      </p>
    </div>
  )
}
