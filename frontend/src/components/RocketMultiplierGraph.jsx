import { useEffect, useRef, useState } from "react";
import { Rocket } from "lucide-react";
import { useCrashOutContext } from "@/hooks/useCrashoutContext";

const CHART = {
  width: 500,
  height: 500,
  left: 72,
  right: 30,
  top: 18,
  bottom: 48,
};

export default function RocketMultiplierGraph({
  multiplier = 1.0,
  running = false,
  resetKey = 0,
  className = "",
}) {
  const [points, setPoints] = useState([{ time: 0, value: multiplier }]);
  const startedAt = useRef(0);
  const { gameState } = useCrashOutContext();

  // Reset graph history on resetKey change
  useEffect(() => {
    setPoints([{ time: 0, value: multiplier }]);
    startedAt.current = performance.now();
  }, [resetKey]);

  // Record start time when launch begins
  useEffect(() => {
    if (running) {
      startedAt.current = performance.now();
      setPoints([{ time: 0, value: multiplier }]);
    }
  }, [running]);

  // Record incoming multiplier updates to graph points
  useEffect(() => {
    if (!running) return;

    const time = Math.max(0, (performance.now() - startedAt.current) / 1000);
    setPoints((current) => [...current, { time, value: multiplier }]);
  }, [multiplier, running]);

  // Graph Layout Calculations
  const lastTime = points.at(-1)?.time || 0;
  const targetXProgress = 0.9 * (1 - Math.exp(-lastTime / 4));
  const xWindow = lastTime > 0 ? lastTime / targetXProgress : 4 / 0.9;
  const yMax = 3 + multiplier * 1.22;
  const plotWidth = CHART.width - CHART.left - CHART.right;
  const plotHeight = CHART.height - CHART.top - CHART.bottom;

  const xOf = (time) => CHART.left + (time / xWindow) * plotWidth;
  const yOf = (val) => CHART.top + plotHeight - (val / yMax) * plotHeight;

  // SVG Paths
  const line = points
    .map(
      (point, index) =>
        `${index ? "L" : "M"}${xOf(point.time).toFixed(1)},${yOf(point.value).toFixed(1)}`,
    )
    .join(" ");

  const area = `${line} L${xOf(lastTime)},${CHART.top + plotHeight} L${CHART.left},${CHART.top + plotHeight} Z`;

  // Grid Ticks
  const yTicks = Array.from(
    { length: 5 },
    (_, index) => yMax - index * (yMax / 4),
  );
  const xTicks = Array.from(
    { length: 7 },
    (_, index) => (xWindow / 6) * index,
  );

  // Rocket position
  const rocketLeft = (xOf(lastTime) / CHART.width) * 100;
  const rocketTop = (yOf(multiplier) / CHART.height) * 100;

  // Dynamic Rocket Rotation based on recent rate of change (dy / dt)
  const prevPoint = points.at(-2) || { time: 0, value: multiplier };
  const currPoint = points.at(-1) || { time: lastTime, value: multiplier };
  const dt = currPoint.time - prevPoint.time;
  const dy = currPoint.value - prevPoint.value;
  const dyDt = dt > 0 ? dy / dt : 0.18 * lastTime;

  const screenSlope = ((dyDt * plotHeight) / yMax) / (plotWidth / xWindow);
  const tangentAngle = -Math.atan(screenSlope) * (180 / Math.PI);
  const rocketRotation = tangentAngle + 45;

  return (
    <section
      className={`absolute inset-0 w-full h-full overflow-hidden border border-white/20 bg-[#080808] text-white ${className}`}
    >
      <div className="pointer-events-none absolute left-1/2 top-5 z-20 -translate-x-1/2 text-center md:top-7">
        <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-orange-500">
          {running ? "Flight in progress" : "Waiting for launch"}
        </p>
        <p
          className={`font-display text-[clamp(2.5rem,13vw,12rem)] leading-none tracking-[-0.06em] tabular-nums transition-colors duration-300 ${
            gameState === "crashed" || gameState === "update_score"
              ? "text-red-500 drop-shadow-[0_0_35px_rgba(239,68,68,0.35)]"
              : "text-white"
          }`}
        >
          {gameState === "blast_off" ? `${multiplier.toFixed(2)}×` : "CRASHED"}
        </p>
        <p
          className={`mb-2 text-xs font-bold uppercase tracking-[0.3em] ${
            gameState === "crashed" || gameState === "update_score"
              ? "text-red-500"
              : "text-orange-500"
          }`}
        >
          {gameState === "blast_off" ? "" : "Flight Ended"}
        </p>
      </div>

      <svg
        viewBox={`0 0 ${CHART.width} ${CHART.height}`}
        preserveAspectRatio="none"
        className="absolute inset-0 h-full w-full"
        aria-label={`Live multiplier graph, current value ${multiplier.toFixed(2)} times`}
      >
        {yTicks.map((tick, index) => {
          const y = yOf(tick);
          return (
            <g key={index}>
              <line
                x1={CHART.left}
                x2={CHART.width - CHART.right}
                y1={y}
                y2={y}
                stroke="rgba(255,255,255,.13)"
                strokeDasharray="5 8"
              />
              <text
                x={CHART.left - 12}
                y={y + 5}
                textAnchor="end"
                fill="rgba(255,255,255,.48)"
                fontSize="14"
              >
                {tick.toFixed(1)}×
              </text>
            </g>
          );
        })}

        {xTicks.map((tick, index) => {
          const x = xOf(tick);
          return (
            <g key={index}>
              <line
                x1={x}
                x2={x}
                y1={CHART.top}
                y2={CHART.top + plotHeight}
                stroke="rgba(255,255,255,.07)"
              />
              <text
                x={x}
                y={CHART.height - 17}
                textAnchor="middle"
                fill="rgba(255,255,255,.35)"
                fontSize="13"
              >
                {tick.toFixed(0)}s
              </text>
            </g>
          );
        })}

        <path d={area} fill="rgba(255,91,25,.12)" />
        <path
          d={line}
          fill="none"
          stroke="#ff5b19"
          strokeWidth="6"
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
          style={{ filter: "drop-shadow(0 0 4px rgba(255,91,25,.45))" }}
        />
      </svg>

      <div
        className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-1/2"
        style={{ left: `${rocketLeft}%`, top: `${rocketTop}%` }}
      >
        <span className="absolute right-9 top-1/2 h-1 w-12 -translate-y-1/2 bg-gradient-to-l from-orange-500 to-transparent" />
        <Rocket
          size={54}
          strokeWidth={1.7}
          fill="#ff5b19"
          className="text-orange-500 drop-shadow-[0_0_12px_rgba(255,91,25,.65)]"
          style={{ transform: `rotate(${rocketRotation}deg)` }}
        />
      </div>
    </section>
  );
}