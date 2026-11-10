# ira-web

The marketing site for [IRA](https://github.com/vedantnimbarte/IRA) — a voice
assistant you can interrupt.

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # static export to out/
```

`next.config.mjs` sets `output: 'export'`, so `out/` is a plain static bundle —
GitHub Pages, Netlify, S3, anywhere. No server needed.

## What is here

The hero is the argument, not a banner. IRA's claim is that turn-taking is the
feature, so the page runs an actual turn — wake, speculate, endpoint, stream —
and gives you a button that cuts her off mid-word, logs how many words never got
spoken, and freezes the clock at the moment you took the floor.

| File | Job |
|---|---|
| `components/Orb.tsx` | The orb: icosahedron + simplex displacement, particle shell, bloom. One shader driven by turn state. |
| `components/Hero.tsx` | The scripted turn, the HUD dial around the orb, and the interrupt. Owns the state the orb reads. |
| `components/Turn.tsx` | The time axis, lit by scroll position. |
| `components/Nav.tsx` | Fixed rail and the IRA mark. |
| `app/globals.css` | The whole design system. No framework. |
| `app/page.tsx` | Copy and structure. |

Three.js is the only runtime dependency beyond Next and React.

## Editing

Colours, type and spacing are custom properties at the top of `app/globals.css`.
Type is one family, Archivo: its width axis does the work — expanded for
headings and HUD readouts, normal width for reading. Amber (`--amber`) means
"you took control" and appears only for the interrupt and the confirmation gate.

Orb behaviour is the `TARGETS` table at the top of `Orb.tsx`: one row per turn
state, and every uniform eases toward the row rather than snapping.

Repository links live in `REPO` at the top of `app/page.tsx` and
`components/Nav.tsx`.
