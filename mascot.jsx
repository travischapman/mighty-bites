// mascot.jsx — "Buddy", the protein-powered mascot.
// Buddy is drawn entirely in CSS/DOM (no image files). His look is driven by
// `pct` = protein eaten / daily goal, in five stages:
//   level 0  (<25%)   very squishy, round, glum — dumbbells lie on the ground,
//                     too heavy to lift, wobbling as he nudges them around.
//   level 1  (25-50%) waking up, less droopy.
//   level 2  (50-75%) standing tall, determined (a little sweaty).
//   level 3  (75-99%) flexing, almost there.
//   level 4  (>=100%) muscular hero pressing a heavy barbell overhead, glowing.

function buddyLevel(pct) {
  if (pct >= 1)    return 4;
  if (pct >= 0.75) return 3;
  if (pct >= 0.5)  return 2;
  if (pct >= 0.25) return 1;
  return 0;
}

const BUDDY_MESSAGES = [
  "I feel all squishy… feed me some protein!",
  "Ooh, I'm starting to wake up!",
  "I'm getting stronger — keep it up!",
  "So close to super-strong! A little more!",
  "I'M MIGHTY! Watch me lift this! 🏋️",
];

function Buddy({ pct, grams, goal }) {
  const level = buddyLevel(pct);
  const isHero = level === 4;

  return (
    <div className={`buddy-stage${isHero ? " is-hero" : ""}`} data-level={level}>
      <div className="buddy-glow" aria-hidden="true" />

      {isHero && (
        <div className="buddy-sparkles" aria-hidden="true">
          {["✨", "⭐", "✨", "💥", "⭐", "✨"].map((s, i) => (
            <span key={i} className="buddy-spark" style={{ "--i": i }}>{s}</span>
          ))}
        </div>
      )}

      <div className="buddy-scene" aria-hidden="true">
        {/* Barbell pressed overhead — hero only */}
        <div className="buddy-barbell">
          <span className="bb-plate" /><span className="bb-bar" /><span className="bb-plate" />
        </div>

        <div className="buddy">
          <div className="buddy-arm arm-l" />
          <div className="buddy-arm arm-r" />
          <div className="buddy-body">
            <div className="buddy-shine" />
            <div className="buddy-cheek cheek-l" />
            <div className="buddy-cheek cheek-r" />
            <div className="buddy-face">
              <div className="buddy-brow brow-l" />
              <div className="buddy-brow brow-r" />
              <div className="buddy-eye eye-l"><i /></div>
              <div className="buddy-eye eye-r"><i /></div>
              <div className="buddy-mouth" />
            </div>
            <div className="buddy-sweat" />
          </div>
          <div className="buddy-foot foot-l" />
          <div className="buddy-foot foot-r" />
        </div>

        {/* Dumbbells Buddy can't lift yet — they wobble on the ground */}
        <div className="buddy-dumbbell db-l">
          <span className="db-weight" /><span className="db-handle" /><span className="db-weight" />
        </div>
        <div className="buddy-dumbbell db-r">
          <span className="db-weight" /><span className="db-handle" /><span className="db-weight" />
        </div>
      </div>

      <div className="buddy-speech">{BUDDY_MESSAGES[level]}</div>
    </div>
  );
}

Object.assign(window, { Buddy, buddyLevel, BUDDY_MESSAGES });
