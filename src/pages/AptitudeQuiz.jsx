import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  Sparkles, Zap, Rocket, Timer, Trophy, Share2, RefreshCw,
  CalendarCheck, CheckCircle2, XCircle, ArrowRight, Brain,
} from "lucide-react";
import { AppLayout } from "@/components/shared/AppLayout";
import { Seo } from "@/components/shared/Seo";
import { useEnrollModal } from "@/contexts/EnrollModalContext";
import { SITE_URL, whatsappShareLink } from "@/config/site";

const TOTAL_QUESTIONS = 10;

const LEVELS = {
  easy: { label: "Easy", blurb: "Addition & subtraction", seconds: 15, icon: Sparkles, color: "#22c55e" },
  medium: { label: "Medium", blurb: "Add, subtract & tables", seconds: 15, icon: Zap, color: "#C9A24B" },
  hard: { label: "Hard", blurb: "Multiply & divide", seconds: 20, icon: Rocket, color: "#0E2A47" },
};

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function makeQuestion(difficulty) {
  let a, b, op, answer;
  if (difficulty === "easy") {
    op = Math.random() < 0.5 ? "+" : "−";
    a = randInt(1, 20);
    b = randInt(1, 20);
    if (op === "−" && b > a) [a, b] = [b, a];
    answer = op === "+" ? a + b : a - b;
  } else if (difficulty === "medium") {
    const r = Math.random();
    if (r < 0.4) { op = "+"; a = randInt(10, 99); b = randInt(10, 99); answer = a + b; }
    else if (r < 0.7) { op = "−"; a = randInt(10, 99); b = randInt(1, a); answer = a - b; }
    else { op = "×"; a = randInt(2, 10); b = randInt(2, 10); answer = a * b; }
  } else {
    const r = Math.random();
    if (r < 0.35) { op = "×"; a = randInt(11, 29); b = randInt(2, 9); answer = a * b; }
    else if (r < 0.6) { op = "+"; a = randInt(50, 199); b = randInt(50, 199); answer = a + b; }
    else if (r < 0.8) { op = "−"; a = randInt(60, 199); b = randInt(10, a - 1); answer = a - b; }
    else { op = "÷"; b = randInt(2, 9); answer = randInt(2, 12); a = b * answer; }
  }
  return { text: `${a} ${op} ${b}`, answer };
}

function makeOptions(answer) {
  const opts = new Set([answer]);
  const spread = Math.max(3, Math.round(Math.abs(answer) * 0.2) + 2);
  while (opts.size < 4) {
    const delta = randInt(1, spread);
    let cand = answer + (Math.random() < 0.5 ? -delta : delta);
    if (cand < 0) cand = answer + delta;
    opts.add(cand);
  }
  return shuffle([...opts]);
}

function buildQuiz(difficulty) {
  return Array.from({ length: TOTAL_QUESTIONS }, () => {
    const q = makeQuestion(difficulty);
    return { ...q, options: makeOptions(q.answer) };
  });
}

function getTier(score) {
  if (score >= 9) return { title: "Math Superstar", emoji: "⭐", note: "Incredible! Your child has a natural gift for numbers." };
  if (score >= 7) return { title: "Quick Thinker", emoji: "⚡", note: "Fantastic speed and accuracy — real potential here." };
  if (score >= 5) return { title: "Rising Talent", emoji: "🌱", note: "A solid foundation with lots of room to shine." };
  return { title: "Great Start", emoji: "🎯", note: "Every expert begins here — the right training makes all the difference." };
}

