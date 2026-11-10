import type { OrbState } from './Orb'

/** The hero's scripted turn, as the corner widgets further down need it. */
export type TurnSnapshot = {
  state: OrbState
  heard: string
  /** The words of her reply said so far. */
  reply: string
  /** Seconds on the hero's clock. */
  seconds: number
  running: boolean
  cut: boolean
  /** The turn ended, cut or not, so there are timings to show. */
  over: boolean
}

const IDLE: TurnSnapshot = {
  state: 'idle',
  heard: '',
  reply: '',
  seconds: 0,
  running: false,
  cut: false,
  over: false,
}

// ponytail: a module-level store rather than a context provider, because there
// is one hero and one reader and page.tsx stays a server component.
let snapshot = IDLE
const listeners = new Set<() => void>()

export const turnStore = {
  get: () => snapshot,
  getServer: () => IDLE,
  set(next: TurnSnapshot) {
    snapshot = next
    listeners.forEach((l) => l())
  },
  subscribe(listener: () => void) {
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  },
  /** The hero's own buttons, so the widgets section can start and cut a turn. */
  actions: { run: () => {}, cut: () => {} },
}
