import './ProjectFolder.css'

interface ProjectFolderProps {
  folderId: string
  title: string
  folderColor?: string
  isCenter?: boolean
  style?: React.CSSProperties
  onCenterEnter?: () => void
  onCenterLeave?: () => void
  onCenterClick?: () => void
}

export function ProjectFolder({
  folderId,
  title,
  folderColor = '#4da3ff',
  isCenter = false,
  style,
  onCenterEnter,
  onCenterLeave,
  onCenterClick,
}: ProjectFolderProps) {
  return (
    <div
      className={`project-folder${isCenter ? ' project-folder--center' : ''}`}
      style={{ ...style, '--folder-glow': folderColor } as React.CSSProperties}
      onMouseEnter={isCenter ? onCenterEnter : undefined}
      onMouseLeave={isCenter ? onCenterLeave : undefined}
      onClick={isCenter ? onCenterClick : undefined}
      role={isCenter ? 'button' : undefined}
      tabIndex={isCenter ? 0 : undefined}
      aria-label={isCenter ? `${title} project` : undefined}
    >
      <svg
        className="project-folder__icon"
        viewBox="0 0 120 96"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id={`folder-grad-${folderId}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={lighten(folderColor, 20)} />
            <stop offset="100%" stopColor={folderColor} />
          </linearGradient>
        </defs>
        <path
          d="M8 24C8 18.477 12.477 14 18 14H44L54 22H102C107.523 22 112 26.477 112 32V78C112 83.523 107.523 88 102 88H18C12.477 88 8 83.523 8 78V24Z"
          fill={`url(#folder-grad-${folderId})`}
        />
        <path
          d="M8 28C8 22.477 12.477 18 18 18H44L54 26H102C107.523 26 112 30.477 112 36V78C112 83.523 107.523 88 102 88H18C12.477 88 8 83.523 8 78V28Z"
          fill={folderColor}
          opacity="0.85"
        />
        <path
          d="M44 14L54 22H18C12.477 22 8 26.477 8 32V28C8 22.477 12.477 18 18 18H44Z"
          fill={lighten(folderColor, 35)}
        />
      </svg>
      <span className="project-folder__label">{title}</span>
    </div>
  )
}

function lighten(hex: string, amount: number): string {
  const num = parseInt(hex.replace('#', ''), 16)
  const r = Math.min(255, ((num >> 16) & 0xff) + amount)
  const g = Math.min(255, ((num >> 8) & 0xff) + amount)
  const b = Math.min(255, (num & 0xff) + amount)
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`
}
