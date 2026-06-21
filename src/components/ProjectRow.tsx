import { useState } from 'react'
import type { Project } from '../data/projects'
import { DisplacementImage } from './DisplacementImage'
import './ProjectRow.css'

interface ProjectRowProps {
  project: Project
  reversed?: boolean
}

export function ProjectRow({ project, reversed = false }: ProjectRowProps) {
  const [hovered, setHovered] = useState(false)

  return (
    <article
      className={`project-row${reversed ? ' project-row--reversed' : ''}${hovered ? ' project-row--hovered' : ''}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="project-row__image">
        <DisplacementImage
          src={project.image}
          alt={project.title}
          active={hovered}
        />
      </div>

      <div className="project-row__content">
        <span className="project-row__number">{project.id}</span>
        <h3 className="project-row__title">{project.title}</h3>
        <p className="project-row__description">{project.description}</p>
        <ul className="project-row__tags">
          {project.tags.map((tag) => (
            <li key={tag} className="project-row__tag">
              {tag}
            </li>
          ))}
        </ul>
      </div>
    </article>
  )
}
