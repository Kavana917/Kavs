import type { Project } from '../data/projects'
import { Image3DCard } from './Image3DCard'
import './ProjectDetail.css'

interface ProjectDetailProps {
  project: Project
  visible: boolean
  onImagesEnter?: () => void
  onImagesLeave?: () => void
}

export function ProjectDetail({
  project,
  visible,
  onImagesEnter,
  onImagesLeave,
}: ProjectDetailProps) {
  const images = project.images.slice(0, 3)

  return (
    <div
      className={`project-detail${visible ? ' project-detail--visible' : ''}`}
      aria-hidden={!visible}
    >
      <div
        className="project-detail__images"
        onMouseEnter={onImagesEnter}
        onMouseLeave={onImagesLeave}
      >
        {images.map((gradient, i) => (
          <Image3DCard
            key={`${project.id}-img-${i}`}
            gradient={gradient}
            index={i}
            label={`${project.title} preview ${i + 1}`}
          />
        ))}
      </div>

      <div className="project-detail__text">
        <h3 className="project-detail__title">{project.title}</h3>
        <p className="project-detail__description">{project.description}</p>
      </div>
    </div>
  )
}
