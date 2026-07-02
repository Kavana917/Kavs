import { useEffect, useState } from 'react'
import './HeroIntro.css'

const TITLE = '[ 2 Truths and 1 Lie ]'

const STATEMENTS = [
  'I promise you, my name is Kavana.',
  'I used to lock people up for a living.',
  'I have a pet octopus.',
] as const

const CHAR_DELAY_MS = 42
const LINE_PAUSE_MS = 320
const HIGHLIGHT_INTERVAL_MS = 2000

export function HeroIntro() {
  const [lineIndex, setLineIndex] = useState(0)
  const [charIndex, setCharIndex] = useState(0)
  const [typingDone, setTypingDone] = useState(false)
  const [highlightIndex, setHighlightIndex] = useState(-1)

  useEffect(() => {
    if (typingDone) return

    const currentLine = STATEMENTS[lineIndex]!

    if (charIndex < currentLine.length) {
      const timer = window.setTimeout(() => setCharIndex((c) => c + 1), CHAR_DELAY_MS)
      return () => window.clearTimeout(timer)
    }

    if (lineIndex < STATEMENTS.length - 1) {
      const timer = window.setTimeout(() => {
        setLineIndex((l) => l + 1)
        setCharIndex(0)
      }, LINE_PAUSE_MS)
      return () => window.clearTimeout(timer)
    }

    setTypingDone(true)
  }, [lineIndex, charIndex, typingDone])

  useEffect(() => {
    if (!typingDone) return

    setHighlightIndex(0)

    const timer = window.setInterval(() => {
      setHighlightIndex((i) => (i + 1) % STATEMENTS.length)
    }, HIGHLIGHT_INTERVAL_MS)

    return () => window.clearInterval(timer)
  }, [typingDone])

  const showCursor = !typingDone && lineIndex < STATEMENTS.length

  return (
    <aside className="hero-intro" aria-label="Introduction">
      <h2 className="hero-intro__title">{TITLE}</h2>

      <div className="hero-intro__statements">
        {STATEMENTS.map((text, i) => {
          let visible = ''
          if (i < lineIndex) {
            visible = text
          } else if (i === lineIndex) {
            visible = text.slice(0, charIndex)
          }

          const isTyping = i === lineIndex && showCursor
          const isHighlighted = typingDone && highlightIndex === i

          return (
            <p key={text} className="hero-intro__line">
              <span
                className={[
                  'hero-intro__statement',
                  isHighlighted ? 'hero-intro__statement--lie' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
              >
                {visible}
                {isTyping && <span className="hero-intro__cursor" aria-hidden="true" />}
              </span>
            </p>
          )
        })}
      </div>
    </aside>
  )
}
