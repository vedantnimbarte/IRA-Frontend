'use client'

import { useEffect, useRef, useState } from 'react'

const STAGES = [
  {
    t: '0 ms',
    what: 'She hears her name',
    how: 'openWakeWord runs a three-stage ONNX chain on the raw microphone — mel spectrogram, embedding, classifier. Local, always.',
  },
  {
    t: '+200 ms',
    what: 'Transcription starts before you stop',
    how: 'Two hundred milliseconds of pause is enough to speculate. Whisper works on what you have said while you finish saying it, so the wait for the endpoint costs nothing.',
  },
  {
    t: '+700 ms',
    what: 'Silero decides the turn is over',
    how: 'Voice activity detection on 32 ms chunks. Too eager and it cuts you off mid-thought; too patient and she feels slow. Seven hundred is the number that survived testing.',
  },
  {
    t: 'then',
    what: 'Thinking and speaking are one step',
    how: 'The model streams. Sentences go to Piper the moment they are complete, so the first words are out loud long before the last words exist.',
  },
  {
    t: 'any time',
    what: 'You take the floor back',
    how: '250 ms of your voice cancels transcription, generation and playback together. She ducks at the first hint and stops when it is confirmed — the same token cancels all three.',
  },
  {
    t: '+2000 ms',
    what: 'The floor stays open',
    how: 'Two seconds to ask the follow-up without saying her name again. After that she goes back to listening for it.',
  },
]

export default function Turn() {
  const refs = useRef<(HTMLDivElement | null)[]>([])
  const [lit, setLit] = useState<boolean[]>(() => STAGES.map(() => false))

  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        setLit((prev) => {
          const next = [...prev]
          for (const e of entries) {
            const i = refs.current.indexOf(e.target as HTMLDivElement)
            if (i > -1 && e.isIntersecting) next[i] = true
          }
          return next
        })
      },
      { rootMargin: '-35% 0px -35% 0px' }
    )
    refs.current.forEach((el) => el && io.observe(el))
    return () => io.disconnect()
  }, [])

  return (
    <div className="turn">
      {STAGES.map((s, i) => (
        <div
          key={s.t + s.what}
          className="stage"
          data-lit={lit[i]}
          ref={(el) => {
            refs.current[i] = el
          }}
        >
          <div className="stage-t">{s.t}</div>
          <div className="stage-what">{s.what}</div>
          <p className="stage-how">{s.how}</p>
        </div>
      ))}
    </div>
  )
}
