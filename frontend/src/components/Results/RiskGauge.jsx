import { RadialBarChart, RadialBar, PolarAngleAxis } from "recharts";

export default function RiskGauge({ probability, riskLevel }) {
  const pct = Math.round(probability * 100);

  const color =
    riskLevel === "High"     ? "#B91C1C" :
    riskLevel === "Moderate" ? "#D97706" : "#15803D";

  const data = [{ value: pct, fill: color }];

  return (
    <div className="flex flex-col items-center">
      <div className="relative">
        <RadialBarChart
          width={220}
          height={130}
          cx={110}
          cy={120}
          innerRadius={80}
          outerRadius={110}
          startAngle={180}
          endAngle={0}
          data={data}
        >
          <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
          {/* Background track */}
          <RadialBar dataKey="value" data={[{ value: 100, fill: "#f3f4f6" }]} cornerRadius={10} />
          {/* Actual value */}
          <RadialBar dataKey="value" cornerRadius={10} />
        </RadialBarChart>

        {/* Center label */}
        <div className="absolute inset-0 flex flex-col items-center justify-end pb-2">
          <span className="text-4xl font-black" style={{ color }}>{pct}%</span>
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
            Risk Score
          </span>
        </div>
      </div>

      {/* Zone labels */}
      <div className="flex justify-between w-48 text-xs mt-1">
        <span className="text-green-600 font-semibold">Low</span>
        <span className="text-amber-500 font-semibold">Moderate</span>
        <span className="text-red-700 font-semibold">High</span>
      </div>

      {/* Risk badge */}
      <div
        className="mt-3 px-5 py-1.5 rounded-full text-sm font-bold"
        style={{
          background: color + "18",
          color,
          border: `1.5px solid ${color}44`,
        }}
      >
        {riskLevel} Risk
      </div>
    </div>
  );
}