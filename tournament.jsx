// tournament.jsx — Tournament Mode (unlocked after hitting the daily protein goal).
// Kid-friendly single-elim bracket: semifinal → final, with food/Buddy-themed
// opponents. Matches are a playful Flex / Jump / Spin showdown (RPS). Awards
// and win counts persist via the parent App's localStorage blob.

const { useState, useEffect, useMemo } = React;

// ── Catalog ─────────────────────────────────────────────────────────────────
const TOURNAMENT_OPPONENTS = [
  { id: "broccoli", name: "Broccoli Beast", emoji: "🥦", taunt: "Leafy AND strong!" },
  { id: "egg",      name: "Eggcellent Eddie", emoji: "🥚", taunt: "I never crack!" },
  { id: "banana",   name: "Banana Brawler", emoji: "🍌", taunt: "Slip into victory!" },
  { id: "milk",     name: "Mighty Milk", emoji: "🥛", taunt: "Got protein?" },
  { id: "salmon",   name: "Salmon Slam", emoji: "🐟", taunt: "Swimming to the top!" },
  { id: "bean",     name: "Bean Machine", emoji: "🫘", taunt: "Full of power!" },
  { id: "yogurt",   name: "Yogurt Yeti", emoji: "🧊", taunt: "Chillin' & winnin'!" },
  { id: "chicken",  name: "Chicken Champ", emoji: "🍗", taunt: "Ready to flex!" },
];

const TOURNAMENT_AWARDS = [
  { id: "champion",    name: "Champion Trophy",  emoji: "🏆", blurb: "Won the Mighty Tournament!" },
  { id: "runner-up",   name: "Silver Flex",       emoji: "🥈", blurb: "Reached the finals!" },
  { id: "participant", name: "Protein Ribbon",    emoji: "🎗️", blurb: "Stepped into the arena!" },
];

const MOVES = [
  { id: "flex", name: "Flex", emoji: "💪", beats: "spin" },
  { id: "jump", name: "Jump", emoji: "🦘", beats: "flex" },
  { id: "spin", name: "Spin", emoji: "🌀", beats: "jump" },
];

const awardById = (id) => TOURNAMENT_AWARDS.find((a) => a.id === id);

function pickOpponents(rng = Math.random) {
  const pool = [...TOURNAMENT_OPPONENTS];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return { kidOpp: pool[0], sideA: pool[1], sideB: pool[2] };
}

function resolveRound(playerMove, oppMove) {
  if (playerMove === oppMove) return "tie";
  const m = MOVES.find((x) => x.id === playerMove);
  return m && m.beats === oppMove ? "win" : "lose";
}

function randomMove(rng = Math.random) {
  return MOVES[Math.floor(rng() * MOVES.length)].id;
}

function moveMeta(id) {
  return MOVES.find((m) => m.id === id);
}

// Tiny confetti (mirrors app Confetti so this file stays self-contained)
function TourneyConfetti() {
  const pieces = useMemo(() => Array.from({ length: 50 }, (_, i) => ({
    left: Math.random() * 100,
    delay: Math.random() * 0.5,
    dur: 1.6 + Math.random() * 1.4,
    color: ["#FF7043", "#FFC46B", "#34B36A", "#6FAEF0", "#8A5CF0", "#F08AB8"][i % 6],
    rot: Math.random() * 360,
    size: 8 + Math.random() * 8,
  })), []);
  return (
    <div className="confetti" aria-hidden="true">
      {pieces.map((p, i) => (
        <span key={i} className="confetti-bit" style={{
          left: `${p.left}%`, animationDelay: `${p.delay}s`, animationDuration: `${p.dur}s`,
          background: p.color, width: p.size, height: p.size, transform: `rotate(${p.rot}deg)`,
        }} />
      ))}
    </div>
  );
}

// ── Locked teaser (home card + full tab) ─────────────────────────────────────
function TournamentLocked({ remainingG, compact, onGoHome }) {
  return (
    <div className={`tourney-locked${compact ? " compact" : ""}`}>
      <div className="tourney-lock-emoji" aria-hidden="true">🔒🏟️</div>
      <h3 className="tourney-lock-title">Tournament Mode</h3>
      <p className="tourney-lock-sub">
        Hit today's protein goal to unlock Buddy's Mighty Tournament!
        {remainingG > 0 && (
          <> Need <b>{remainingG}g</b> more protein.</>
        )}
      </p>
      {compact && onGoHome && (
        <button type="button" className="tourney-secondary-btn" onClick={onGoHome}>
          Back to Home
        </button>
      )}
    </div>
  );
}

