"use client";

import { useMemo, useState } from "react";
import { FileText, GitBranch, Network, Sparkles, UploadCloud } from "lucide-react";

type GameType = "auto" | "bargaining" | "coordination" | "chicken" | "prisoners";

type PayoffCell = {
  aMove: string;
  bMove: string;
  aPayoff: number;
  bPayoff: number;
  note: string;
  best?: boolean;
};

type GameModel = {
  title: string;
  confidence: number;
  players: [string, string];
  frame: string;
  tension: string;
  moves: [string, string];
  responses: [string, string];
  cells: PayoffCell[];
  states: Array<{ name: string; score: number; detail: string }>;
  assumptions: string[];
};

const defaultContext =
  "Acme is negotiating a strategic data partnership with Nova Health. Acme wants broad product rights and speed. Nova wants privacy guarantees, clinical validation, and upside if the product succeeds. Both sides have alternatives, but delay is costly. The best deal may trade narrower initial scope for stronger success-based economics.";

const archetypes = {
  bargaining: {
    frame: "Sequential bargaining",
    moves: ["Flexible package", "Hard opening"] as [string, string],
    responses: ["Accept guardrails", "Demand upside"] as [string, string],
    tension: "Value creation vs. value capture",
  },
  coordination: {
    frame: "Coordination game",
    moves: ["Commit early", "Wait for proof"] as [string, string],
    responses: ["Match commitment", "Preserve option"] as [string, string],
    tension: "Mutual confidence vs. timing risk",
  },
  chicken: {
    frame: "Brinkmanship game",
    moves: ["Hold line", "Concede scope"] as [string, string],
    responses: ["Hold line", "Concede economics"] as [string, string],
    tension: "Credible threat vs. costly delay",
  },
  prisoners: {
    frame: "Trust dilemma",
    moves: ["Share information", "Withhold leverage"] as [string, string],
    responses: ["Share information", "Withhold leverage"] as [string, string],
    tension: "Transparency vs. exploitation risk",
  },
};

function sentenceCase(text: string) {
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
}

function extractPlayers(text: string): [string, string] {
  const directMatch = text.match(
    /\b([A-Z][A-Za-z0-9&-]*(?:\s+[A-Z][A-Za-z0-9&-]*){0,2})\s+is\s+negotiating\b.*?\bwith\s+([A-Z][A-Za-z0-9&-]*(?:\s+[A-Z][A-Za-z0-9&-]*){0,2})\b/,
  );
  if (directMatch) return [directMatch[1], directMatch[2]];

  const candidates = text.match(/\b[A-Z][A-Za-z0-9&-]*(?:\s+[A-Z][A-Za-z0-9&-]*){0,2}\b/g) || [];
  const filtered = candidates.filter(
    (name) => !["The", "Both", "For", "If", "PDF", "BATNA", "UX"].includes(name) && name.length > 2,
  );
  return [filtered[0] || "Player A", filtered[1] || "Player B"];
}

function inferGameType(text: string, selectedType: GameType) {
  if (selectedType !== "auto") return selectedType;
  const lower = text.toLowerCase();
  if (lower.includes("negotiat") || lower.includes("deal") || lower.includes("trade")) return "bargaining";
  if (lower.includes("trust") || lower.includes("share") || lower.includes("withhold")) return "prisoners";
  if (lower.includes("threat") || lower.includes("deadline") || lower.includes("delay")) return "chicken";
  if (lower.includes("standard") || lower.includes("align") || lower.includes("coordinate")) return "coordination";
  return "bargaining";
}

function detectTension(text: string, fallback: string) {
  const lower = text.toLowerCase();
  if (lower.includes("privacy") && lower.includes("speed")) return "Speed vs. trust";
  if (lower.includes("scope") && lower.includes("economics")) return "Scope vs. economics";
  if (lower.includes("price") && lower.includes("quality")) return "Price vs. assurance";
  if (lower.includes("control") || lower.includes("rights")) return "Control vs. upside";
  return fallback;
}

