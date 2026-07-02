import { useCallback, useEffect, useState, type CSSProperties } from 'react'
import './BurgerMenu.css'

const NAV_ITEMS = [
  { label: 'Home', id: 'home' },
  { label: 'Projects', id: 'projects' },
  { label: 'About me', id: 'about' },
  { label: 'Contact', id: 'contact' },
] as const

const PANEL_COUNT = NAV_ITEMS.length

type BurgerMenuProps = {
  activePage: string
  onNavigate: (id: string) => void
}

export function BurgerMenu({ activePage, onNavigate }: BurgerMenuProps) {
  const [open, setOpen] = useState(false)
  const [hoveredId, setHoveredId] = useState<string | null>(null)

  const close = useCallback(() => setOpen(false), [])

  const navigate = useCallback(
    (id: string) => {
      close()
      onNavigate(id)
    },
    [close, onNavigate],
  )

  useEffect(() => {
    if (!open) {
      setHoveredId(null)
      return
    }

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, close])

  return (
    <>
      <button
        type="button"
        className={`burger-menu__toggle${open ? ' burger-menu__toggle--open' : ''}${activePage === 'projects' ? ' burger-menu__toggle--light' : ''}`}
        onClick={() => setOpen((prev) => !prev)}
        aria-label={open ? 'Close menu' : 'Open menu'}
        aria-expanded={open}
        aria-controls="burger-menu-overlay"
      >
        <span className="burger-menu__bar" />
        <span className="burger-menu__bar" />
        <span className="burger-menu__bar" />
      </button>

      <div
        id="burger-menu-overlay"
        className={`burger-menu__overlay${open ? ' burger-menu__overlay--open' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
        aria-hidden={!open}
      >
        <nav
          className="burger-menu__stack"
          aria-label="Site sections"
          style={{ '--total': PANEL_COUNT } as CSSProperties}
        >
          {NAV_ITEMS.map((item, i) => {
            const isHovered = hoveredId === item.id

            return (
              <button
                key={item.id}
                type="button"
                className={[
                  'burger-menu__panel',
                  `burger-menu__panel--${item.id}`,
                  isHovered ? 'burger-menu__panel--hovered' : '',
                  open ? 'burger-menu__panel--visible' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                style={{ '--i': i, '--total': PANEL_COUNT } as CSSProperties}
                onClick={() => navigate(item.id)}
                onMouseEnter={() => setHoveredId(item.id)}
                onMouseLeave={() => setHoveredId(null)}
                onFocus={() => setHoveredId(item.id)}
                onBlur={() => setHoveredId(null)}
                tabIndex={open ? 0 : -1}
                aria-current={activePage === item.id ? 'page' : undefined}
              >
                <span className="burger-menu__panel-title">{item.label}</span>
              </button>
            )
          })}
        </nav>
      </div>
    </>
  )
}
