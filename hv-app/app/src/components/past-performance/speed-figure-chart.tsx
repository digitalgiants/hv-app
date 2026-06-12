"use client"

import {
  Line,
  LineChart,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Dot,
} from "recharts"
import type { PastStart } from "@/types/racing"

interface Props {
  pastStarts: PastStart[]
}

function figureColor(val: number | null | undefined): string {
  if (!val) return "#64748b"
  if (val >= 90) return "#34d399"
  if (val >= 80) return "#38bdf8"
  if (val >= 70) return "#facc15"
  if (val >= 60) return "#fb923c"
  return "#f87171"
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function ColoredDot(props: any) {
  const { cx, cy, payload } = props
  const color = figureColor(payload.fig)
  return <Dot cx={cx} cy={cy} r={4} fill={color} stroke={color} />
}

export function SpeedFigureChart({ pastStarts }: Props) {
  const data = [...pastStarts]
    .reverse()
    .map((s, i) => ({
      race: i + 1,
      date: s.date,
      fig: s.speedFigure ?? null,
    }))

  return (
    <div className="h-20">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 4, right: 8, bottom: 4, left: 0 }}>
          <XAxis dataKey="race" hide />
          <YAxis domain={["auto", "auto"]} hide />
          <Tooltip
            contentStyle={{
              background: "#0f172a",
              border: "1px solid #1e293b",
              borderRadius: "6px",
              fontSize: 12,
            }}
            labelStyle={{ color: "#64748b" }}
            itemStyle={{ color: "#38bdf8" }}
            formatter={(value: number) => [value ?? "N/A", "Figure"]}
            labelFormatter={(i) => data[i - 1]?.date ?? ""}
          />
          <ReferenceLine y={80} stroke="#1e293b" strokeDasharray="3 3" />
          <Line
            type="monotone"
            dataKey="fig"
            stroke="#334155"
            strokeWidth={1.5}
            dot={<ColoredDot />}
            activeDot={{ r: 5 }}
            connectNulls={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
