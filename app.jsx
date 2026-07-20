// Mighty Bites — main app.
// A kid tries healthy foods and tracks protein. Foods are logged as *pending*
// until a parent confirms the amount with a PIN. Confirmed protein powers up
// Buddy the mascot; hitting the daily goal makes Buddy a muscular weightlifter.
// First time a food is confirmed, a treasure is unlocked. All local, PWA.

const { useState, useEffect, useRef, useMemo, useCallback } = React;

// ── Sound effects (Web Audio API, synthesized — no asset files) ─────────────
let _audioCtx = null;
function playSound(type) {
  try {
    if (!_audioCtx) _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const ctx = _audioCtx;
    if (ctx.state === "suspended") ctx.resume();
    const now = ctx.currentTime;
    const tone = (freq, start, dur, vol, shape = "sine") => {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.connect(g); g.connect(ctx.destination);
      osc.type = shape;
      osc.frequency.setValueAtTime(freq, now + start);
      g.gain.setValueAtTime(vol, now + start);
      g.gain.exponentialRampToValueAtTime(0.001, now + start + dur);
      osc.start(now + start); osc.stop(now + start + dur + 0.02);
    };
    switch (type) {
      case "log":
        tone(660, 0, 0.09, 0.18, "triangle");
        break;
      case "confirm":
        tone(523, 0, 0.12, 0.22, "sine");
        tone(784, 0.09, 0.16, 0.22, "sine");
        break;
      case "treasure":
        [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.11, 0.24, 0.25, "sine"));
        break;
      case "goal":
        tone(70, 0, 0.5, 0.4, "sawtooth");
        [392, 523, 659, 784, 1047].forEach((f, i) => tone(f, 0.06 + i * 0.11, 0.3, 0.28, "sine"));
        break;
    }
  } catch {}
}

// ── Storage + date helpers ──────────────────────────────────────────────────
const STORAGE_KEY = "mighty.v1";
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const round1 = (n) => Math.round(n * 10) / 10;

const dateToKey = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const todayKey = () => dateToKey(new Date());
const keyToDate = (k) => { const [y, m, d] = k.split("-").map(Number); return new Date(y, m - 1, d); };
const addDays = (k, n) => { const d = keyToDate(k); d.setDate(d.getDate() + n); return dateToKey(d); };
const formatDay = (k) => {
  const d = keyToDate(k), today = todayKey(), yest = addDays(today, -1);
  if (k === today) return `Today · ${d.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}`;
  if (k === yest) return `Yesterday · ${d.toLocaleDateString(undefined, { month: "long", day: "numeric" })}`;
  return d.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });
};

const loadState = () => { try { const r = localStorage.getItem(STORAGE_KEY); if (r) return JSON.parse(r); } catch {} return null; };
const saveState = (s) => { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); } catch {} };