export function AptitudeQuiz() {
  const { openEnrollModal } = useEnrollModal();
  const [stage, setStage] = useState("intro"); // intro | playing | result
  const [difficulty, setDifficulty] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [index, setIndex] = useState(0);
  const [results, setResults] = useState([]);
  const [selected, setSelected] = useState(null);
  const [locked, setLocked] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const qStartRef = useRef(0);
  const submittingRef = useRef(false); // guards against double-submit (click + timeout)
  const advanceRef = useRef(null); // holds the pending "next question" timeout

  const perQuestion = difficulty ? LEVELS[difficulty].seconds : 15;
  const current = questions[index];

  const clearPendingAdvance = () => {
    if (advanceRef.current) {
      window.clearTimeout(advanceRef.current);
      advanceRef.current = null;
    }
  };

  const start = (diff) => {
    clearPendingAdvance();
    submittingRef.current = false;
    setDifficulty(diff);
    setQuestions(buildQuiz(diff));
    setIndex(0);
    setResults([]);
    setSelected(null);
    setLocked(false);
    setStage("playing");
  };

  const restart = () => {
    clearPendingAdvance();
    submittingRef.current = false;
    setStage("intro");
    setDifficulty(null);
    setQuestions([]);
    setIndex(0);
    setResults([]);
  };

  const finalizeAnswer = useCallback((option) => {
    if (submittingRef.current) return; // idempotent: only the first caller wins
    submittingRef.current = true;
    setLocked(true);
    setSelected(option);
    setResults((prev) => {
      const q = questions[index];
      const correct = option !== null && option === q.answer;
      const elapsed = Math.min((Date.now() - qStartRef.current) / 1000, perQuestion);
      return [...prev, { correct, elapsed }];
    });
    advanceRef.current = window.setTimeout(() => {
      advanceRef.current = null;
      if (index + 1 < TOTAL_QUESTIONS) setIndex((i) => i + 1);
      else setStage("result");
    }, 750);
  }, [index, questions, perQuestion]);

  // Clear any pending transition timer when the component unmounts.
  useEffect(() => clearPendingAdvance, []);

  // Per-question setup + countdown. Uses a local `remaining` counter (not the
  // timeLeft state) so the ticker never reads a stale 0 on the first render,
  // which previously auto-submitted the first question the instant a level
  // was selected.
  useEffect(() => {
    if (stage !== "playing") return;

    submittingRef.current = false;
    setSelected(null);
    setLocked(false);
    setTimeLeft(perQuestion);
    qStartRef.current = Date.now();

    let remaining = perQuestion;
    const id = window.setInterval(() => {
      if (submittingRef.current) return; // already answered; stop counting
      remaining -= 1;
      setTimeLeft(remaining);
      if (remaining <= 0) {
        window.clearInterval(id);
        finalizeAnswer(null);
      }
    }, 1000);

    return () => window.clearInterval(id);
  }, [index, stage, perQuestion, finalizeAnswer]);

  const score = results.filter((r) => r.correct).length;
  const avgTime = results.length
    ? results.reduce((s, r) => s + r.elapsed, 0) / results.length
    : 0;
  const tier = getTier(score);

  const shareText = `My child scored ${score}/10 on Rabbi Global Academy's Maths Speed Quiz! 🧮⚡ Test your child's maths speed too:`;
  const shareUrl = `${SITE_URL}/quiz`;

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: "Maths Speed Quiz", text: shareText, url: shareUrl });
        return;
      } catch { /* user cancelled — fall through to WhatsApp */ }
    }
    window.open(whatsappShareLink(`${shareText} ${shareUrl}`), "_blank", "noopener,noreferrer");
  };

  return (
    <AppLayout>
      <Seo
        title="Free Maths Speed Quiz for Kids"
        description="Take our free 2-minute Maths Speed Quiz and discover how fast your child solves mental maths. Get an instant result and book a free Abacus demo class."
        path="/quiz"
      />

      <section className="relative bg-primary overflow-hidden">
        <div className="absolute inset-0 opacity-[0.06]" style={{ backgroundImage: "radial-gradient(circle at 20% 30%, #fff 1px, transparent 1px)", backgroundSize: "28px 28px" }} />
        <div className="relative container mx-auto px-4 py-10 md:py-14 text-center text-white">
          <span className="inline-flex items-center gap-2 rounded-full bg-secondary/20 border border-secondary/40 px-4 py-1.5 text-sm font-semibold text-secondary">
            <Brain className="h-4 w-4" /> Free Interactive Quiz
          </span>
          <h1 className="mt-4 font-serif text-3xl md:text-5xl font-bold leading-tight">
            How Fast Is Your Child at Maths?
          </h1>
          <p className="mt-3 text-white/80 max-w-2xl mx-auto">
            A fun 2-minute maths speed challenge. Get an instant result — then see how Abacus training makes it even faster.
          </p>
        </div>
      </section>

      <section className="flex-1 bg-background">
        <div className="container mx-auto px-4 py-10 md:py-14 max-w-2xl">
          {stage === "intro" && (
            <IntroCard onStart={start} />
          )}

          {stage === "playing" && current && (
            <PlayingCard
              index={index}
              total={TOTAL_QUESTIONS}
              question={current}
              selected={selected}
              locked={locked}
              timeLeft={timeLeft}
              perQuestion={perQuestion}
              onAnswer={(opt) => !locked && finalizeAnswer(opt)}
            />
          )}

          {stage === "result" && (
            <ResultCard
              score={score}
              avgTime={avgTime}
              tier={tier}
              onBookDemo={() => openEnrollModal("demo")}
              onShare={handleShare}
              onRestart={restart}
            />
          )}
        </div>
      </section>
    </AppLayout>
  );
}