function generateGame(context: string, selectedType: GameType, risk: number, files: File[]): GameModel {
  const type = inferGameType(context, selectedType);
  const archetype = archetypes[type];
  const [a, b] = extractPlayers(context);
  const docSignal = Math.min(files.length * 4, 12);
  const confidence = Math.min(92, Math.max(58, 66 + Math.round(context.length / 70) + docSignal));
  const tension = detectTension(context, archetype.tension);
  const riskPenalty = Math.round((risk - 50) / 10);

  const cells: PayoffCell[] = [
    {
      aMove: archetype.moves[0],
      bMove: archetype.responses[0],
      aPayoff: 8 - Math.max(0, riskPenalty),
      bPayoff: 8 + Math.min(1, riskPenalty),
      note: "Cooperative package with high joint value and explicit guardrails.",
      best: true,
    },
    {
      aMove: archetype.moves[0],
      bMove: archetype.responses[1],
      aPayoff: 5 - Math.max(0, riskPenalty),
      bPayoff: 9,
      note: `${b} captures more upside while ${a} preserves momentum.`,
    },
    {
      aMove: archetype.moves[1],
      bMove: archetype.responses[0],
      aPayoff: 9,
      bPayoff: 5 - Math.max(0, -riskPenalty),
      note: `${a} captures stronger terms, but relationship quality weakens.`,
    },
    {
      aMove: archetype.moves[1],
      bMove: archetype.responses[1],
      aPayoff: 3 - Math.max(0, riskPenalty),
      bPayoff: 3 - Math.max(0, -riskPenalty),
      note: "Impasse risk: value leaks into delay, process cost, and alternatives.",
    },
  ];

  return {
    title: sentenceCase(`${tension} negotiation game`),
    confidence,
    players: [a, b],
    frame: archetype.frame,
    tension,
    moves: archetype.moves,
    responses: archetype.responses,
    cells,
    states: [
      { name: "Integrated deal", score: cells[0].aPayoff + cells[0].bPayoff, detail: "Best joint value" },
      { name: `${a} favored`, score: cells[2].aPayoff + cells[2].bPayoff, detail: "Higher capture, lower trust" },
      { name: `${b} favored`, score: cells[1].aPayoff + cells[1].bPayoff, detail: "Upside shifts toward partner" },
      { name: "No agreement", score: Math.max(2, cells[3].aPayoff + cells[3].bPayoff), detail: "Delay and BATNA fallback" },
    ],
    assumptions: [
      `${a} values speed, rights, or strategic access enough to trade on economics.`,
      `${b} has non-price constraints that must be made explicit before payoffs are stable.`,
      "The efficient frontier likely comes from packaging scope, safeguards, timing, and upside.",
      files.length
        ? `${files.length} PDF source${files.length > 1 ? "s were" : " was"} treated as context signals; full text extraction is next.`
        : "Document ingestion is ready for PDFs; this prototype currently uses filenames as context signals.",
    ],
  };
}

