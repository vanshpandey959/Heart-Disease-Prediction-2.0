import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";

const COLORS = [
  "#B91C1C", "#DC2626", "#EF4444", "#F87171",
  "#FCA5A5", "#FECACA", "#FEE2E2",
];

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-xl px-4 py-2 shadow-lg text-sm">
      <p className="font-semibold text-gray-700">{payload[0].name}</p>
      <p className="text-red-600 font-bold">{payload[0].value.toFixed(1)}% of total risk</p>
    </div>
  );
};

export default function ContributionPie({ contributions }) {
  if (!contributions || Object.keys(contributions).length === 0) return null;

  // Only risk-increasing (positive SHAP) factors
  const riskFactors = Object.entries(contributions)
    .filter(([, v]) => v > 0.01)
    .slice(0, 7);

  if (riskFactors.length === 0) return null;

  const total = riskFactors.reduce((sum, [, v]) => sum + v, 0);
  const data = riskFactors.map(([feature, value]) => ({
    name: feature,
    value: parseFloat(((value / total) * 100).toFixed(1)),
  }));

  return (
    <div>
      <h3 className="font-bold text-gray-800 mb-1">Risk Factor Breakdown</h3>
      <p className="text-xs text-gray-400 mb-4">
        Share of each factor in your total risk score
      </p>
      <ResponsiveContainer width="100%" height={280}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="45%"
            innerRadius={60}
            outerRadius={95}
            paddingAngle={3}
            dataKey="value"
          >
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend
            iconType="circle"
            iconSize={8}
            formatter={(v) => (
              <span style={{ fontSize: 11, color: "#374151" }}>{v}</span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}