function IntroCard({ onStart }) {
  return (
    <div className="rounded-3xl border border-border bg-white shadow-xl p-6 md:p-8">
      <h2 className="text-xl md:text-2xl font-bold text-primary text-center">Pick a level to begin</h2>
      <p className="text-center text-muted-foreground text-sm mt-1">
        {TOTAL_QUESTIONS} quick questions · about 2 minutes · no sign-up needed
      </p>

      <div className="mt-6 grid gap-3">
        {Object.entries(LEVELS).map(([key, lvl]) => {
          const Icon = lvl.icon;
          return (
            <button
              key={key}
              onClick={() => onStart(key)}
              className="group flex items-center gap-4 rounded-2xl border border-border bg-background hover:border-secondary hover:bg-secondary/5 p-4 text-left transition-all duration-200 hover:shadow-md"
            >
              <span className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl text-white shadow" style={{ backgroundColor: lvl.color }}>
                <Icon className="h-6 w-6" />
              </span>
              <span className="flex-1">
                <span className="block font-bold text-primary">{lvl.label}</span>
                <span className="block text-sm text-muted-foreground">{lvl.blurb}</span>
              </span>
              <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-secondary group-hover:translate-x-1 transition-all" />
            </button>
          );
        })}
      </div>
    </div>
  );
}

