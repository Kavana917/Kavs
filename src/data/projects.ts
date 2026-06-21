export type ProjectCategory = 'tech' | 'creative'

export interface Project {
  id: string
  title: string
  description: string
  category: ProjectCategory
  /** CSS gradient strings used as image placeholders */
  images: string[]
  folderColor?: string
}

export const TECH_FOLDER_COLOR = '#4da3ff'
export const CREATIVE_FOLDER_COLOR = '#f472b6'

export const projects: Project[] = [
  {
    id: 'ai-agents',
    title: 'AI Agents',
    category: 'tech',
    description:
      'Autonomous agent systems that orchestrate tools, memory, and reasoning for complex multi-step workflows.',
    images: [
      'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
      'linear-gradient(135deg, #533483 0%, #2d1b4e 100%)',
      'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)',
    ],
    folderColor: TECH_FOLDER_COLOR,
  },
  {
    id: 'web-apps',
    title: 'Web Apps',
    category: 'tech',
    description:
      'Full-stack web applications with real-time interfaces, responsive layouts, and performant backends.',
    images: [
      'linear-gradient(135deg, #134e5e 0%, #71b280 100%)',
      'linear-gradient(135deg, #2c3e50 0%, #3498db 100%)',
    ],
    folderColor: '#5eb8ff',
  },
  {
    id: 'data-viz',
    title: 'Data Viz',
    category: 'tech',
    description:
      'Dynamic dashboards and visual narratives that turn complex datasets into intuitive stories.',
    images: [
      'linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%)',
      'linear-gradient(135deg, #373b44 0%, #4286f4 100%)',
    ],
    folderColor: '#3d9aef',
  },
  {
    id: 'open-source',
    title: 'Open Source',
    category: 'tech',
    description:
      'Community-driven libraries and tools built for developers, designers, and creative technologists.',
    images: [
      'linear-gradient(135deg, #232526 0%, #414345 100%)',
      'linear-gradient(135deg, #1f4037 0%, #99f2c8 100%)',
      'linear-gradient(135deg, #4568dc 0%, #b06ab3 100%)',
    ],
    folderColor: '#58b4ff',
  },
  {
    id: 'api-systems',
    title: 'API Systems',
    category: 'tech',
    description:
      'Scalable APIs, microservices, and integration layers powering data-driven products.',
    images: [
      'linear-gradient(135deg, #141e30 0%, #243b55 100%)',
      'linear-gradient(135deg, #000428 0%, #004e92 100%)',
    ],
    folderColor: '#4da3ff',
  },
  {
    id: 'generative-art',
    title: 'Generative Art',
    category: 'creative',
    description:
      'Algorithmic artworks and procedural systems that explore form, color, and motion through code.',
    images: [
      'linear-gradient(135deg, #ff6b6b 0%, #feca57 100%)',
      'linear-gradient(135deg, #ee9ca7 0%, #ffdde1 100%)',
      'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
    ],
    folderColor: CREATIVE_FOLDER_COLOR,
  },
  {
    id: 'motion-design',
    title: 'Motion Design',
    category: 'creative',
    description:
      'Kinetic typography, animated identities, and short-form motion pieces for digital platforms.',
    images: [
      'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    ],
    folderColor: '#fb7185',
  },
  {
    id: 'brand-identity',
    title: 'Brand Identity',
    category: 'creative',
    description:
      'Visual systems, logotypes, and brand guidelines crafted for startups and creative studios.',
    images: [
      'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
      'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
    ],
    folderColor: '#f9a8d4',
  },
  {
    id: 'photography',
    title: 'Photography',
    category: 'creative',
    description:
      'Editorial and experimental photography series exploring light, texture, and narrative composition.',
    images: [
      'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
      'linear-gradient(135deg, #f6d365 0%, #fda085 100%)',
    ],
    folderColor: '#ec4899',
  },
  {
    id: 'editorial',
    title: 'Editorial',
    category: 'creative',
    description:
      'Layout design, typographic systems, and visual storytelling for editorial and print media.',
    images: [
      'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
      'linear-gradient(135deg, #ff9a9e 0%, #fad0c4 100%)',
    ],
    folderColor: '#f472b6',
  },
]

export function getProjectsByCategory(category: ProjectCategory): Project[] {
  return projects.filter((p) => p.category === category)
}
