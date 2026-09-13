import Link from "next/link";
import {
  ArrowRight,
  BookOpenCheck,
  Brain,
  Check,
  Code2,
  Play,
  Sparkles,
} from "lucide-react";

export default function HomePage() {
  return (
    <main className="landing-page spotify-landing">
      <nav className="landing-nav">
        <Link href="/" className="brand-lockup light-brand">
          <span className="brand-mark">
            <BookOpenCheck size={18} />
          </span>
          <span>Ledger</span>
        </Link>

        <div className="landing-links">
          <Link href="/dashboard" className="spotify-button">
            Open Ledger
          </Link>
        </div>
      </nav>

      <section className="spotify-hero">
        <div className="hero-copy">
          <span className="spotify-kicker">
            <Sparkles size={14} />
            Built for students who code with AI
          </span>

          <h1>
            Know what
            <br />
            you know.
          </h1>

          <p>
            Coding with AI is normal. Not knowing where its understanding
            ends and yours begins is the problem. Ledger logs every
            AI-assisted fix, reveals the concepts you keep borrowing, and
            tests you later without AI—so you know what you can truly rely
            on before the interview.
          </p>

          <div className="hero-actions">
            <Link href="/log-bug" className="spotify-button large">
              Start learning
              <ArrowRight size={17} />
            </Link>

            <Link href="/dashboard" className="spotify-outline-button">
              <Play size={16} fill="currentColor" />
              View demo
            </Link>
          </div>
        </div>

        <div
          className="product-preview"
          aria-label="Ledger dashboard preview"
        >
          <div className="preview-topline">
            <span>Today&apos;s learning</span>
            <span className="preview-avatar">MK</span>
          </div>

          <div className="preview-score">
            <span>Independent mastery</span>
            <strong>68%</strong>

            <div>
              <i />
            </div>
          </div>

          <div className="preview-title">
            <h2>Ready to review</h2>
            <span>2 concepts</span>
          </div>

          <div className="preview-row">
            <span className="preview-row-icon coral">
              <Code2 size={19} />
            </span>

            <span>
              <strong>Hash maps</strong>
              <small>Saved 3 days ago</small>
            </span>

            <button aria-label="Practice hash maps">
              <Play size={15} fill="currentColor" />
            </button>
          </div>

          <div className="preview-row">
            <span className="preview-row-icon violet">
              <Brain size={19} />
            </span>

            <span>
              <strong>Array traversal</strong>
              <small>Saved yesterday</small>
            </span>

            <button aria-label="Practice array traversal">
              <Play size={15} fill="currentColor" />
            </button>
          </div>

          <div className="preview-win">
            <Check size={17} />

            <span>
              <strong>SQL joins mastered</strong>
              <small>Proved independently</small>
            </span>
          </div>
        </div>
      </section>

      <section className="landing-story">
        <span className="spotify-kicker">The learning loop</span>

        <h2>Your AI history becomes a practice plan.</h2>

        <div className="story-grid">
          <article>
            <span>01</span>
            <h3>Save the fix</h3>
            <p>
              Log the moment AI helped and let Ledger identify the
              underlying concept.
            </p>
          </article>

          <article>
            <span>02</span>
            <h3>Return later</h3>
            <p>
              Get a new problem that uses the same skill, without AI in the
              room.
            </p>
          </article>

          <article>
            <span>03</span>
            <h3>Prove it</h3>
            <p>
              Build a clear record of what you can handle independently
              before an interview.
            </p>
          </article>
        </div>
      </section>
    </main>
  );
}