export default function Home() {
  const [context, setContext] = useState(defaultContext);
  const [gameType, setGameType] = useState<GameType>("auto");
  const [risk, setRisk] = useState(44);
  const [files, setFiles] = useState<File[]>([]);

  const game = useMemo(() => generateGame(context, gameType, risk, files), [context, gameType, risk, files]);

  function addFiles(fileList: FileList | null) {
    if (!fileList) return;
    setFiles((current) => [...current, ...Array.from(fileList).filter((file) => file.type === "application/pdf")]);
  }

  return (
    <main className="grid min-h-screen grid-cols-1 bg-paper text-ink lg:grid-cols-[318px_minmax(0,1fr)]">
      <aside className="flex min-h-screen flex-col gap-4 border-b border-line bg-[#fbfaf6]/90 px-5 py-6 lg:border-b-0 lg:border-r">
        <div className="border-b border-[#e8e3da] pb-4">
          <div className="grid grid-cols-[42px_minmax(0,1fr)] gap-3">
            <div className="grid h-[42px] w-[42px] place-items-center rounded-[10px] bg-graphite text-xs font-black text-[#f7f3ea] shadow-tight">
              GT
            </div>
            <div>
              <p className="text-[0.72rem] font-black uppercase tracking-[0.06em] text-[#426d90]">Agent workspace</p>
              <h1 className="mt-1 text-xl font-black leading-none">Game Theory Designer</h1>
              <p className="mt-2 text-[0.8rem] leading-snug text-muted">Model the negotiation before you make the move.</p>
            </div>
          </div>
          <div className="mt-4 inline-flex rounded-full border border-sage/25 bg-[#dfeee5]/70 px-3 py-2 text-xs font-black text-teal">
            Prototype
          </div>
        </div>

        <label className="text-[0.72rem] font-black uppercase tracking-[0.06em] text-muted" htmlFor="context">
          Context prompts
        </label>
        <textarea
          id="context"
          className="min-h-[230px] w-full resize-y rounded-surface border border-line bg-white px-4 py-4 leading-relaxed outline-none focus:border-teal focus:ring-4 focus:ring-teal/10"
          value={context}
          onChange={(event) => setContext(event.target.value)}
        />

        <label className="relative flex min-h-[82px] cursor-pointer items-center rounded-surface border border-dashed border-[#b9b4aa] bg-white/55 px-4 py-3 transition hover:-translate-y-px hover:border-teal hover:bg-[#dfeee5]/70">
          <input className="absolute inset-0 opacity-0" type="file" accept="application/pdf" multiple onChange={(event) => addFiles(event.target.files)} />
          <UploadCloud className="mr-3 h-5 w-5 text-teal" />
          <span>
            <strong className="block">Add PDF context</strong>
            <span className="mt-1 block text-sm text-muted">Drop docs here or choose files</span>
          </span>
        </label>

        {files.length > 0 && (
          <ul className="grid gap-2">
            {files.map((file) => (
              <li key={`${file.name}-${file.size}`} className="flex justify-between gap-3 rounded-md border border-[#e8e3da] bg-white/60 px-3 py-2 text-xs text-muted">
                <span>{file.name}</span>
                <strong>{Math.max(1, Math.round(file.size / 1024))} KB</strong>
              </li>
            ))}
          </ul>
        )}

        <div className="grid grid-cols-2 gap-3">
          <label className="grid gap-2">
            <span className="text-[0.72rem] font-black uppercase tracking-[0.06em] text-[#426d90]">Game type</span>
            <select className="h-11 rounded-surface border border-line bg-white px-3 outline-none focus:border-teal focus:ring-4 focus:ring-teal/10" value={gameType} onChange={(event) => setGameType(event.target.value as GameType)}>
              <option value="auto">Auto infer</option>
              <option value="bargaining">Bargaining</option>
              <option value="coordination">Coordination</option>
              <option value="chicken">Chicken</option>
              <option value="prisoners">Prisoner&apos;s dilemma</option>
            </select>
          </label>
          <label className="grid gap-2">
            <span className="text-[0.72rem] font-black uppercase tracking-[0.06em] text-[#426d90]">Risk stance</span>
            <input className="w-full accent-teal" type="range" min="0" max="100" value={risk} onChange={(event) => setRisk(Number(event.target.value))} />
          </label>
        </div>

        <button className="min-h-12 rounded-surface bg-graphite px-4 font-black text-[#f9f7f1] shadow-tight transition hover:-translate-y-px hover:bg-[#111513]">
          Generate game frame
        </button>

        <section className="mt-auto rounded-surface border border-line bg-white/65 p-4">
          <h2 className="font-black">Workflow</h2>
          <ol className="mt-3 grid gap-2 pl-5 text-sm leading-tight text-muted">
            <li>Collect messy context and documents.</li>
            <li>Infer players, moves, payoffs, BATNAs, and assumptions.</li>
            <li>Render a clean game frame users can challenge.</li>
            <li>Compare deal states, risks, and bargaining zones visually.</li>
          </ol>
        </section>
      </aside>

      <section className="min-w-0 px-5 py-7 lg:px-8">
        <div className="grid items-start gap-5 md:grid-cols-[minmax(0,1fr)_auto]">
          <div>
            <p className="text-[0.72rem] font-black uppercase tracking-[0.06em] text-[#426d90]">Generated frame</p>
            <h2 className="mt-2 max-w-5xl text-4xl font-black leading-none md:text-5xl">{game.title}</h2>
          </div>
          <div className="rounded-surface border border-line bg-white/70 px-4 py-3 text-right">
            <span className="block text-xs font-black text-muted">Inference confidence</span>
            <strong className="mt-1 block text-3xl leading-none">{game.confidence}%</strong>
          </div>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <Summary label="Player A" value={game.players[0]} />
          <Summary label="Player B" value={game.players[1]} />
          <Summary label="Core tension" value={game.tension} />
          <Summary label="Recommended frame" value={game.frame} />
        </div>

        <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(420px,1.12fr)_minmax(340px,0.88fr)]">
          <Panel eyebrow="Payoff map" title="Strategic choices" icon={<Network className="h-4 w-4" />}>
            <PayoffMatrix game={game} />
          </Panel>
          <Panel eyebrow="Bargaining zone" title="Value frontier" icon={<Sparkles className="h-4 w-4" />}>
            <Frontier game={game} />
          </Panel>
          <Panel eyebrow="Game tree" title="Likely path" icon={<GitBranch className="h-4 w-4" />}>
            <GameTree game={game} />
          </Panel>
          <Panel eyebrow="State comparison" title="Outcomes" icon={<FileText className="h-4 w-4" />}>
            <StateList game={game} />
          </Panel>
        </div>

        <section className="mt-5 grid gap-5 rounded-surface border border-line bg-white/75 p-5 lg:grid-cols-[210px_minmax(0,1fr)]">
          <div>
            <p className="text-[0.72rem] font-black uppercase tracking-[0.06em] text-[#426d90]">Agent notes</p>
            <h3 className="mt-1 text-lg font-black">Assumptions to validate</h3>
          </div>
          <ul className="grid gap-3 pl-5 leading-relaxed text-muted">
            {game.assumptions.map((assumption) => (
              <li key={assumption}>{assumption}</li>
            ))}
          </ul>
        </section>
      </section>
    </main>
  );
}

