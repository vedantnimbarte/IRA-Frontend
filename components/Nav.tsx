'use client'

import { useEffect, useState } from 'react'

const REPO = 'https://github.com/vedantnimbarte/IRA'

export default function Nav() {
  const [lifted, setLifted] = useState(false)

  useEffect(() => {
    const onScroll = () => setLifted(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <nav className="nav" data-lifted={lifted}>
      <a className="nav-mark" href="#top">
        <Mark />
        IRA
      </a>
      <div className="nav-links">
        <a href="#turn">The turn</a>
        <a href="#screen">On screen</a>
        <a href="#gate">Confirmation</a>
        <a href="#tools">Tools</a>
        <a href="#honest">Unverified</a>
        <a href={REPO}>Source</a>
      </div>
    </nav>
  )
}

/** The repo's mark, reduced to the two ribs and the node that read at 20px. */
export function Mark({ size = 20 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={(size * 22) / 20}
      viewBox="0 0 200 220"
      fill="none"
      aria-hidden="true"
    >
      <g stroke="currentColor" strokeWidth="6" strokeLinecap="round">
        <path d="M100,32 C121,32 137,44 144,63 C149,79 149,96 147,112 C144,132 133,155 118,169 C112,175 106,178 100,178" />
        <path
          d="M100,32 C79,32 63,44 56,63 C51,79 51,96 53,112 C56,132 67,155 82,169 C88,175 94,178 100,178"
          opacity=".5"
        />
      </g>
      <circle cx="100" cy="104" r="13" fill="#2fe0d0" />
    </svg>
  )
}