function PlayingCard({ index, total, question, selected, locked, timeLeft, perQuestion, onAnswer }) {
  const progress = ((index) / total) * 100;
  const timePct = Math.max(0, (timeLeft / perQuestion) * 100);
  const lowTime = timeLeft <= 5;

  return (
    <div className="rounded-3xl border border-border bg-white shadow-xl p-6 md:p-8">
      {/* progress */}
      <div className="flex items-center justify-between text-sm font-semibold text-muted-foreground">
        <span>Question {index + 1} of {total}</span>
        <span className={`inline-flex items-center gap-1.5 ${lowTime ? "text-red-500" : "text-primary"}`}>
          <Timer className="h-4 w-4" /> {timeLeft}s
        </span>
      </div>
      <div className="mt-2 h-2 rounded-full bg-muted overflow-hidden">
        <div className="h-full bg-secondary transition-all duration-300" style={{ width: `${progress}%` }} />
      </div>

      {/* timer bar */}
      <div className="mt-1.5 h-1 rounded-full bg-muted overflow-hidden">
        <div className={`h-full transition-all duration-1000 ease-linear ${lowTime ? "bg-red-500" : "bg-primary/40"}`} style={{ width: `${timePct}%` }} />
      </div>

      {/* equation */}
      <div className="my-8 text-center">
        <p className="text-sm text-muted-foreground">What is</p>
        <p className="mt-1 font-serif text-4xl md:text-5xl font-bold text-primary tabular-nums">{question.text} = ?</p>
      </div>

      {/* options */}
      <div className="grid grid-cols-2 gap-3">
        {question.options.map((opt) => {
          const isCorrect = opt === question.answer;
          const isPicked = opt === selected;
          let cls = "border-border bg-background hover:border-primary hover:bg-primary/5 text-primary";
          if (locked) {
            if (isCorrect) cls = "border-green-500 bg-green-50 text-green-700";
            else if (isPicked) cls = "border-red-400 bg-red-50 text-red-600";
            else cls = "border-border bg-background text-muted-foreground opacity-60";
          }
          return (
            <button
              key={opt}
              disabled={locked}
              onClick={() => onAnswer(opt)}
              className={`relative flex items-center justify-center rounded-2xl border-2 py-4 text-2xl font-bold tabular-nums transition-all duration-150 active:scale-[0.98] ${cls}`}
            >
              {opt}
              {locked && isCorrect && <CheckCircle2 className="absolute right-3 h-5 w-5 text-green-600" />}
              {locked && isPicked && !isCorrect && <XCircle className="absolute right-3 h-5 w-5 text-red-500" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ResultCard({ score, avgTime, tier, onBookDemo, onShare, onRestart }) {
  return (
    <div className="rounded-3xl border border-border bg-white shadow-xl overflow-hidden">
      <div className="bg-primary text-white text-center px-6 py-8">
        <div className="text-5xl">{tier.emoji}</div>
        <h2 className="mt-2 font-serif text-2xl md:text-3xl font-bold">{tier.title}</h2>
        <p className="mt-1 text-white/80 text-sm max-w-md mx-auto">{tier.note}</p>
      </div>

      <div className="px-6 py-6">
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-secondary/10 border border-secondary/20 p-4 text-center">
            <Trophy className="mx-auto h-6 w-6 text-secondary" />
            <p className="mt-1 text-2xl font-bold text-primary">{score}/10</p>
            <p className="text-xs text-muted-foreground">Correct answers</p>
          </div>
          <div className="rounded-2xl bg-primary/5 border border-primary/10 p-4 text-center">
            <Timer className="mx-auto h-6 w-6 text-primary" />
            <p className="mt-1 text-2xl font-bold text-primary">{avgTime.toFixed(1)}s</p>
            <p className="text-xs text-muted-foreground">Avg. per question</p>
          </div>
        </div>

        <div className="mt-6 rounded-2xl bg-secondary/5 border border-secondary/20 p-4 text-center">
          <p className="font-semibold text-primary">Want your child to answer even faster? 🚀</p>
          <p className="text-sm text-muted-foreground mt-1">
            Abacus training builds lightning-fast mental maths, focus and confidence. Try a <strong>free demo class</strong> — no commitment.
          </p>
          <button
            onClick={onBookDemo}
            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-secondary px-5 py-3.5 font-bold text-secondary-foreground shadow-md hover:brightness-105 active:scale-[0.98] transition-all"
          >
            <CalendarCheck className="h-5 w-5" /> Book a Free Demo Class
          </button>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-3">
          <button
            onClick={onShare}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-background px-4 py-3 font-semibold text-primary hover:bg-muted active:scale-[0.98] transition-all"
          >
            <Share2 className="h-4 w-4" /> Share
          </button>
          <button
            onClick={onRestart}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-background px-4 py-3 font-semibold text-primary hover:bg-muted active:scale-[0.98] transition-all"
          >
            <RefreshCw className="h-4 w-4" /> Play Again
          </button>
        </div>

        <p className="mt-4 text-center text-sm text-muted-foreground">
          Explore our <Link to="/courses" className="text-secondary font-semibold hover:underline">Abacus & Vedic Maths programs</Link>
        </p>
      </div>
    </div>
  );
}