function Summary({ label, value }: { label: string; value: string }) {
  return (
    <article className="min-h-[78px] rounded-surface border border-line bg-white/75 p-4">
      <span className="block text-xs font-black text-muted">{label}</span>
      <strong className="mt-2 block break-words leading-tight">{value}</strong>
    </article>
  );
}

function Panel({ eyebrow, title, icon, children }: { eyebrow: string; title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <article className="min-w-0 overflow-hidden rounded-surface border border-line bg-white/75 p-5">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="text-[0.72rem] font-black uppercase tracking-[0.06em] text-[#426d90]">{eyebrow}</p>
          <h3 className="mt-1 text-lg font-black">{title}</h3>
        </div>
        <div className="rounded-md border border-line bg-white p-2 text-teal">{icon}</div>
      </div>
      {children}
    </article>
  );
}

function PayoffMatrix({ game }: { game: GameModel }) {
  const cells = [
    <div key="blank" className="hidden min-h-[54px] rounded-surface border border-line bg-white/40 md:block" />,
    ...game.responses.map((response) => (
      <div key={response} className="grid min-h-[54px] place-items-center rounded-surface border border-line bg-[#edf2f0] px-3 text-center font-black leading-tight text-[#426d90]">
        {response}
      </div>
    )),
    <MatrixHeader key={game.moves[0]} label={game.moves[0]} />,
    ...game.cells.slice(0, 2).map((cell) => <Payoff key={`${cell.aMove}-${cell.bMove}`} cell={cell} />),
    <MatrixHeader key={game.moves[1]} label={game.moves[1]} />,
    ...game.cells.slice(2).map((cell) => <Payoff key={`${cell.aMove}-${cell.bMove}`} cell={cell} />),
  ];

  return <div className="grid gap-2 md:grid-cols-[minmax(82px,0.72fr)_repeat(2,minmax(132px,1fr))]">{cells}</div>;
}

function MatrixHeader({ label }: { label: string }) {
  return <div className="grid min-h-[88px] place-items-center rounded-surface border border-line bg-[#edf2f0] px-3 text-center font-black leading-tight text-[#426d90]">{label}</div>;
}

function Payoff({ cell }: { cell: PayoffCell }) {
  return (
    <div className={`min-h-[116px] rounded-surface border p-4 ${cell.best ? "border-sage/50 bg-[#dff1e8]" : "border-line bg-white/80"}`}>
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <strong className="text-3xl leading-none">{cell.aPayoff}, {cell.bPayoff}</strong>
        <span className="text-muted">A, B</span>
      </div>
      <p className="text-sm leading-snug text-muted">{cell.note}</p>
    </div>
  );
}