// ── Confetti burst (goal celebration) ───────────────────────────────────────
function Confetti() {
  const pieces = useMemo(() => Array.from({ length: 60 }, (_, i) => ({
    left: Math.random() * 100,
    delay: Math.random() * 0.6,
    dur: 1.8 + Math.random() * 1.6,
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

// ── Treasure reveal modal ───────────────────────────────────────────────────
function RevealModal({ treasure, food, onClose }) {
  const [stage, setStage] = useState("chest");
  useEffect(() => {
    const t1 = setTimeout(() => setStage("opening"), 800);
    const t2 = setTimeout(() => setStage("reveal"), 1600);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);
  const tint = TREASURE_TINTS[treasure.rarity];
  return (
    <div className="reveal-backdrop" onClick={onClose}>
      <div className="reveal-card" onClick={(e) => e.stopPropagation()}>
        {stage !== "reveal" && (
          <>
            <div className="reveal-newfood">You tried {food.emoji} <b>{food.name}</b>!</div>
            <div className={`chest ${stage === "opening" ? "open" : ""}`}>
              <div className="chest-lid" /><div className="chest-base" />
              <div className="chest-band" /><div className="chest-lock" /><div className="chest-glow" />
            </div>
            <div className="chest-caption">Opening your treasure…</div>
          </>
        )}
        {stage === "reveal" && (
          <div className="prize" style={{ "--prize-bg": tint.bg, "--prize-ring": tint.ring }}>
            <div className="prize-rays" />
            <div className="prize-disc"><span className="prize-emoji">{treasure.emoji}</span></div>
            <div className="prize-rarity" style={{ color: tint.ring }}>★ {tint.label}</div>
            <div className="prize-name">{treasure.name}</div>
            <div className="prize-sub">Unlocked by trying {food.emoji} {food.name}</div>
            <button className="prize-close" onClick={onClose}>Awesome! 🎉</button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Goal celebration modal ──────────────────────────────────────────────────
function GoalCelebration({ kidName, grams, onClose }) {
  useEffect(() => { playSound("goal"); }, []);
  return (
    <div className="reveal-backdrop" onClick={onClose}>
      <Confetti />
      <div className="reveal-card celebrate-card" onClick={(e) => e.stopPropagation()}>
        <div className="celebrate-hero">🏋️</div>
        <h2 className="name-prompt-title">You did it{kidName ? `, ${kidName}` : ""}!</h2>
        <p className="celebrate-sub">Buddy got all <b>{Math.round(grams)}g</b> of protein and is
          <b> MIGHTY STRONG</b> — lifting heavy weights! 💪</p>
        <button className="prize-close" onClick={onClose}>Yeah! 🎉</button>
      </div>
    </div>
  );
}

// ── Onboarding: name ────────────────────────────────────────────────────────
function NamePrompt({ onSave }) {
  const [name, setName] = useState("");
  return (
    <div className="reveal-backdrop">
      <div className="reveal-card name-prompt-card">
        <div className="name-prompt-emoji">💪</div>
        <h2 className="name-prompt-title">Welcome to Mighty Bites!</h2>
        <p className="name-prompt-sub">What's your name?</p>
        <form onSubmit={(e) => { e.preventDefault(); onSave(name.trim() || "Champ"); }}>
          <input className="name-prompt-input" type="text" placeholder="Your name" value={name}
            onChange={(e) => setName(e.target.value)} autoFocus maxLength={30} />
          <button type="submit" className="prize-close">Let's go! 🚀</button>
        </form>
      </div>
    </div>
  );
}

// ── Onboarding: parent PIN ──────────────────────────────────────────────────
function PinSetupPrompt({ onSave }) {
  const [pin, setPin] = useState(""); const [confirmPin, setConfirmPin] = useState("");
  const [error, setError] = useState(""); const confirmRef = useRef(null);
  const attempt = (a, b) => { if (a !== b) { setError("PINs don't match — try again."); setPin(""); setConfirmPin(""); return; } onSave(a); };
  return (
    <div className="reveal-backdrop">
      <div className="reveal-card name-prompt-card">
        <div className="name-prompt-emoji">🔒</div>
        <h2 className="name-prompt-title">Set a Parent PIN</h2>
        <p className="name-prompt-sub">A grown-up sets this. It's needed to confirm foods and change the goal.</p>
        <form onSubmit={(e) => { e.preventDefault(); if (pin.length === 4 && confirmPin.length === 4) attempt(pin, confirmPin); }}>
          <input className="name-prompt-input" type="password" inputMode="numeric" pattern="[0-9]*"
            placeholder="Create a 4-digit PIN" value={pin} autoFocus maxLength={4}
            onChange={(e) => { const v = e.target.value.replace(/\D/g, "").slice(0, 4); setPin(v); setError(""); if (v.length === 4) confirmRef.current?.focus(); }} />
          <input ref={confirmRef} className="name-prompt-input" type="password" inputMode="numeric" pattern="[0-9]*"
            placeholder="Confirm PIN" value={confirmPin} maxLength={4}
            onChange={(e) => { const v = e.target.value.replace(/\D/g, "").slice(0, 4); setConfirmPin(v); setError(""); if (v.length === 4) attempt(pin, v); }} />
          {error && <p className="pin-error">{error}</p>}
          <button type="submit" className="prize-close">Save PIN</button>
        </form>
      </div>
    </div>
  );
}

// ── Parent PIN entry gate ───────────────────────────────────────────────────
function PinPrompt({ title, subtitle, expectedPin, onSuccess, onCancel }) {
  const [pin, setPin] = useState(""); const [error, setError] = useState(false);
  const attempt = (v) => { if (v === expectedPin) onSuccess(); else { setError(true); setPin(""); } };
  return (
    <div className="reveal-backdrop" onClick={onCancel}>
      <div className="reveal-card name-prompt-card" onClick={(e) => e.stopPropagation()}>
        <div className="name-prompt-emoji">🔒</div>
        <h2 className="name-prompt-title">{title}</h2>
        {subtitle && <p className="name-prompt-sub">{subtitle}</p>}
        <form onSubmit={(e) => { e.preventDefault(); if (pin.length === 4) attempt(pin); }}>
          <input className="name-prompt-input" type="password" inputMode="numeric" pattern="[0-9]*"
            placeholder="Enter 4-digit PIN" value={pin} autoFocus maxLength={4}
            onChange={(e) => { const v = e.target.value.replace(/\D/g, "").slice(0, 4); setPin(v); setError(false); if (v.length === 4) attempt(v); }} />
          {error && <p className="pin-error">Wrong PIN — try again.</p>}
          <button type="submit" className="prize-close">Unlock</button>
          <button type="button" className="pin-cancel" onClick={onCancel}>Cancel</button>
        </form>
      </div>
    </div>
  );
}

// ── Serving-size confirm sheet (parent adjusts amount eaten) ─────────────────
function ServingSheet({ entry, onConfirm, onCancel }) {
  const food = getFood(entry.foodId);
  const [servings, setServings] = useState(entry.servings || 1);
  // Kids rarely eat a whole serving, so a grown-up can also type the grams
  // straight in. A non-null `manualG` overrides the serving math entirely.
  const [manualG, setManualG] = useState(null);

  const stepProtein = round1(food.protein * servings);
  const manualNum = manualG === null ? null : parseFloat(manualG);
  const manualValid = manualNum !== null && isFinite(manualNum) && manualNum >= 0 && manualNum <= 200;
  const protein = manualValid ? round1(manualNum) : stepProtein;
  // Keep `servings` meaningful for the log row; zero-protein foods can't be inverted.
  const finalServings = manualValid
    ? (food.protein > 0 ? round1(protein / food.protein) : servings)
    : servings;

  const step = (d) => {
    setManualG(null);
    // round2, not round1 — quarter steps need two decimals to stay exact.
    setServings((s) => Math.max(0.25, Math.min(12, Math.round((s + d) * 100) / 100)));
  };
  const canConfirm = manualG === null || manualValid;

  return (
    <div className="reveal-backdrop" onClick={onCancel}>
      <div className="reveal-card serving-card" onClick={(e) => e.stopPropagation()}>
        <div className="serving-emoji">{food.emoji}</div>
        <h2 className="name-prompt-title">{food.name}</h2>
        <p className="name-prompt-sub">How much did they actually eat?<br /><em>1 serving = {food.serving} · {food.protein}g</em></p>
        <div className="serving-stepper">
          <button className="step-btn" onClick={() => step(-0.25)} aria-label="Less">−</button>
          <div className="serving-value"><b>{servings}</b><span>serving{servings === 1 ? "" : "s"}</span></div>
          <button className="step-btn" onClick={() => step(0.25)} aria-label="More">+</button>
        </div>
        <div className="serving-manual">
          <label htmlFor="manual-g">Or type exact protein</label>
          <div className="serving-manual-row">
            <input id="manual-g" className="serving-manual-input" type="text" inputMode="decimal"
              placeholder={String(stepProtein)} value={manualG === null ? "" : manualG}
              onChange={(e) => {
                const v = e.target.value.replace(/[^\d.]/g, "").slice(0, 5);
                setManualG(v === "" ? null : v);
              }} />
            <span className="serving-manual-unit">g</span>
            {manualG !== null && (
              <button type="button" className="serving-manual-clear" onClick={() => setManualG(null)}>use servings</button>
            )}
          </div>
          {manualG !== null && !manualValid && <p className="pin-error">Enter grams between 0 and 200.</p>}
        </div>
        <div className="serving-protein">= <b>{canConfirm ? protein : "—"}g</b> protein 💪</div>
        <button className="prize-close" disabled={!canConfirm}
          onClick={() => canConfirm && onConfirm(entry.id, finalServings, protein)}>Confirm ✓</button>
        <button type="button" className="pin-cancel" onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
}

// ── Food card (Explorer) ────────────────────────────────────────────────────
function FoodCard({ food, tried, onAdd }) {
  const catColor = { protein: "#E8571E", carb: "#2FA45C", fat: "#7A4FE0" };
  return (
    <button className={`food-card${tried ? " tried" : ""}`} onClick={() => onAdd(food)}
      title={`${food.name} · ${food.protein}g protein per ${food.serving}`}>
      {tried && <span className="food-check">✓</span>}
      {!tried && <span className="food-new">NEW</span>}
      <span className="food-emoji">{food.emoji}</span>
      <span className="food-name">{food.name}</span>
      <span className="food-protein">{food.protein}g</span>
      <span className="food-serving">per {food.serving}</span>
      <span className="food-tags">
        {food.categories.map((c) => <i key={c} style={{ background: catColor[c] }} title={c} />)}
      </span>
    </button>
  );
}

// ── Protein meter ───────────────────────────────────────────────────────────
function Meter({ grams, goal, theme, reached }) {
  const pct = Math.max(0, Math.min(1, goal > 0 ? grams / goal : 0));
  return (
    <div className={`meter${reached ? " reached" : ""}`}>
      <div className="meter-track">
        <div className="meter-fill" style={{ width: `${pct * 100}%`, background: theme.meter }} />
      </div>
      <div className="meter-label">
        <b>{Math.round(grams)}g</b> <span>of {goal}g protein</span>
      </div>
    </div>
  );
}

// ── Themes ──────────────────────────────────────────────────────────────────
const THEMES = {
  power:  { bg1: "#FFE1C4", bg2: "#FFF4E8", accent: "#FF6F3C", chip: "#E85D1C",
            meter: "linear-gradient(180deg,#FFC46B 0%,#FF6F3C 100%)" },
  forest: { bg1: "#C9EEC2", bg2: "#EFFAEC", accent: "#34B36A", chip: "#1E9E56",
            meter: "linear-gradient(180deg,#7FD98A 0%,#2FA45C 100%)" },
  berry:  { bg1: "#E7D4FF", bg2: "#F5EEFF", accent: "#8A5CF0", chip: "#6C3FD0",
            meter: "linear-gradient(180deg,#B08CF5 0%,#7A4FE0 100%)" },
};

const TWEAK_DEFAULTS = { kidName: "", parentPin: "", dailyGoal: 40, theme: "power" };

// ── Main app ────────────────────────────────────────────────────────────────
function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const theme = THEMES[t.theme] || THEMES.power;

  const today = todayKey();
  const [viewedDay, setViewedDay] = useState(today);
  const [days, setDays] = useState({});
  const [triedFoods, setTriedFoods] = useState({});
  const [treasures, setTreasures] = useState([]);

  const [view, setView] = useState("home");          // home | foods | treasures
  const [exploreCat, setExploreCat] = useState("protein");
  const [pinRequest, setPinRequest] = useState(null);
  const [confirmEntry, setConfirmEntry] = useState(null);
  const [reveal, setReveal] = useState(null);         // { treasure, food }
  const [celebrate, setCelebrate] = useState(false);
  const [goalUnlocked, setGoalUnlocked] = useState(false);
  const [toast, setToast] = useState(null);

  // Hydrate once, then persist on every change. `hydrated` gates the save so the
  // empty initial state can never overwrite real saved data on mount.
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    const s = loadState();
    if (s?.days) setDays(s.days);
    if (s?.triedFoods) setTriedFoods(s.triedFoods);
    if (s?.treasures) setTreasures(s.treasures);
    setHydrated(true);
  }, []);
  useEffect(() => {
    if (!hydrated) return;
    saveState({ days, triedFoods, treasures });
  }, [hydrated, days, triedFoods, treasures]);

  const isToday = viewedDay === today;
  const dayData = days[viewedDay] || { log: [], goalCelebrated: false };
  const log = dayData.log || [];
  const confirmedProtein = log.filter((e) => e.confirmed).reduce((s, e) => s + e.protein, 0);
  const pendingEntries = log.filter((e) => !e.confirmed);
  const pct = t.dailyGoal > 0 ? confirmedProtein / t.dailyGoal : 0;
  const reachedGoal = t.dailyGoal > 0 && confirmedProtein >= t.dailyGoal;
  const triedCount = Object.keys(triedFoods).length;

  const patchDay = useCallback((k, patch) => {
    setDays((cur) => {
      const old = cur[k] || { log: [], goalCelebrated: false };
      const next = typeof patch === "function" ? patch(old) : patch;
      return { ...cur, [k]: { ...old, ...next } };
    });
  }, []);

  const showToast = useCallback((msg) => {
    setToast(msg);
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => setToast(null), 2600);
  }, []);

  // Add a pending food (kid action, no PIN — counts only once confirmed)
  const addPending = useCallback((food) => {
    if (viewedDay !== today) setViewedDay(today);
    const entry = { id: uid(), foodId: food.id, servings: 1, protein: food.protein, confirmed: false, ts: Date.now() };
    setDays((cur) => {
      const old = cur[today] || { log: [], goalCelebrated: false };
      return { ...cur, [today]: { ...old, log: [...old.log, entry] } };
    });
    playSound("log");
    showToast(`${food.emoji} ${food.name} added — ask a grown-up to confirm!`);
  }, [viewedDay, today, showToast]);

  // Remove a still-pending entry (mistake) — free for the kid
  const removePending = useCallback((entryId) => {
    setDays((cur) => {
      const old = cur[today] || { log: [] };
      return { ...cur, [today]: { ...old, log: old.log.filter((e) => e.id !== entryId) } };
    });
  }, [today]);

  // Parent confirms a pending food: PIN → serving sheet
  const requestConfirm = useCallback((entry) => {
    setPinRequest({
      title: "Grown-up check",
      subtitle: `Confirm what ${t.kidName || "your kid"} ate`,
      onSuccess: () => { setPinRequest(null); setConfirmEntry(entry); },
    });
  }, [t.kidName]);

  const finalizeConfirm = useCallback((entryId, servings, protein) => {
    const dd = days[today] || { log: [] };
    const entry = dd.log.find((e) => e.id === entryId);
    setConfirmEntry(null);
    if (!entry) return;
    const food = getFood(entry.foodId);
    const isNew = !triedFoods[entry.foodId];
    setDays((cur) => {
      const old = cur[today] || { log: [] };
      return { ...cur, [today]: { ...old, log: old.log.map((e) => e.id === entryId ? { ...e, confirmed: true, servings, protein } : e) } };
    });
    if (isNew) {
      const tr = drawTreasure();
      setTriedFoods((cur) => ({ ...cur, [entry.foodId]: { firstTriedKey: today } }));
      setTreasures((cur) => [{ uid: uid(), foodId: entry.foodId, foodName: food.name, foodEmoji: food.emoji, day: today, ...tr }, ...cur]);
      setReveal({ treasure: tr, food });
      playSound("treasure");
    } else {
      playSound("confirm");
    }
  }, [days, today, triedFoods]);

  // Fire the goal celebration once, when today's confirmed protein crosses the goal
  useEffect(() => {
    if (isToday && reachedGoal && !dayData.goalCelebrated) {
      patchDay(today, { goalCelebrated: true });
      setCelebrate(true);
    }
  }, [isToday, reachedGoal, dayData.goalCelebrated, today, patchDay]);

  const requestGoalUnlock = useCallback(() => {
    setPinRequest({
      title: "Enter Parent PIN", subtitle: "Confirm to change the daily goal",
      onSuccess: () => { setGoalUnlocked(true); setPinRequest(null); },
    });
  }, []);

  const resetToday = () => patchDay(today, { log: [], goalCelebrated: false });

  const openSettings = () => window.postMessage({ type: "__activate_edit_mode" }, "*");

  const goPrev = () => setViewedDay((k) => addDays(k, -1));
  const goNext = () => { if (viewedDay < today) setViewedDay((k) => addDays(k, +1)); };
  const goToday = () => setViewedDay(today);

  return (
    <div className="app" style={{ "--bg-1": theme.bg1, "--bg-2": theme.bg2, "--accent": theme.accent, "--chip": theme.chip }}>
      {!t.kidName && <NamePrompt onSave={(name) => setTweak("kidName", name)} />}
      {t.kidName && !t.parentPin && <PinSetupPrompt onSave={(pin) => setTweak("parentPin", pin)} />}

      <div className="bg-blobs" aria-hidden="true"><span className="blob b1" /><span className="blob b2" /><span className="blob b3" /></div>

      <header className="hdr">
        <div className="hdr-greet">
          <div className="hdr-hi">Hi, {t.kidName || "there"}! 💪</div>
          {view === "home" && (
            <div className="hdr-daynav">
              <button className="day-arrow" onClick={goPrev} aria-label="Previous day">‹</button>
              <div className="hdr-date">{formatDay(viewedDay)}</div>
              <button className="day-arrow" onClick={goNext} aria-label="Next day" disabled={viewedDay >= today}>›</button>
              {!isToday && <button className="day-today" onClick={goToday}>Jump to today</button>}
            </div>
          )}
        </div>
        <div className="hdr-right">
          <div className="hdr-top-row">
            <div className="theme-picker" role="group" aria-label="Pick a theme">
              <button className={`th-opt ${t.theme === "power" ? "active" : ""}`} onClick={() => setTweak("theme", "power")}><span className="th-dot th-power" />Power</button>
              <button className={`th-opt ${t.theme === "forest" ? "active" : ""}`} onClick={() => setTweak("theme", "forest")}><span className="th-dot th-forest" />Forest</button>
              <button className={`th-opt ${t.theme === "berry" ? "active" : ""}`} onClick={() => setTweak("theme", "berry")}><span className="th-dot th-berry" />Berry</button>
            </div>
            <button className="settings-btn" onClick={openSettings} aria-label="Open settings" title="Settings">⚙️</button>
          </div>
          <div className="hdr-streak">
            <span className="streak-flame">🍽️</span>
            <div><b>{triedCount}</b><em>food{triedCount === 1 ? "" : "s"} tried</em></div>
          </div>
        </div>
      </header>

      <nav className="tabs" role="tablist">
        <button className={`tab ${view === "home" ? "active" : ""}`} onClick={() => setView("home")}>🏠 Home</button>
        <button className={`tab ${view === "foods" ? "active" : ""}`} onClick={() => setView("foods")}>🍎 Food Explorer</button>
        <button className={`tab ${view === "treasures" ? "active" : ""}`} onClick={() => setView("treasures")}>💎 Treasures</button>
      </nav>

      {/* ── HOME ─────────────────────────────────────────────────────────── */}
      {view === "home" && (
        <main className="main">
          <section className="left-col">
            <Buddy pct={pct} grams={confirmedProtein} goal={t.dailyGoal} />
            <Meter grams={confirmedProtein} goal={t.dailyGoal} theme={theme} reached={reachedGoal} />
            {reachedGoal ? (
              <div className="encourage win"><b>Goal smashed!</b> Buddy is mighty strong today. 🏆</div>
            ) : isToday ? (
              <div className="encourage"><b>{Math.max(0, Math.ceil(t.dailyGoal - confirmedProtein))}g</b> more protein to power up Buddy!</div>
            ) : (
              <div className="encourage past">That day reached <b>{Math.round(confirmedProtein)} of {t.dailyGoal}g</b>.</div>
            )}
            <button className="add-food-cta" onClick={() => setView("foods")}>＋ Add a food</button>
          </section>

          <section className="right-col">
            <h3 className="col-h">{isToday ? "Today's foods" : "Foods that day"}</h3>

            {pendingEntries.length > 0 && isToday && (
              <div className="pending-banner">
                <span>👀</span>
                <div><b>{pendingEntries.length} waiting for a grown-up</b><em>Tap ✓ to confirm the amount eaten.</em></div>
              </div>
            )}

            <div className="log-card">
              {log.length === 0 ? (
                <div className="log-empty">{isToday ? "No foods yet — tap “Add a food”! 🍎" : "Nothing was logged that day."}</div>
              ) : (
                <ul className="log-list">
                  {[...log].reverse().map((e) => {
                    const food = getFood(e.foodId);
                    return (
                      <li key={e.id} className={`log-row${e.confirmed ? "" : " pending"}`}>
                        <span className="log-emoji">{food.emoji}</span>
                        <span className="log-name">{food.name}
                          {e.confirmed && <em className="log-serv"> · {e.servings} serving{e.servings === 1 ? "" : "s"}</em>}
                        </span>
                        {e.confirmed ? (
                          <span className="log-g">+{round1(e.protein)}g</span>
                        ) : isToday ? (
                          <span className="log-actions">
                            <button className="log-confirm" onClick={() => requestConfirm(e)}>✓ Confirm</button>
                            <button className="log-remove" onClick={() => removePending(e.id)} aria-label="Remove">✕</button>
                          </span>
                        ) : (
                          <span className="log-g muted">unconfirmed</span>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </section>
        </main>
      )}

      {/* ── FOOD EXPLORER ────────────────────────────────────────────────── */}
      {view === "foods" && (
        <main className="explorer">
          <div className="explore-intro">
            <h3 className="col-h">Try a new food to unlock a treasure! 💎</h3>
            <div className="explore-progress">{triedCount} / {FOODS.length} foods discovered</div>
          </div>
          <div className="cat-tabs">
            {FOOD_CATEGORIES.map((c) => (
              <button key={c.key} className={`cat-tab ${exploreCat === c.key ? "active" : ""}`} onClick={() => setExploreCat(c.key)}>
                <span className="cat-emoji">{c.emoji}</span>
                <span className="cat-label">{c.label}</span>
                <span className="cat-blurb">{c.blurb}</span>
              </button>
            ))}
          </div>
          <div className="food-grid">
            {foodsByCategory(exploreCat).map((f) => (
              <FoodCard key={f.id} food={f} tried={!!triedFoods[f.id]} onAdd={addPending} />
            ))}
          </div>
        </main>
      )}

      {/* ── TREASURES ────────────────────────────────────────────────────── */}
      {view === "treasures" && (
        <main className="treasures-view">
          <div className="coll-h">
            <h3>My Treasures</h3>
            <span className="coll-count">{treasures.length} collected</span>
          </div>
          {treasures.length === 0 ? (
            <div className="coll-grid">
              {Array.from({ length: 8 }).map((_, i) => <div key={i} className="coll-cell empty">?</div>)}
              <div className="coll-hint">Try new foods in the Food Explorer to fill this up!</div>
            </div>
          ) : (
            <div className="coll-grid">
              {treasures.map((c) => {
                const tint = TREASURE_TINTS[c.rarity];
                return (
                  <div key={c.uid} className="coll-cell" style={{ "--cell-bg": tint.bg, "--cell-ring": tint.ring }}
                    title={`${c.name} · ${tint.label} · from ${c.foodName}`}>
                    <span className="coll-emoji">{c.emoji}</span>
                    <span className="coll-name">{c.name}</span>
                    <span className="coll-via">{c.foodEmoji} {c.foodName}</span>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      )}

      {toast && <div className="toast">{toast}</div>}

      {reveal && <RevealModal treasure={reveal.treasure} food={reveal.food} onClose={() => setReveal(null)} />}
      {celebrate && !reveal && <GoalCelebration kidName={t.kidName} grams={confirmedProtein} onClose={() => setCelebrate(false)} />}

      {confirmEntry && <ServingSheet entry={confirmEntry} onConfirm={finalizeConfirm} onCancel={() => setConfirmEntry(null)} />}

      {pinRequest && (
        <PinPrompt title={pinRequest.title} subtitle={pinRequest.subtitle}
          expectedPin={t.parentPin} onSuccess={pinRequest.onSuccess} onCancel={() => setPinRequest(null)} />
      )}

      <TweaksPanel title="Settings" onClose={() => setGoalUnlocked(false)}>
        <TweakSection label="Profile" />
        <TweakText label="Name" value={t.kidName} placeholder="Your name" onChange={(v) => setTweak("kidName", v)} />
        {goalUnlocked ? (
          <TweakSlider label="Daily protein goal" value={t.dailyGoal} min={10} max={100} step={5} unit=" g"
            onChange={(v) => setTweak("dailyGoal", v)} />
        ) : (
          <div className="twk-row">
            <div className="twk-lbl"><span>Daily protein goal</span><span className="twk-val">{t.dailyGoal} g</span></div>
            <button type="button" className="twk-btn secondary" onClick={requestGoalUnlock}>🔒 Unlock to change</button>
          </div>
        )}
        <TweakSection label="Reset" />
        <TweakButton label="Reset today" onClick={resetToday} secondary />
      </TweaksPanel>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
