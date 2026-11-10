type Factors = readonly (readonly [string, string])[];

// "How much do you care about each data point?" -> sent to the backend and used to weight the match score.
export default function Priorities({ factors, value, onChange }: { factors: Factors; value: Record<string, string>; onChange: (v: Record<string, string>) => void }) {
  return (
    <div className="prio">
      {factors.map(([key, label]) => (
        <label key={key}>{label}
          <select value={value[key] ?? 'normal'} onChange={(e) => onChange({ ...value, [key]: e.target.value })}>
            <option value="low">Less important</option>
            <option value="normal">Normal</option>
            <option value="high">Very important</option>
          </select>
        </label>
      ))}
    </div>
  );
}
