import Hero from '@/components/Hero'
import Nav from '@/components/Nav'
import Turn from '@/components/Turn'

const REPO = 'https://github.com/vedantnimbarte/IRA'

export default function Page() {
  return (
    <>
      <Nav />
      <main id="top">
        <Hero />

        <hr className="rule" />

        <section id="turn">
          <div className="wrap">
            <div className="head">
              <h2>What a turn costs.</h2>
              <p>
                Speech recognition has been good enough for years. What stays
                broken is being cut off when you pause to think, and having to
                wait out an answer you already know is wrong.
              </p>
            </div>
            <Turn />
          </div>
        </section>

        <section id="process">
          <div className="wrap">
            <div className="head">
              <h2>One process, or none of this works.</h2>
              <p>
                Barge-in is not a feature you add. It is what you get when a
                single process holds the microphone and the speaker in the same
                instant.
              </p>
            </div>
            <div className="cols cols-2">
              <div className="panel">
                <h3>One cancellation token, three stages</h3>
                <p>
                  Transcription, generation and playback share it. Interrupting
                  is one <code>cancel()</code> — the HTTP stream drops in flight
                  and the audio queue empties in the same frame. Pipe those
                  stages together as separate programs and the best you can do is
                  ask each one nicely and wait.
                </p>
              </div>
              <div className="panel">
                <h3>Everything acoustic stays on the machine</h3>
                <p>
                  Wake word, endpointing and speech are always local. Point{' '}
                  <code>IRA_STT_URL</code> at a local whisper server and no audio
                  leaves the machine at all. The model is the one stage that
                  still needs the network.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section id="gate">
          <div className="wrap">
            <div className="head">
              <h2>Silence is not consent.</h2>
              <p>
                Anything that changes state says so out loud first, and only an
                explicit yes runs it.
              </p>
            </div>
            <div className="gate">
              <div className="exchange">
                <div>
                  <span>you</span>move my three o&rsquo;clock to Thursday
                </div>
                <div>
                  <span>ira</span>
                  <em className="said">Add that to your calendar?</em>
                </div>
              </div>
              <div className="verdict">
                <div>
                  <b>Yes</b> runs it. Everything else does not: silence, an
                  ambiguous answer, and interrupting the question are all
                  refusals.
                </div>
                <div>
                  <b>A server never gets to vouch for itself.</b> IRA decides
                  which tools mutate from her own config, not from the
                  description the server sends — otherwise a tool that calls
                  itself harmless walks straight through the gate.
                </div>
                <div>
                  <b>Six seconds, then no.</b> A confirmation that times out is a
                  refusal, not a retry.
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="tools">
          <div className="wrap">
            <div className="head">
              <h2>A tool is a line of config.</h2>
              <p>
                Rust implementation or MCP server — the registry cannot tell them
                apart, and neither can the model.
              </p>
            </div>
            <pre>
              <code>
                {`[[mcp.server]]
`}
                <span className="k">name</span>
                {`      = `}
                <span className="s">&quot;calendar&quot;</span>
                {`
`}
                <span className="k">transport</span>
                {` = `}
                <span className="s">&quot;stdio&quot;</span>
                {`
`}
                <span className="k">command</span>
                {`   = `}
                <span className="s">&quot;mcp-calendar&quot;</span>
                {`
`}
                <span className="k">only</span>
                {`      = [`}
                <span className="s">&quot;list_events&quot;</span>
                {`, `}
                <span className="s">&quot;create_event&quot;</span>
                {`]

`}
                <span className="c">
                  {`# What IRA believes, whatever the server says about itself.
# Anything unlisted is assumed to write, and asks first.`}
                </span>
                {`
[mcp.server.tools]
`}
                <span className="k">list_events</span>
                {`  = { mutates = false }
`}
                <span className="k">create_event</span>
                {` = { mutates = true, confirm = `}
                <span className="s">&quot;Add that to your calendar?&quot;</span>
                {` }`}
              </code>
            </pre>

            <div className="cols cols-2 stack">
              <div className="panel">
                <h3>Slow work does not hold the floor</h3>
                <p>
                  Mark a tool <code>latency = &quot;background&quot;</code> and IRA
                  answers immediately. A soft pip sounds when the work finishes and
                  the words wait until she next has the floor.
                </p>
              </div>
              <div className="panel">
                <h3>Any model that streams fast enough</h3>
                <p>
                  Anthropic direct by default. One environment variable switches to
                  the OpenAI chat-completions format, which OpenRouter, LM Studio,
                  Ollama, vLLM and llama.cpp all speak. Keep it fast — a model that
                  deliberates four seconds before its first token feels broken out
                  loud, however good the answer.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section id="honest">
          <div className="wrap">
            <div className="head">
              <h2>What has not been verified.</h2>
              <p>
                Kept on the front page rather than buried, because it is the
                honest shape of the project.
              </p>
            </div>
            <div className="unverified">
              <div>
                <b>A live microphone</b>
                <p>
                  Barge-in, the wake word, ducking and press-to-talk are all
                  acoustic, and all of them have only ever been exercised by
                  replaying WAV files through the real pipeline.
                </p>
              </div>
              <div>
                <b>A real model</b>
                <p>
                  Every measurement so far used a local stub, so time-to-first-token
                  has never been observed above zero. The latency work optimised
                  the transcription half of a budget whose model half is
                  unmeasured.
                </p>
              </div>
              <div>
                <b>Another machine</b>
                <p>
                  IRA has only ever been built and run on one Windows box. The
                  POSIX setup script parses and fetches models; its Piper download
                  and whisper.cpp build have never run.
                </p>
              </div>
              <div>
                <b>Echo cancellation</b>
                <p>
                  There is none. On speakers the microphone hears her own voice
                  and she interrupts herself, so wear headphones or set{' '}
                  <code>IRA_PTT=1</code> and use the talk button.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="wrap close">
          <h2>Say &ldquo;hey Jarvis&rdquo;, then talk over her.</h2>
          <pre>
            <code>
              <span className="c">{`# fetch ~6 MB of weights, then run\n`}</span>
              {`.\\scripts\\fetch-models.ps1\n`}
              <span className="k">$env:ANTHROPIC_API_KEY</span>
              {` = `}
              <span className="s">&quot;sk-ant-...&quot;</span>
              {`\ncargo run --release`}
            </code>
          </pre>
          <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
            <a className="btn btn-primary" href={REPO}>
              Read the source
            </a>
            <a className="btn" href={`${REPO}/tree/main/docs`}>
              Docs and decisions
            </a>
          </div>
        </section>
      </main>

      <footer className="foot">
        <span>IRA · 45 tests, no network or microphone needed</span>
        <nav>
          <a href={`${REPO}/blob/main/docs/ARCHITECTURE.md`}>Architecture</a>
          <a href={`${REPO}/blob/main/docs/BASELINE.md`}>Measured latency</a>
          <a href={`${REPO}/tree/main/docs/decisions`}>Decisions</a>
          <a href={REPO}>GitHub</a>
        </nav>
      </footer>
    </>
  )
}
