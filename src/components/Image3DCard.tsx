import { useRef, useState, type CSSProperties, type MouseEvent } from 'react'
import './Image3DCard.css'

interface Image3DCardProps {
  gradient: string
  index: number
  label: string
}

export function Image3DCard({ gradient, index, label }: Image3DCardProps) {
  const bodyRef = useRef<HTMLDivElement>(null)
  const [bodyTransform, setBodyTransform] = useState('rotateX(0deg) rotateY(0deg)')

  const onMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    const el = bodyRef.current
    if (!el) return

    const rect = el.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const centerX = rect.width / 2
    const centerY = rect.height / 2
    const rotateX = ((y - centerY) / centerY) * -14
    const rotateY = ((x - centerX) / centerX) * 14

    setBodyTransform(`rotateX(${rotateX}deg) rotateY(${rotateY}deg)`)
  }

  const onMouseLeave = () => {
    setBodyTransform('rotateX(0deg) rotateY(0deg)')
  }

  return (
    <div
      className="image-3d-card"
      style={{ '--image-index': index } as CSSProperties}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
    >
      <div
        ref={bodyRef}
        className="image-3d-card__body"
        style={{ transform: bodyTransform }}
      >
        <div
          className="image-3d-card__surface"
          style={{ background: gradient }}
          role="img"
          aria-label={label}
        />
      </div>
    </div>
  )
}
