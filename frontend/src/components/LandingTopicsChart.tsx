import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export function LandingTopicsChart({ data }: { data: Array<Record<string, string | number>> }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} layout="vertical" margin={{ top: 0, right: 12, left: 4, bottom: 0 }}>
        <XAxis type="number" hide />
        <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 12, fill: "#675F60" }} axisLine={false} tickLine={false} />
        <Tooltip cursor={{ fill: "#F4E7EA" }} contentStyle={{ border: "1px solid #E2DCDA", borderRadius: 12 }} />
        <Bar dataKey="total" fill="#A95E6F" radius={[0, 5, 5, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