// ── Award celebration modal ─────────────────────────────────────────────────
function AwardModal({ award, placement, kidName, onClose, playSound }) {
  useEffect(() => {
    if (typeof playSound === "function") {
      playSound(placement === "champion" ? "goal" : "treasure");
    }
  }, [placement, playSound]);
  const headline =
    placement === "champion" ? `Champion${kidName ? `, ${kidName}` : ""}!` :
    placement === "runner-up" ? "So close — runner-up!" :
    "Nice try — you competed!";
  return (
    <div className="reveal-backdrop" onClick={onClose}>
      {placement === "champion" && <TourneyConfetti />}
      <div className="reveal-card celebrate-card" onClick={(e) => e.stopPropagation()}>
        <div className="celebrate-hero">{award.emoji}</div>
        <h2 className="name-prompt-title">{headline}</h2>
        <p className="celebrate-sub">
          You earned the <b>{award.name}</b> — {award.blurb}
        </p>
        <button className="prize-close" onClick={onClose}>Awesome! 🎉</button>
      </div>
    </div>
  );
}

// ── One match (best of 3) ───────────────────────────────────────────────────
function MatchArena({ kidName, opponent, roundLabel, onDone }) {
  const [kidScore, setKidScore] = useState(0);
  const [oppScore, setOppScore] = useState(0);
  const [last, setLast] = useState(null); // { kid, opp, result }
  const [busy, setBusy] = useState(false);

  const pick = (moveId) => {
    if (busy) return;
    const oppMove = randomMove();
    const result = resolveRound(moveId, oppMove);
    setLast({ kid: moveId, opp: oppMove, result });
    setBusy(true);

    let nextKid = kidScore;
    let nextOpp = oppScore;
    if (result === "win") nextKid += 1;
    if (result === "lose") nextOpp += 1;

    // Delay so kids can see the showdown before the next round / finish
    setTimeout(() => {
      setKidScore(nextKid);
      setOppScore(nextOpp);
      if (nextKid >= 2 || nextOpp >= 2) {
        onDone(nextKid > nextOpp);
      } else {
        setBusy(false);
        setLast(null);
      }
    }, 1100);
  };

  return (
    <div className="tourney-arena">
      <div className="tourney-round-label">{roundLabel}</div>
      <div className="tourney-vs">
        <div className="tourney-fighter">
          <span className="tourney-fighter-emoji">💪</span>
          <span className="tourney-fighter-name">{kidName || "You"}</span>
          <span className="tourney-fighter-score">{kidScore}</span>
        </div>
        <div className="tourney-vs-badge">VS</div>
        <div className="tourney-fighter">
          <span className="tourney-fighter-emoji">{opponent.emoji}</span>
          <span className="tourney-fighter-name">{opponent.name}</span>
          <span className="tourney-fighter-score">{oppScore}</span>
        </div>
      </div>
      <p className="tourney-taunt">“{opponent.taunt}”</p>

      {last ? (
        <div className={`tourney-showdown result-${last.result}`}>
          <span>{moveMeta(last.kid).emoji}</span>
          <em>
            {last.result === "win" ? "You win the round!" :
             last.result === "lose" ? "They win the round!" : "Tie — go again!"}
          </em>
          <span>{moveMeta(last.opp).emoji}</span>
        </div>
      ) : (
        <p className="tourney-pick-hint">Pick your move! Best of 3</p>
      )}

      <div className="tourney-moves">
        {MOVES.map((m) => (
          <button key={m.id} type="button" className="tourney-move-btn"
            disabled={busy} onClick={() => pick(m.id)}>
            <span className="tourney-move-emoji">{m.emoji}</span>
            <span className="tourney-move-name">{m.name}</span>
          </button>
        ))}
      </div>
      <p className="tourney-rules">💪 beats 🌀 · 🦘 beats 💪 · 🌀 beats 🦘</p>
    </div>
  );
}

