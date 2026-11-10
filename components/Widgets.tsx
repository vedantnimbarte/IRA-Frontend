'use client'

import { useEffect, useState, useSyncExternalStore } from 'react'
import type { OrbState } from './Orb'
import { turnStore } from './turnStore'

/** How the app's left panel names each of the hero's states. */
const LABEL: Record<OrbState, string> = {
  idle: 'Idle',
  wake: 'Listening',
  listening: 'Listening',
  thinking: 'Thinking',
  speaking: 'Speaking',
  cut: 'Listening',
}

/**
 * The demo turn's timings: from the end of your sentence (the hero's
 * endpoint, at 1.40 s) to her first word (at 1.90 s), split the way the app
 * splits a real one.
 */
const SPLIT = [
  ['Hear', 120],
  ['Think', 290],
  ['Voice', 90],
] as const
const TOTAL = SPLIT.reduce((n, [, ms]) => n + ms, 0)

/** Made-up load that follows the turn, since a page cannot read your CPU. */
const LOAD: Record<OrbState, [number, number]> = {
  idle: [0.09, 0.52],
  wake: [0.16, 0.52],
  listening: [0.14, 0.53],
  thinking: [0.46, 0.56],
  speaking: [0.31, 0.55],
  cut: [0.18, 0.54],
}

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const hhmm = (d: Date) => `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`

