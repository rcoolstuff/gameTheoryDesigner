"use client";

import { useMemo, useState } from "react";
import { Background, Controls, Handle, MarkerType, MiniMap, Position, ReactFlow, type Edge, type Node, type NodeProps } from "@xyflow/react";
import { FileText, GitBranch, Network, Sparkles, UploadCloud } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";

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
  moves: string[];
  responses: string[];
  cells: PayoffCell[];
  pathSteps: Array<{ actor: string; action: string; detail: string; payoff?: string }>;
  states: Array<{ name: string; score: number; detail: string }>;
  assumptions: string[];
};

type StepNodeData = {
  actor: string;
  action: string;
  detail: string;
  payoff?: string;
  index: number;
  isRecommended: boolean;
};

const defaultContext =
  "Acme is negotiating a strategic data partnership with Nova Health. Acme wants broad product rights and speed. Nova wants privacy guarantees, clinical validation, and upside if the product succeeds. Both sides have alternatives, but delay is costly. The best deal may trade narrower initial scope for stronger success-based economics.";

const archetypes = {
  bargaining: {
    frame: "Sequential bargaining",
    moves: ["Flexible package", "Hard opening", "Pilot first", "Walkaway threat"],
    responses: ["Accept guardrails", "Demand upside", "Ask validation", "Delay decision"],
    tension: "Value creation vs. value capture",
  },
  coordination: {
    frame: "Coordination game",
    moves: ["Commit early", "Wait for proof", "Set standard", "Split rollout"],
    responses: ["Match commitment", "Preserve option", "Request signal", "Coordinate later"],
    tension: "Mutual confidence vs. timing risk",
  },
  chicken: {
    frame: "Brinkmanship game",
    moves: ["Hold line", "Concede scope", "Escalate deadline", "Offer bridge"],
    responses: ["Hold line", "Concede economics", "Counter-threat", "Seek pause"],
    tension: "Credible threat vs. costly delay",
  },
  prisoners: {
    frame: "Trust dilemma",
    moves: ["Share information", "Withhold leverage", "Stage disclosure", "Audit terms"],
    responses: ["Share information", "Withhold leverage", "Reciprocate later", "Demand proof"],
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

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function jointValue(cell: PayoffCell) {
  return cell.aPayoff + cell.bPayoff;
}

function generateGame(
  context: string,
  selectedType: GameType,
  risk: number,
  actionCount: number,
  stepCount: number,
  files: File[],
): GameModel {
  const type = inferGameType(context, selectedType);
  const archetype = archetypes[type];
  const [a, b] = extractPlayers(context);
  const docSignal = Math.min(files.length * 4, 12);
  const confidence = Math.min(92, Math.max(58, 66 + Math.round(context.length / 70) + docSignal));
  const tension = detectTension(context, archetype.tension);
  const riskPenalty = Math.round((risk - 50) / 10);
  const size = clamp(actionCount, 2, 4);
  const moves = archetype.moves.slice(0, size);
  const responses = archetype.responses.slice(0, size);
  const cells: PayoffCell[] = moves.flatMap((move, rowIndex) =>
    responses.map((response, columnIndex) => {
      const coordinationBonus = rowIndex === columnIndex ? 2 : 0;
      const captureTilt = columnIndex - rowIndex;
      const distancePenalty = Math.abs(rowIndex - columnIndex);
      const aPayoff = clamp(8 - rowIndex - distancePenalty - Math.max(0, riskPenalty) + Math.max(0, -captureTilt), 1, 10);
      const bPayoff = clamp(8 - columnIndex - distancePenalty - Math.max(0, -riskPenalty) + Math.max(0, captureTilt) + coordinationBonus, 1, 10);
      const notes = [
        "Highest joint-value package if the parties can make constraints explicit.",
        `${b} captures more upside while ${a} preserves momentum.`,
        `${a} captures stronger terms, but relationship quality weakens.`,
        "Impasse risk: value leaks into delay, process cost, and alternatives.",
        "Staged option keeps the deal alive while deferring contested value.",
        "Validation-heavy route lowers risk but slows conversion to value.",
      ];

      return {
        aMove: move,
        bMove: response,
        aPayoff,
        bPayoff,
        note: notes[(rowIndex * responses.length + columnIndex) % notes.length],
      };
    }),
  );
  const bestCell = cells.reduce((best, cell) => (jointValue(cell) > jointValue(best) ? cell : best), cells[0]);
  bestCell.best = true;
  const rankedCells = [...cells].sort((left, right) => jointValue(right) - jointValue(left));
  const pathSteps = Array.from({ length: clamp(stepCount, 3, 6) }, (_, index) => {
    const cell = rankedCells[index % rankedCells.length];
    const isA = index % 2 === 0;
    const actor = isA ? a : b;
    const action = isA ? cell.aMove : cell.bMove;
    const details = [
      "opens with the frame that anchors the game",
      "tests the tradeoff and exposes non-price constraints",
      "packages scope, timing, safeguards, and upside",
      "compares the offer against BATNA pressure",
      "narrows the zone of possible agreement",
      "commits only if the payoff shape remains stable",
    ];

    return {
      actor,
      action,
      detail: details[index],
      payoff: index >= 2 ? `${cell.aPayoff}, ${cell.bPayoff}` : undefined,
    };
  });

  return {
    title: sentenceCase(`${tension} negotiation game`),
    confidence,
    players: [a, b],
    frame: archetype.frame,
    tension,
    moves,
    responses,
    cells,
    pathSteps,
    states: [
      { name: "Integrated deal", score: jointValue(rankedCells[0]), detail: "Best joint value" },
      { name: `${a} favored`, score: jointValue(rankedCells.find((cell) => cell.aPayoff > cell.bPayoff) || rankedCells[1]), detail: "Higher capture, lower trust" },
      { name: `${b} favored`, score: jointValue(rankedCells.find((cell) => cell.bPayoff > cell.aPayoff) || rankedCells[2]), detail: "Upside shifts toward partner" },
      { name: "No agreement", score: Math.max(2, jointValue(rankedCells[rankedCells.length - 1])), detail: "Delay and BATNA fallback" },
    ],
    assumptions: [
      `${a} values speed, rights, or strategic access enough to trade on economics.`,
      `${b} has non-price constraints that must be made explicit before payoffs are stable.`,
      `The matrix is currently ${moves.length} by ${responses.length}; expanding actions adds more possible strategic states, not just visual cells.`,
      `The path is modeled as ${pathSteps.length} negotiation steps; shorter games emphasize commitment, longer games expose sequencing risk.`,
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
  const [actionCount, setActionCount] = useState(3);
  const [stepCount, setStepCount] = useState(5);
  const [files, setFiles] = useState<File[]>([]);

  const game = useMemo(
    () => generateGame(context, gameType, risk, actionCount, stepCount, files),
    [context, gameType, risk, actionCount, stepCount, files],
  );

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
          <Badge className="mt-4">Prototype</Badge>
        </div>

        <Label className="text-muted" htmlFor="context">
          Context prompts
        </Label>
        <Textarea
          id="context"
          className="min-h-[230px]"
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
          <div className="grid gap-2">
            <Label>Game type</Label>
            <Select value={gameType} onValueChange={(value) => setGameType(value as GameType)}>
              <SelectTrigger>
                <SelectValue placeholder="Auto infer" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="auto">Auto infer</SelectItem>
                <SelectItem value="bargaining">Bargaining</SelectItem>
                <SelectItem value="coordination">Coordination</SelectItem>
                <SelectItem value="chicken">Chicken</SelectItem>
                <SelectItem value="prisoners">Prisoner&apos;s dilemma</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label>Risk stance</Label>
            <Slider value={[risk]} min={0} max={100} step={1} onValueChange={([value]) => setRisk(value)} />
          </div>
        </div>

        <div className="grid gap-3 rounded-surface border border-line bg-white/60 p-3">
          <div className="grid gap-2">
            <div className="flex items-center justify-between gap-3">
              <Label>Actions per player</Label>
              <strong className="rounded-md border border-line bg-white px-2 py-1 text-xs">{actionCount} x {actionCount}</strong>
            </div>
            <Slider value={[actionCount]} min={2} max={4} step={1} onValueChange={([value]) => setActionCount(value)} />
          </div>
          <div className="grid gap-2">
            <div className="flex items-center justify-between gap-3">
              <Label>Negotiation steps</Label>
              <strong className="rounded-md border border-line bg-white px-2 py-1 text-xs">{stepCount}</strong>
            </div>
            <Slider value={[stepCount]} min={3} max={6} step={1} onValueChange={([value]) => setStepCount(value)} />
          </div>
        </div>

        <Button className="min-h-12">
          Generate game frame
        </Button>

        <section className="mt-auto rounded-surface border border-line bg-white/65 p-4">
          <h2 className="font-black">Workflow</h2>
          <ol className="mt-3 grid gap-2 pl-5 text-sm leading-tight text-muted">
            <li>Collect messy context and documents.</li>
            <li>Infer players, variable actions, payoffs, BATNAs, and assumptions.</li>
            <li>Render a flexible game frame users can challenge.</li>
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
          <Summary label="Game size" value={`${game.moves.length} x ${game.responses.length} matrix, ${game.pathSteps.length} steps`} />
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
    <Card className="min-h-[78px] p-4">
      <span className="block text-xs font-black text-muted">{label}</span>
      <strong className="mt-2 block break-words leading-tight">{value}</strong>
    </Card>
  );
}

function Panel({ eyebrow, title, icon, children }: { eyebrow: string; title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <Card className="min-w-0 overflow-hidden">
      <CardHeader>
        <div>
          <p className="text-[0.72rem] font-black uppercase tracking-[0.06em] text-[#426d90]">{eyebrow}</p>
          <CardTitle className="mt-1">{title}</CardTitle>
        </div>
        <div className="rounded-md border border-line bg-white p-2 text-teal">{icon}</div>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function PayoffMatrix({ game }: { game: GameModel }) {
  return (
    <div className="-mx-1 overflow-x-auto px-1 pb-1">
      <div
        className="grid min-w-[720px] gap-2"
        style={{ gridTemplateColumns: `minmax(112px, 0.72fr) repeat(${game.responses.length}, minmax(148px, 1fr))` }}
      >
        <div className="min-h-[54px] rounded-surface border border-line bg-white/40" />
        {game.responses.map((response) => (
          <div key={response} className="grid min-h-[54px] place-items-center rounded-surface border border-line bg-[#edf2f0] px-3 text-center font-black leading-tight text-[#426d90]">
            {response}
          </div>
        ))}
        {game.moves.flatMap((move) => [
          <MatrixHeader key={move} label={move} />,
          ...game.responses.map((response) => {
            const cell = game.cells.find((item) => item.aMove === move && item.bMove === response);
            return cell ? <Payoff key={`${move}-${response}`} cell={cell} /> : null;
          }),
        ])}
      </div>
    </div>
  );
}

function MatrixHeader({ label }: { label: string }) {
  return <div className="grid min-h-[88px] place-items-center rounded-surface border border-line bg-[#edf2f0] px-3 text-center font-black leading-tight text-[#426d90]">{label}</div>;
}

function Payoff({ cell }: { cell: PayoffCell }) {
  return (
    <div data-testid="payoff-cell" className={`min-h-[116px] rounded-surface border p-4 ${cell.best ? "border-sage/50 bg-[#dff1e8]" : "border-line bg-white/80"}`}>
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <strong className="text-3xl leading-none">{cell.aPayoff}, {cell.bPayoff}</strong>
        <span className="text-muted">A, B</span>
      </div>
      <p className="text-sm leading-snug text-muted">{cell.note}</p>
    </div>
  );
}

function Frontier({ game }: { game: GameModel }) {
  const best = game.cells.reduce((current, cell) => (jointValue(cell) > jointValue(current) ? cell : current), game.cells[0]);
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
  const nodeTypes = useMemo(() => ({ step: StepNode }), []);
  const nodes: Node<StepNodeData>[] = useMemo(
    () =>
      game.pathSteps.map((step, index) => ({
        id: `step-${index}`,
        type: "step",
        position: {
          x: index * 210,
          y: index % 2 === 0 ? 40 : 190,
        },
        data: {
          ...step,
          index,
          isRecommended: index === 0 || index === game.pathSteps.length - 1,
        },
      })),
    [game.pathSteps],
  );
  const edges: Edge[] = useMemo(
    () =>
      game.pathSteps.slice(1).map((_, index) => ({
        id: `edge-${index}-${index + 1}`,
        source: `step-${index}`,
        target: `step-${index + 1}`,
        type: "smoothstep",
        markerEnd: { type: MarkerType.ArrowClosed, color: "#69757b" },
        style: { stroke: "#69757b", strokeWidth: 2 },
      })),
    [game.pathSteps],
  );

  return (
    <div className="h-[360px] overflow-hidden rounded-surface border border-line bg-[#fbfaf6]">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
        minZoom={0.35}
        maxZoom={1.4}
        proOptions={{ hideAttribution: true }}
      >
        <Background color="#d8d4ca" gap={24} />
        <Controls position="bottom-right" />
        <MiniMap
          position="bottom-left"
          pannable
          zoomable
          nodeColor={(node) => (node.data?.isRecommended ? "#6f9c82" : "#d8d4ca")}
          maskColor="rgba(244, 241, 234, 0.72)"
        />
      </ReactFlow>
    </div>
  );
}

function StepNode({ data }: NodeProps<Node<StepNodeData>>) {
  return (
    <div
      data-testid="path-step"
      className={`w-44 rounded-surface border bg-white p-3 shadow-tight ${data.isRecommended ? "border-sage bg-[#eef8f2]" : "border-line"}`}
    >
      <Handle type="target" position={Position.Left} className="!h-2.5 !w-2.5 !border-white !bg-teal" />
      <div className="flex items-center justify-between gap-2">
        <span className="rounded-md bg-graphite px-2 py-1 text-[0.68rem] font-black text-white">STEP {data.index + 1}</span>
        {data.payoff && <span className="text-xs font-black text-amber">{data.payoff}</span>}
      </div>
      <p className="mt-3 text-[0.7rem] font-black uppercase tracking-[0.06em] text-[#426d90]">{data.actor}</p>
      <strong className="mt-1 block leading-tight">{data.action}</strong>
      <p className="mt-2 text-xs leading-snug text-muted">{data.detail}</p>
      <Handle type="source" position={Position.Right} className="!h-2.5 !w-2.5 !border-white !bg-teal" />
    </div>
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
