'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Orb, { type OrbState } from './Orb'
import { turnStore } from './turnStore'

const HEARD = "what's on my calendar tomorrow"
const REPLY =
  'You have three things tomorrow. A design review at ten, lunch with Priya at half twelve, and the deploy window opens at four.'
const WORDS = REPLY.split(' ')
const WORD_MS = 210

type Row = { kind: 'you' | 'sys' | 'cut'; at: string; text: string }

const LABEL: Record<OrbState, string> = {
  idle: 'Idle',
  wake: 'Wake word',
  listening: 'Listening',
  thinking: 'Holding',
  speaking: 'Speaking',
  cut: 'Interrupted',
}

export default function Hero() {
  const [state, setState] = useState<OrbState>('idle')
  const [rows, setRows] = useState<Row[]>([])
  const [replying, setReplying] = useState(false)
  const [spoken, setSpoken] = useState(0)
  const [running, setRunning] = useState(false)
  const [ms, setMs] = useState(0)

  const timers = useRef<number[]>([])
  const started = useRef(0)
  const spokenRef = useRef(0)

  const clear = () => {
    timers.current.forEach(clearTimeout)
    timers.current = []
  }
  const at = (delay: number, fn: () => void) => {
    timers.current.push(window.setTimeout(fn, delay) as unknown as number)
  }
  /** Freeze the clock on the exact moment the turn ended. */
  const stop = () => {
    setMs(performance.now() - started.current)
    setRunning(false)
  }

  useEffect(() => () => clear(), [])

  // 10 Hz is plenty for a readout, and it keeps ticking where rAF gets throttled.
  useEffect(() => {
    if (!running) return
    const id = setInterval(() => setMs(performance.now() - started.current), 100)
    return () => clearInterval(id)
  }, [running])

  const run = useCallback(() => {
    clear()
    started.current = performance.now()
    setRunning(true)
    setReplying(false)
    setSpoken(0)
    spokenRef.current = 0
    setState('wake')
    setRows([{ kind: 'sys', at: '0 ms', text: 'Hey Jarvis — wake word fired' }])

    at(520, () => setState('listening'))
    at(700, () => setRows((r) => [...r, { kind: 'you', at: '', text: HEARD }]))
    at(900, () =>
      setRows((r) => [
        ...r,
        { kind: 'sys', at: '+200 ms', text: 'Transcribing while you finish' },
      ])
    )
    at(1400, () => {
      setState('thinking')
      setRows((r) => [...r, { kind: 'sys', at: '+700 ms', text: 'Silero: turn is over' }])
    })
    at(1900, () => {
      setState('speaking')
      setReplying(true)
      WORDS.forEach((_, i) =>
        at(i * WORD_MS, () => {
          spokenRef.current = i + 1
          setSpoken(i + 1)
        })
      )
      at(WORDS.length * WORD_MS + 700, () => {
        setState('listening')
        stop()
        setRows((r) => [
          ...r,
          { kind: 'sys', at: '+2000 ms', text: 'Floor open — no wake word needed' },
        ])
      })
      at(WORDS.length * WORD_MS + 2700, () => setState('idle'))
    })
  }, [])

  const cut = useCallback(() => {
    clear()
    stop()
    const left = WORDS.length - spokenRef.current
    setState('cut')
    setRows((r) => [
      ...r,
      {
        kind: 'cut',
        at: 'Cut',
        text: `Stream dropped, audio queue cleared — ${left} words never spoken`,
      },
    ])
    at(900, () => setState('listening'))
    at(2400, () => setState('idle'))
  }, [])

  const speaking = state === 'speaking'
  const wasCut = rows.some((r) => r.kind === 'cut')
  const heard = rows.find((r) => r.kind === 'you')
  const events = rows.filter((r) => r.kind !== 'you')
  const pct = (spoken / WORDS.length) * 100

  // The corner widgets further down follow this turn, and can run and cut it.
  useEffect(() => {
    turnStore.actions.run = run
    turnStore.actions.cut = cut
  }, [run, cut])
  useEffect(() => {
    turnStore.set({
      state,
      heard: heard?.text ?? '',
      reply: WORDS.slice(0, spoken).join(' '),
      seconds: ms / 1000,
      running,
      cut: wasCut,
      over: wasCut || (replying && !running),
    })
  }, [state, heard?.text, spoken, ms, running, wasCut, replying])

  return (
    <header className="hero">
      <div className="wrap hero-grid">
        <div className="hero-copy">
          <h1>A voice assistant you can interrupt.</h1>
          <p className="hero-sub">
            Wake word, endpointing, speech-to-text, a streaming model and streaming
            speech — in <strong>one process</strong>, so cutting her off is a single
            cancel that drops the HTTP stream mid-flight and clears the audio queue
            in the same frame.
          </p>
        </div>

        <div className="core" data-state={state} data-cut={wasCut}>
          <Orb state={state} />
          <svg className="hud" viewBox="-100 -100 200 200" aria-hidden="true">
            <g className="dial">
              <circle className="ticks" r="88" />
              <circle className="ticks-major" r="88" />
            </g>
            <circle className="segs" r="95" pathLength="100" />
            <circle className="track" r="80" pathLength="100" transform="rotate(-90)" />
            <circle
              className="said"
              r="80"
              pathLength="100"
              transform="rotate(-90)"
              style={{ strokeDasharray: `${pct} 100`, opacity: pct ? 1 : 0 }}
            />
            <circle className="busy" r="80" pathLength="100" />
          </svg>
          <div className="readout readout-top" aria-live="polite">
            <i className="dot" />
            {LABEL[state]}
          </div>
          <div className="readout readout-bottom">{(ms / 1000).toFixed(2)} s</div>
        </div>

        <div className="caption">
          {!heard && (
            <p className="caption-empty">
              Run a turn, then cut her off while she is talking.
            </p>
          )}
          {heard && (
            <div className="utter">
              <span className="who">You</span>
              <p>{heard.text}</p>
            </div>
          )}
          {replying && (
            <div className="utter utter-ira">
              <span className="who">
                IRA
                {speaking && (
                  <span className="wave">
                    <i />
                    <i />
                    <i />
                    <i />
                  </span>
                )}
              </span>
              <p>
                {WORDS.slice(0, spoken).join(' ')}
                {speaking && <i className="caret" />}
                {wasCut && <span className="ghost"> {WORDS.slice(spoken).join(' ')}</span>}
              </p>
            </div>
          )}
        </div>

        <div className="controls">
          <button className="btn btn-primary" onClick={run} disabled={running}>
            Run a turn
          </button>
          <button className="btn btn-cut" onClick={cut} disabled={!speaking}>
            Cut in
          </button>
          <span className="hint">
            {speaking ? 'She is mid-sentence. Take the floor.' : 'No audio, no microphone.'}
          </span>
        </div>

        <ol className="events">
          {events.map((r, i) => (
            <li key={i} data-cut={r.kind === 'cut'}>
              <span>{r.at}</span>
              {r.text}
            </li>
          ))}
        </ol>
      </div>
    </header>
  )
}