function Frontier({ game }: { game: GameModel }) {
  const best = game.cells[0];
  return (
    <div className="frontier-grid relative min-h-[306px] border-b-2 border-l-2 border-graphite">
      <div className="absolute bottom-[16%] right-[9%] h-[56%] w-[64%] rounded-tr-[78px] border-r-[5px] border-t-[5px] border-sage/80" />
      <div className="absolute bottom-[64%] left-[26%] right-[10%] h-[3px] bg-sage/70" />
      <div className="absolute bottom-[64%] left-[68%] h-3 w-3 translate-y-1/2 rounded-full border-[3px] border-white bg-[#d56b49] shadow-[0_0_0_2px_#d56b49]" />
      <div className="absolute bottom-[72%] left-[56%] max-w-[150px] rounded-md bg-graphite px-3 py-2 text-xs font-black leading-tight text-white">
        Recommended zone: {best.aPayoff}, {best.bPayoff}
      </div>
      <div className="absolute bottom-[23%] left-[25%] h-3 w-3 translate-y-1/2 rounded-full border-[3px] border-white bg-[#426d90] shadow-[0_0_0_2px_#426d90]" />
      <div className="absolute bottom-[30%] left-[10%] max-w-[150px] rounded-md bg-graphite px-3 py-2 text-xs font-black leading-tight text-white">
        Fallback / BATNA floor
      </div>
    </div>
  );
}

function GameTree({ game }: { game: GameModel }) {
  const [a, b] = game.players;
  return (
    <svg className="min-h-[306px] w-full rounded-surface" viewBox="0 0 680 320" role="img" aria-label="Game tree visualization">
      <defs>
        <marker id="arrow" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto">
          <path d="M0,0 L0,6 L9,3 z" fill="#69757b" />
        </marker>
      </defs>
      <g fill="none" stroke="#69757b" strokeWidth="2" markerEnd="url(#arrow)">
        <path d="M110 160 C190 80, 230 70, 300 78" />
        <path d="M110 160 C190 238, 230 248, 300 240" />
        <path d="M330 78 C420 48, 470 48, 560 58" />
        <path d="M330 78 C420 116, 470 122, 560 134" />
        <path d="M330 240 C420 204, 470 198, 560 188" />
        <path d="M330 240 C420 276, 470 280, 560 268" />
      </g>
      <TreeNode x={96} y={160} label={a} />
      <TreeNode x={318} y={78} label={game.moves[0]} />
      <TreeNode x={318} y={240} label={game.moves[1]} />
      {game.cells.map((cell, index) => (
        <TreeLeaf key={`${cell.aMove}-${cell.bMove}-${index}`} x={584} y={[58, 134, 188, 268][index]} cell={cell} />
      ))}
      <text x="172" y="86" fill="#69716d" fontSize="12" fontWeight="750">{a} opens</text>
      <text x="390" y="40" fill="#69716d" fontSize="12" fontWeight="750">{b} responds</text>
    </svg>
  );
}

function TreeNode({ x, y, label }: { x: number; y: number; label: string }) {
  return (
    <>
      <circle cx={x} cy={y} r="30" fill="#ffffff" stroke="#202522" strokeWidth="2" />
      <text x={x} y={y + 5} textAnchor="middle" fill="#202522" fontSize="13" fontWeight="850">
        {label.slice(0, 16)}
      </text>
    </>
  );
}

function TreeLeaf({ x, y, cell }: { x: number; y: number; cell: PayoffCell }) {
  return (
    <>
      <rect x={x - 68} y={y - 24} width="136" height="48" rx="8" fill={cell.best ? "#dff4ea" : "#ffffff"} stroke="#d9e0df" />
      <text x={x} y={y - 4} textAnchor="middle" fill="#202522" fontSize="13" fontWeight="850">
        {cell.bMove.slice(0, 18)}
      </text>
      <text x={x} y={y + 15} textAnchor="middle" fill="#69716d" fontSize="12" fontWeight="750">
        Payoff {cell.aPayoff}, {cell.bPayoff}
      </text>
    </>
  );
}

function StateList({ game }: { game: GameModel }) {
  const max = Math.max(...game.states.map((state) => state.score));
  return (
    <div className="grid gap-3">
      {game.states.map((state) => (
        <article key={state.name} className="rounded-surface border border-line bg-white/80 p-4">
          <strong className="block">{state.name}</strong>
          <span className="mt-1 block text-xs font-black text-muted">{state.detail}</span>
          <div className="mt-3 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
            <div className="h-2 overflow-hidden rounded-full bg-[#e5e7e2]">
              <i className="block h-full rounded-full bg-gradient-to-r from-sage to-amber" style={{ width: `${(state.score / max) * 100}%` }} />
            </div>
            <b>{state.score}</b>
          </div>
        </article>
      ))}
    </div>
  );
}
