import { Card } from "@/components/ui/card"
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts"

const scoreData = [
  { name: "NVDA", value: 94 },
  { name: "AMD", value: 91 },
  { name: "TSLA", value: 89 },
  { name: "COIN", value: 87 },
]

const upsideData = [
  { name: "NVDA", value: 16.04 },
  { name: "AMD", value: 16.87 },
  { name: "TSLA", value: 18.59 },
  { name: "COIN", value: 22.15 },
]

const signalData = [
  { name: "Buy", value: 1, color: "oklch(0.72 0.15 166)" },
  { name: "Strong Buy", value: 3, color: "oklch(0.78 0.13 166)" },
]

export function Charts() {
  return (
    <div className="grid gap-6 md:grid-cols-3">
      <Card className="bg-white/5 border-white/10 p-6">
        <h3 className="text-sm font-medium text-white/60 mb-4 uppercase tracking-wider">Score Distribution</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={scoreData}>
            <XAxis dataKey="name" stroke="rgba(255,255,255,0.4)" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke="rgba(255,255,255,0.4)" fontSize={12} tickLine={false} axisLine={false} domain={[0, 100]} />
            <Tooltip
              contentStyle={{
                backgroundColor: "rgba(0,0,0,0.9)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "0.5rem",
                color: "#fff"
              }}
            />
            <Bar dataKey="value" fill="oklch(0.72 0.15 166)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <Card className="bg-white/5 border-white/10 p-6">
        <h3 className="text-sm font-medium text-white/60 mb-4 uppercase tracking-wider">Potential Upside %</h3>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={upsideData}>
            <XAxis dataKey="name" stroke="rgba(255,255,255,0.4)" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke="rgba(255,255,255,0.4)" fontSize={12} tickLine={false} axisLine={false} domain={[0, 30]} />
            <Tooltip
              contentStyle={{
                backgroundColor: "rgba(0,0,0,0.9)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "0.5rem",
                color: "#fff"
              }}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke="oklch(0.72 0.15 166)"
              strokeWidth={2}
              dot={{ fill: "oklch(0.72 0.15 166)", r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      <Card className="bg-white/5 border-white/10 p-6">
        <h3 className="text-sm font-medium text-white/60 mb-4 uppercase tracking-wider">Signal Distribution</h3>
        <div className="flex items-center justify-between">
          <ResponsiveContainer width="65%" height={200}>
            <PieChart>
              <Pie
                data={signalData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={2}
                dataKey="value"
              >
                {signalData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-col gap-3">
            {signalData.map((entry) => (
              <div key={entry.name} className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-sm" style={{ backgroundColor: entry.color }} />
                <span className="text-sm text-white">{entry.name}</span>
              </div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  )
}
