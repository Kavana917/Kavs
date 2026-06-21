import tech1 from '../../media/project_images/tech1.png'
import tech2 from '../../media/project_images/tech2.png'
import tech3 from '../../media/project_images/tech3.png'
import tech4 from '../../media/project_images/tech4.png'
import creative1 from '../../media/project_images/creative1.png'
import creative2 from '../../media/project_images/creative2.png'
import creative3 from '../../media/project_images/creative3.png'
import creative4 from '../../media/project_images/cretive4.png'

export type ProjectCategory = 'tech' | 'creative'

export interface Project {
  id: string
  title: string
  description: string
  tags: string[]
  image: string
  category: ProjectCategory
}

export const projects: Project[] = [
  {
    id: '01',
    title: 'Neural Canvas',
    description: 'Real-time generative art platform powered by diffusion models.',
    tags: ['React', 'WebGL', 'Python'],
    image: tech1,
    category: 'tech',
  },
  {
    id: '02',
    title: 'Pulse Analytics',
    description: 'Live data dashboard for monitoring distributed systems at scale.',
    tags: ['TypeScript', 'D3', 'Node.js'],
    image: tech2,
    category: 'tech',
  },
  {
    id: '03',
    title: 'Echo API',
    description: 'Low-latency event streaming gateway with schema validation.',
    tags: ['Go', 'Kafka', 'gRPC'],
    image: tech3,
    category: 'tech',
  },
  {
    id: '04',
    title: 'Lattice OS',
    description: 'Modular design system and component library for product teams.',
    tags: ['Figma', 'React', 'Storybook'],
    image: tech4,
    category: 'tech',
  },
  {
    id: '01',
    title: 'Chromatic Void',
    description: 'Experimental film exploring light distortion in urban spaces.',
    tags: ['After Effects', 'Cinema 4D'],
    image: creative1,
    category: 'creative',
  },
  {
    id: '02',
    title: 'Static Bloom',
    description: 'Mixed-media installation using analog signal interference.',
    tags: ['Installation', 'Sound Design'],
    image: creative2,
    category: 'creative',
  },
  {
    id: '03',
    title: 'AREP',
    description: 'Architectural visualization with procedural displacement mapping.',
    tags: ['Blender', 'WebGL', 'Three.js'],
    image: creative3,
    category: 'creative',
  },
  {
    id: '04',
    title: 'Nocturne',
    description: 'Photography series capturing industrial decay and reflection.',
    tags: ['Photography', 'Darkroom'],
    image: creative4,
    category: 'creative',
  },
]

export function getProjectsByCategory(category: ProjectCategory): Project[] {
  return projects.filter((p) => p.category === category)
}
