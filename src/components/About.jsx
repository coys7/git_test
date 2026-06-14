export default function About({ onClose }) {
  return (
    <div className="about-section">
      <h2 className="view-title">About Paideia</h2>

      <div className="about-body">
        <h3 className="about-subhead">What is Paideia?</h3>

        <p>
          Most of what we read in a day disappears by evening. The scroll moves, the moment passes, and nothing accumulates. Paideia is built against that impulse.
        </p>

        <p>
          Each day brings one lesson — drawn from the long sweep of philosophy, history, theology, and political thought, or from the strange and overlooked corners of human civilization. Some lessons will deepen something you already know. Others will open a door you didn't know was there. All of them are worth five to ten minutes of your attention.
        </p>

        <p>
          As you read, you decide what to Pursue and what to Skip. Over time Paideia learns the shape of your curiosity — surfacing more of what pulls you in, less of what doesn't. Your daily lesson becomes genuinely yours.
        </p>

        <p>
          And over time Paideia becomes something more than a daily habit. It becomes a record — of the ideas you've encountered, the books you want to read, the questions you're still sitting with. A library that is entirely your own.
        </p>

        <h3 className="about-subhead">The Stoa</h3>

        <p>
          In ancient Athens, the Stoa was a painted portico where philosophers gathered to think and teach in the open air — available to anyone who walked by. It was never a lecture hall. It was a place of conversation, of questions as much as answers, of ideas tested against other minds.
        </p>

        <p>
          That's what the Stoa is inside Paideia. Not a search engine. A place to discuss what today's lesson stirred in you, push back on it, follow it somewhere unexpected. Enter with a question or without one. The Stoa meets you where you are.
        </p>

        <h3 className="about-subhead">On the Name</h3>

        <p>
          <em>Paideia</em> (Py-DAY-ah) is the ancient Greek word for the formation of a person through learning — not education in the modern sense of acquiring information, but the lifelong cultivation of the whole mind. It was Plato's word for what genuine learning does to a person over time: it shapes them.
        </p>

        <p>
          That's what this app is for. Not content consumption. Formation.
        </p>

        <p className="about-version">Paideia · Built with Claude</p>
      </div>

      <button className="btn-secondary" onClick={onClose}>Close</button>
    </div>
  )
}
