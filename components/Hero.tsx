'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Orb, { type OrbState } from './Orb'

const HEARD = "what's on my calendar tomorrow"
const REPLY =
  'You have three things tomorrow. A design review at ten, lunch with Priya at half twelve, and the deploy window opens at four.'
const WORDS = REPLY.split(' ')
const WORD_MS = 210

type Row = { kind: 'you' | 'ira' | 'sys' | 'cut'; at: string; text: string }

const LABEL: Record<OrbState, string> = {
  idle: 'idle',
  wake: 'wake',
  listening: 'listening',
  thinking: 'holding',
  speaking: 'speaking',
  cut: 'interrupted',
}

export default function Hero() {
  const [state, setState] = useState<OrbState>('idle')
  const [rows, setRows] = useState<Row[]>([])
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
  // Stopping the clock is what freezes it, so the cut leaves its own timestamp on screen.
  useEffect(() => {
    if (!running) return
    const id = setInterval(() => setMs(performance.now() - started.current), 100)
    return () => clearInterval(id)
  }, [running])

  const run = useCallback(() => {
    clear()
    started.current = performance.now()
    setRunning(true)
    setSpoken(0)
    spokenRef.current = 0
    setRows([])
    setState('wake')
    setRows([{ kind: 'sys', at: '0 ms', text: 'hey Jarvis — wake word fired' }])

    at(520, () => setState('listening'))
    at(700, () =>
      setRows((r) => [...r, { kind: 'you', at: 'you', text: HEARD }])
    )
    at(900, () =>
      setRows((r) => [
        ...r,
        { kind: 'sys', at: '+200 ms', text: 'transcribing while you finish' },
      ])
    )
    at(1400, () => {
      setState('thinking')
      setRows((r) => [
        ...r,
        { kind: 'sys', at: '+700 ms', text: 'silero: turn is over' },
      ])
    })
    at(1900, () => {
      setState('speaking')
      setRows((r) => [...r, { kind: 'ira', at: 'ira', text: '' }])
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
          { kind: 'sys', at: '+2000 ms', text: 'floor open — no wake word needed' },
        ])
      })
      at(WORDS.length * WORD_MS + 2700, () => setState('idle'))
    })
  }, [])

  const cut = useCallback(() => {
    clear()
    stop()
    const heard = spokenRef.current
    setState('cut')
    setRows((r) => [
      ...r,
      {
        kind: 'cut',
        at: 'cut',
        text: `stream dropped mid-sentence, audio queue cleared — ${
          WORDS.length - heard
        } words never spoken`,
      },
    ])
    at(900, () => setState('listening'))
    at(2400, () => setState('idle'))
  }, [])

  const speaking = state === 'speaking'

  return (
    <header className="hero">
      <Orb state={state} />
      <div className="wrap hero-inner">
        <h1>A voice assistant you can interrupt.</h1>
        <p className="hero-sub">
          Wake word, endpointing, speech-to-text, a streaming model and streaming
          speech — in <strong>one process</strong>, so cutting her off is a single
          cancel that drops the HTTP stream mid-flight and clears the audio queue
          in the same frame.
        </p>

        <div className="console">
          <div className="console-bar">
            <span className="state" data-live={state !== 'idle'}>
              <i className="state-dot" />
              {LABEL[state]}
            </span>
            <span>
              {ms > 0
                ? `${state === 'cut' ? 'floor taken at ' : ''}${(ms / 1000).toFixed(2)} s`
                : 'ira 0.1 · 127.0.0.1:8180'}
            </span>
          </div>

          <div className="console-body">
            {rows.length === 0 && (
              <div className="line line-cut">
                <span>—</span>
                <span>Run a turn, then cut her off while she is talking.</span>
              </div>
            )}
            {rows.map((r, i) => (
              <div key={i} className={`line line-${r.kind}`}>
                <span>{r.at}</span>
                <span>
                  {r.kind === 'ira'
                    ? WORDS.slice(0, spoken).join(' ')
                    : r.text}
                  {r.kind === 'ira' && speaking && <i className="caret" />}
                </span>
              </div>
            ))}
          </div>

          <div className="console-foot">
            <button className="btn btn-primary" onClick={run} disabled={running}>
              Run a turn
            </button>
            <button className="btn btn-cut" onClick={cut} disabled={!speaking}>
              Cut in
            </button>
            <span className="hint">
              {speaking ? 'she is mid-sentence — take the floor' : 'no audio, no mic'}
            </span>
          </div>
        </div>
      </div>
    </header>
  )
}
