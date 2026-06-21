import { useState } from 'react'
import type { ProjectCategory } from '../data/projects'
import { getProjectsByCategory } from '../data/projects'
import { ProjectRow } from './ProjectRow'
import './ProjectsSection.css'

const PAGE_SIZE = 3

export function ProjectsSection() {
  const [category, setCategory] = useState<ProjectCategory>('tech')
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)

  const allProjects = getProjectsByCategory(category)
  const visibleProjects = allProjects.slice(0, visibleCount)
  const hasMore = visibleCount < allProjects.length

  const switchCategory = (next: ProjectCategory) => {
    setCategory(next)
    setVisibleCount(PAGE_SIZE)
  }

  return (
    <section className="projects" id="projects">
      <header className="projects__header">
        <h2 className="projects__heading">Projects</h2>

        <div className="projects__toggle" role="tablist" aria-label="Project category">
          <button
            type="button"
            role="tab"
            aria-selected={category === 'tech'}
            className={`projects__toggle-btn${category === 'tech' ? ' projects__toggle-btn--active' : ''}`}
            onClick={() => switchCategory('tech')}
          >
            Tech
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={category === 'creative'}
            className={`projects__toggle-btn${category === 'creative' ? ' projects__toggle-btn--active' : ''}`}
            onClick={() => switchCategory('creative')}
          >
            Creative
          </button>
        </div>
      </header>

      <div className="projects__list">
        {visibleProjects.map((project, index) => (
          <ProjectRow
            key={`${category}-${project.id}`}
            project={project}
            reversed={index % 2 === 1}
          />
        ))}
      </div>

      {hasMore && (
        <div className="projects__more">
          <button
            type="button"
            className="projects__more-btn"
            onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
          >
            View more
            <span className="projects__more-arrow" aria-hidden="true">
              ↓
            </span>
          </button>
        </div>
      )}
    </section>
  )
}
