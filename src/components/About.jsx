export default function About({ onClose }) {
  return (
    <div className="about-section">
      <h2 className="view-title">About Lectio</h2>

      <div className="about-body">
        <p>
          Lectio is a daily micro-learning app built on a simple premise: ten minutes of deliberate reading, every day, compounds into something remarkable.
        </p>

        <p>
          The name comes from <em>lectio divina</em> — the ancient practice of slow, contemplative reading. Not scrolling. Not skimming. Reading as a discipline.
        </p>

        <p>
          Each day, Lectio selects a topic from the domains you care about — philosophy, theology, history, science, economics — and delivers a single, carefully crafted lesson. Four minutes to read. A lifetime to think about.
        </p>

        <h3 className="about-subhead">How it works</h3>
        <p>
          Lessons are generated fresh each day by Claude, Anthropic's AI. Every lesson follows the same structure: a hook that reframes the topic, the substance of the matter, and a close that asks why it still matters. Two reflection questions follow.
        </p>
        <p>
          Your taste profile learns over time. Mark a topic as something you want to pursue more of, or skip categories that aren't speaking to you. Lectio adjusts.
        </p>

        <h3 className="about-subhead">The Stoa</h3>
        <p>
          After each lesson, you can discuss it with the Stoa — a learned AI companion who has read the same lesson and is ready to go deeper, push back, or follow a thread you noticed.
        </p>

        <h3 className="about-subhead">Your data</h3>
        <p>
          Everything lives on your device. Lectio stores your lessons, notes, streak, and library in your browser's local storage. Nothing is sent to a server. Nothing is sold. Your reading life is yours.
        </p>

        <p className="about-version">Lectio · Built with Claude</p>
      </div>

      <button className="btn-secondary" onClick={onClose}>Close</button>
    </div>
  )
}