export default function Widgets() {
  const turn = useSyncExternalStore(turnStore.subscribe, turnStore.get, turnStore.getServer)
  const [now, setNow] = useState<Date | null>(null)
  const [online, setOnline] = useState(true)
  const [load, setLoad] = useState<[number, number]>(LOAD.idle)

  // The visitor's own clock, and whether they are online: both real. Read
  // after mount, so the server's render and the browser's agree.
  useEffect(() => {
    const tick = () => setNow(new Date())
    tick()
    const id = setInterval(tick, 1000)
    const net = () => setOnline(navigator.onLine)
    net()
    window.addEventListener('online', net)
    window.addEventListener('offline', net)
    return () => {
      clearInterval(id)
      window.removeEventListener('online', net)
      window.removeEventListener('offline', net)
    }
  }, [])

  // CPU and memory glide toward what the turn would cost, with a little noise.
  useEffect(() => {
    const id = setInterval(() => {
      const [cpu, mem] = LOAD[turn.state]
      setLoad(([c, m]) => [
        Math.min(1, Math.max(0, c + (cpu - c) * 0.35 + (Math.random() - 0.5) * 0.03)),
        m + (mem - m) * 0.25,
      ])
    }, 400)
    return () => clearInterval(id)
  }, [turn.state])

  const empty = !turn.heard && !turn.reply
  const tone = turn.state === 'idle' ? 'idle' : 'live'
  const acting = turn.state === 'thinking'
  const acted = !!turn.reply || turn.over

  // Two reminders, set relative to the visitor's clock so they always count down.
  const soon = now ? new Date(now.getTime() + 40 * 60_000) : null
  const tomorrow = now ? new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 9, 30) : null
  const inWords = (ms: number) => {
    const mins = Math.ceil(ms / 60_000)
    return mins < 60 ? `${mins} min` : `${Math.floor(mins / 60)} h${mins % 60 ? ` ${mins % 60} min` : ''}`
  }

  return (
    <div className="screen">
      <div className="desk">
        {/* Top left: what she is doing. */}
        <div className="widget hud-ai" aria-label="What IRA is doing">
          <div className="hud-row">
            <span className="hud-mark">IRA</span>
            <span className="hud-state" data-tone={tone}>
              <i />
              {LABEL[turn.state]}
            </span>
          </div>

          <div className="hud-talk" aria-live="polite">
            {empty ? (
              <p className="hud-dim">Say &ldquo;hey Jarvis&rdquo;, or click the orb.</p>
            ) : (
              <>
                <div className="hud-line">
                  <span className="hud-label">You</span>
                  <p className="hud-you">{turn.heard || '…'}</p>
                </div>
                <div className="hud-line">
                  <span className="hud-label">IRA</span>
                  <p className="hud-ira">{turn.reply || '…'}</p>
                </div>
              </>
            )}
          </div>

          <div className="hud-row">
            <span className="hud-label">Last turn</span>
            {turn.over ? (
              <span className="hud-value">
                {turn.cut && <em>Cut in</em>}
                {(TOTAL / 1000).toFixed(2)} s
              </span>
            ) : (
              <span className="hud-label">None yet</span>
            )}
          </div>
          <div className="hud-bar" data-cut={turn.cut}>
            {turn.over &&
              SPLIT.map(([name, ms]) => <span key={name} style={{ flexGrow: ms }} />)}
          </div>
          <div className="hud-split">
            {turn.over &&
              SPLIT.map(([name, ms]) => (
                <span key={name}>
                  <span className="hud-label">{name}</span> {ms} ms
                </span>
              ))}
          </div>

          <div className="hud-action">
            {acting || acted ? (
              <>
                <i data-done={acted} />
                <span className="hud-value">list_events</span>
                <span className="hud-dim">{acted ? '3 events tomorrow' : 'running'}</span>
              </>
            ) : (
              <span className="hud-dim">No actions yet</span>
            )}
          </div>

          <div className="hud-foot">
            <span>
              <span className="hud-label">Model</span> claude-sonnet-5
            </span>
            <span className="hud-label">1 server</span>
            <span>
              <span className="hud-label">Hearing</span> Local
            </span>
            <span>
              <span className="hud-label">Voice</span> Kokoro, Heart
            </span>
          </div>
        </div>

        {/* Top right: the machine she runs on. */}
        <div className="widget hud-sys" aria-label="This machine">
          <div className="hud-clock">{now ? hhmm(now) : '--:--'}</div>
          <div className="hud-label hud-date">
            {now ? `${WEEKDAYS[now.getDay()]} ${now.getDate()} ${MONTHS[now.getMonth()]}` : ' '}
          </div>

          {(
            [
              ['CPU', load[0]],
              ['RAM', load[1]],
            ] as const
          ).map(([name, frac]) => (
            <div className="hud-meter" key={name}>
              <span className="hud-label">{name}</span>
              <span className="hud-track">
                <span style={{ width: `${frac * 100}%` }} />
              </span>
              <span className="hud-value">{Math.round(frac * 100)}%</span>
            </div>
          ))}

          <div className="hud-row hud-net">
            <span />
            <span className="hud-state" data-tone={online ? 'live' : 'bad'}>
              <i />
              {online ? 'Online' : 'Offline'}
            </span>
          </div>

          <div className="hud-rule" />
          <span className="hud-label">Next</span>
          {soon && tomorrow && now && (
            <ul className="hud-next">
              <li>
                <span className="hud-when">{hhmm(soon)}</span>
                <span className="hud-what">Call Sam</span>
                <span className="hud-label">{inWords(soon.getTime() - now.getTime())}</span>
              </li>
              <li>
                <span className="hud-when">
                  {WEEKDAYS[tomorrow.getDay()].slice(0, 3)} {hhmm(tomorrow)}
                </span>
                <span className="hud-what">Stand-up</span>
                <span className="hud-label">{inWords(tomorrow.getTime() - now.getTime())}</span>
              </li>
            </ul>
          )}
        </div>
      </div>

      <div className="screen-controls">
        <button className="btn btn-primary" onClick={() => turnStore.actions.run()} disabled={turn.running}>
          Run a turn
        </button>
        <button
          className="btn btn-cut"
          onClick={() => turnStore.actions.cut()}
          disabled={turn.state !== 'speaking'}
        >
          Cut in
        </button>
        <span className="hint">The same turn as the top of the page. CPU and memory here are made up; in IRA they are yours.</span>
      </div>
    </div>
  )
}
