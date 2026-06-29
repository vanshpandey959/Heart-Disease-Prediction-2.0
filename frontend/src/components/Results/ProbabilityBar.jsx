import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

export default function ProbabilityBar({ probDisease, probNoDisease }) {
  const data = [
    { label: "No Disease", value: parseFloat((probNoDisease * 100).toFixed(1)), color: "#15803D" },
    { label: "Heart Disease", value: parseFloat((probDisease * 100).toFixed(1)), color: "#B91C1C" },
  ];

  return (
    <div>
      <h3 className="font-bold text-gray-800 mb-1">Model Confidence</h3>
      <p className="text-xs text-gray-400 mb-4">
        Probability assigned to each outcome by the model
      </p>
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={data} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
          <XAxis dataKey="label" tick={{ fontSize: 12, fill: "#374151", fontWeight: 600 }} />
          <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: "#9ca3af" }} tickFormatter={(v) => `${v}%`} />
          <Tooltip formatter={(v) => [`${v}%`, "Probability"]} />
          <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={64}>
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.color} fillOpacity={0.85} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}