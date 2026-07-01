import { useCallback, useEffect, useState } from 'react'
import './BurgerMenu.css'

const NAV_ITEMS = [
  { label: 'Home', id: 'home' },
  { label: 'Projects', id: 'projects' },
  { label: 'About me', id: 'about' },
  { label: 'Contact', id: 'contact' },
] as const

type BurgerMenuProps = {
  activePage: string
  onNavigate: (id: string) => void
}

export function BurgerMenu({ activePage, onNavigate }: BurgerMenuProps) {
  const [open, setOpen] = useState(false)

  const close = useCallback(() => setOpen(false), [])

  const navigate = useCallback(
    (id: string) => {
      close()
      onNavigate(id)
    },
    [close, onNavigate],
  )

  useEffect(() => {
    if (!open) return

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
        <nav className="burger-menu__nav">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              type="button"
              className="burger-menu__link"
              onClick={() => navigate(item.id)}
              tabIndex={open ? 0 : -1}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </div>
    </>
  )
}
