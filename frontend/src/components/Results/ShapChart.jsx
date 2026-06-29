import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ReferenceLine, ResponsiveContainer, Cell,
} from "recharts";

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const val = payload[0].value;
  return (
    <div className="bg-white border border-gray-200 rounded-xl px-4 py-2 shadow-lg text-sm">
      <p className="font-semibold text-gray-700">{payload[0].payload.feature}</p>
      <p style={{ color: val > 0 ? "#B91C1C" : "#15803D" }} className="font-bold">
        {val > 0 ? "+" : ""}{val.toFixed(4)}
        <span className="text-gray-400 font-normal ml-1">
          {val > 0 ? "↑ increases risk" : "↓ reduces risk"}
        </span>
      </p>
    </div>
  );
};

export default function ShapChart({ contributions }) {
  if (!contributions || Object.keys(contributions).length === 0) return null;

  // Take top 10 by absolute value
  const data = Object.entries(contributions)
    .slice(0, 10)
    .map(([feature, value]) => ({ feature, value }))
    .sort((a, b) => a.value - b.value); // sort ascending for horizontal bar readability

  return (
    <div>
      <h3 className="font-bold text-gray-800 mb-1">Feature Impact on Prediction</h3>
      <p className="text-xs text-gray-400 mb-4">
        Red bars increase risk · Green bars reduce risk · Length = strength of influence
      </p>
      <ResponsiveContainer width="100%" height={320}>
        <BarChart data={data} layout="vertical" margin={{ left: 8, right: 24, top: 4, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
          <XAxis
            type="number"
            tick={{ fontSize: 11, fill: "#9ca3af" }}
            tickFormatter={(v) => v.toFixed(2)}
          />
          <YAxis
            type="category"
            dataKey="feature"
            width={170}
            tick={{ fontSize: 11, fill: "#374151" }}
          />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine x={0} stroke="#d1d5db" strokeWidth={1.5} />
          <Bar dataKey="value" radius={[0, 4, 4, 0]} maxBarSize={18}>
            {data.map((entry, i) => (
              <Cell
                key={i}
                fill={entry.value > 0 ? "#EF4444" : "#22C55E"}
                fillOpacity={0.85}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}