// ── Bracket overview (lobby / between rounds) ───────────────────────────────
function BracketBoard({ kidName, bracket, highlight }) {
  const slots = [
    { label: "Semifinal 1", a: { emoji: "💪", name: kidName || "You" }, b: bracket.kidOpp },
    { label: "Semifinal 2", a: bracket.sideA, b: bracket.sideB },
    { label: "Final", a: bracket.finalistKid || { emoji: "❓", name: "Winner SF1" },
      b: bracket.finalistOpp || { emoji: "❓", name: "Winner SF2" } },
  ];
  return (
    <div className="tourney-bracket">
      {slots.map((s, i) => (
        <div key={s.label} className={`tourney-bracket-round${highlight === i ? " active" : ""}`}>
          <div className="tourney-bracket-label">{s.label}</div>
          <div className="tourney-bracket-pair">
            <span>{s.a.emoji} {s.a.name}</span>
            <em>vs</em>
            <span>{s.b.emoji} {s.b.name}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Main tournament view (unlocked) ─────────────────────────────────────────
// phase: lobby | semi | side-result | final | done
function TournamentView({ unlocked, remainingG, kidName, stats, playedToday, onMarkPlayed, onRecordResult, onGoHome, playSound }) {
  const [phase, setPhase] = useState("lobby");
  const [bracket, setBracket] = useState(null);
  const [placement, setPlacement] = useState(null); // champion | runner-up | participant
  const [awardModal, setAwardModal] = useState(null);
  const [sideStory, setSideStory] = useState(null);

  const awardsEarned = new Set((stats.awards || []).map((a) => a.id));
  const wins = stats.wins || 0;

  // Starting counts as today's attempt (finish or abandon mid-bracket still burns the day).
  const startTournament = () => {
    if (playedToday) return;
    if (typeof onMarkPlayed === "function") onMarkPlayed();
    const picked = pickOpponents();
    setBracket({
      kidOpp: picked.kidOpp,
      sideA: picked.sideA,
      sideB: picked.sideB,
      finalistKid: null,
      finalistOpp: null,
      sideWinner: null,
    });
    setPlacement(null);
    setAwardModal(null);
    setSideStory(null);
    setPhase("semi");
  };

  const finishWith = (place) => {
    setPlacement(place);
    const award = awardById(place);
    const result = onRecordResult(place);
    setAwardModal({ award, placement: place, newlyGranted: result.newlyGranted });
    setPhase("done");
  };

  const onSemiDone = (kidWon) => {
    if (!kidWon) {
      finishWith("participant");
      return;
    }
    // Auto-resolve the other semifinal for flavor
    const aWins = Math.random() < 0.5;
    const sideWinner = aWins ? bracket.sideA : bracket.sideB;
    const sideLoser = aWins ? bracket.sideB : bracket.sideA;
    setSideStory({ winner: sideWinner, loser: sideLoser });
    setBracket((b) => ({
      ...b,
      finalistKid: { emoji: "💪", name: kidName || "You" },
      finalistOpp: sideWinner,
      sideWinner,
    }));
    setPhase("side-result");
  };

  const onFinalDone = (kidWon) => {
    finishWith(kidWon ? "champion" : "runner-up");
  };

  if (!unlocked) {
    return (
      <main className="tourney-view">
        <TournamentLocked remainingG={remainingG} compact onGoHome={onGoHome} />
      </main>
    );
  }

  return (
    <main className="tourney-view">
      <div className="coll-h">
        <h3>Mighty Tournament 🏟️</h3>
        <span className="coll-count">{wins} championship{wins === 1 ? "" : "s"}</span>
      </div>

      {phase === "lobby" && (
        <>
          <p className="tourney-intro">
            Buddy's protein-powered arena is open! Beat two opponents in a Flex / Jump / Spin
            showdown to take the championship.
          </p>
          <BracketBoard kidName={kidName} bracket={{
            kidOpp: { emoji: "❓", name: "Mystery foe" },
            sideA: { emoji: "❓", name: "Foe A" },
            sideB: { emoji: "❓", name: "Foe B" },
            finalistKid: null,
            finalistOpp: null,
          }} highlight={-1} />

          {playedToday ? (
            <div className="tourney-daily-gate" role="status">
              <span className="tourney-daily-emoji" aria-hidden="true">😴🏟️</span>
              <p className="tourney-daily-msg">
                You already battled today! Come back tomorrow for another tournament.
              </p>
              <button type="button" className="add-food-cta tourney-start-btn" disabled>
                Already played today
              </button>
            </div>
          ) : (
            <button type="button" className="add-food-cta tourney-start-btn" onClick={startTournament}>
              Start Tournament! 🥊
            </button>
          )}

          <div className="tourney-awards">
            <h4 className="tourney-awards-title">Awards</h4>
            <div className="tourney-awards-grid">
              {TOURNAMENT_AWARDS.map((a) => {
                const earned = awardsEarned.has(a.id);
                return (
                  <div key={a.id} className={`tourney-award-cell${earned ? " earned" : ""}`}
                    title={earned ? a.blurb : "Not earned yet"}>
                    <span className="tourney-award-emoji">{earned ? a.emoji : "❓"}</span>
                    <span className="tourney-award-name">{earned ? a.name : "Locked"}</span>
                    <span className="tourney-award-blurb">{earned ? a.blurb : "Play to unlock"}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      {phase === "semi" && bracket && (
        <>
          <BracketBoard kidName={kidName} bracket={bracket} highlight={0} />
          <MatchArena kidName={kidName} opponent={bracket.kidOpp}
            roundLabel="Semifinal" onDone={onSemiDone} />
        </>
      )}

      {phase === "side-result" && sideStory && (
        <div className="tourney-side-result">
          <BracketBoard kidName={kidName} bracket={bracket} highlight={1} />
          <div className="tourney-side-card">
            <div className="tourney-side-emoji">{sideStory.winner.emoji}</div>
            <h3 className="name-prompt-title">{sideStory.winner.name} wins!</h3>
            <p className="celebrate-sub">
              They beat {sideStory.loser.emoji} {sideStory.loser.name} and await you in the final.
            </p>
            <button className="prize-close" onClick={() => setPhase("final")}>
              Enter the Final! 🏆
            </button>
          </div>
        </div>
      )}

      {phase === "final" && bracket && (
        <>
          <BracketBoard kidName={kidName} bracket={bracket} highlight={2} />
          <MatchArena kidName={kidName} opponent={bracket.finalistOpp}
            roundLabel="Championship Final" onDone={onFinalDone} />
        </>
      )}

      {phase === "done" && (
        <div className="tourney-done">
          <BracketBoard kidName={kidName} bracket={bracket} highlight={2} />
          <p className="tourney-done-msg">
            {placement === "champion" && "You are the Mighty Champion! 💪"}
            {placement === "runner-up" && "Runner-up — awesome fight!"}
            {placement === "participant" && "Participation earned — great effort!"}
          </p>
          <div className="tourney-daily-gate" role="status">
            <p className="tourney-daily-msg">
              That's your tournament for today — come back tomorrow to play again!
            </p>
            <button type="button" className="add-food-cta tourney-start-btn" disabled>
              Come back tomorrow 🌅
            </button>
          </div>
          <button type="button" className="tourney-secondary-btn" onClick={() => setPhase("lobby")}>
            Back to lobby
          </button>
        </div>
      )}

      {awardModal && (
        <AwardModal
          award={awardModal.award}
          placement={awardModal.placement}
          kidName={kidName}
          playSound={playSound}
          onClose={() => setAwardModal(null)}
        />
      )}
    </main>
  );
}

// Home-page entry / teaser card
function TournamentHomeCard({ unlocked, remainingG, wins, playedToday, onOpen }) {
  if (!unlocked) {
    return (
      <button type="button" className="tourney-home-card locked" onClick={onOpen}>
        <span className="tourney-home-emoji">🔒🏟️</span>
        <span className="tourney-home-text">
          <b>Tournament locked</b>
          <em>{remainingG > 0 ? `${remainingG}g protein to unlock` : "Hit today's goal to unlock"}</em>
        </span>
      </button>
    );
  }
  if (playedToday) {
    return (
      <button type="button" className="tourney-home-card done-today" onClick={onOpen}>
        <span className="tourney-home-emoji">😴🏟️</span>
        <span className="tourney-home-text">
          <b>Tournament done for today</b>
          <em>{wins > 0 ? `${wins} championship${wins === 1 ? "" : "s"} · Come back tomorrow!` : "Come back tomorrow for another go!"}</em>
        </span>
        <span className="tourney-home-go">See →</span>
      </button>
    );
  }
  return (
    <button type="button" className="tourney-home-card open" onClick={onOpen}>
      <span className="tourney-home-emoji">🏟️</span>
      <span className="tourney-home-text">
        <b>Tournament unlocked!</b>
        <em>{wins > 0 ? `${wins} championship${wins === 1 ? "" : "s"} · Play now` : "Enter Buddy's arena!"}</em>
      </span>
      <span className="tourney-home-go">Play →</span>
    </button>
  );
}

Object.assign(window, {
  TournamentView,
  TournamentHomeCard,
  TournamentLocked,
  TOURNAMENT_AWARDS,
  TOURNAMENT_OPPONENTS,
});
