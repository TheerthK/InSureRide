import React from 'react';

export default function RiskGauge({ score, size = 120, label = 'Risk Score', maxScore = 100 }) {
  const normalized = Math.min(score, maxScore) / maxScore;
  const radius = (size - 16) / 2;
  const circumference = radius * Math.PI; // half circle
  const strokeDashoffset = circumference * (1 - normalized);
  
  const getColor = (n) => {
    if (n > 0.7) return '#ef4444';
    if (n > 0.5) return '#f97316';
    if (n > 0.3) return '#eab308';
    return '#22c55e';
  };

  const color = getColor(normalized);
  const riskLabel = normalized > 0.7 ? 'Critical' : normalized > 0.5 ? 'High' : normalized > 0.3 ? 'Moderate' : 'Low';

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={size} height={size * 0.65} viewBox={`0 0 ${size} ${size * 0.65}`}>
        {/* Background arc */}
        <path
          d={`M ${8} ${size * 0.6} A ${radius} ${radius} 0 0 1 ${size - 8} ${size * 0.6}`}
          fill="none"
          stroke="#1e293b"
          strokeWidth="8"
          strokeLinecap="round"
        />
        {/* Colored arc */}
        <path
          d={`M ${8} ${size * 0.6} A ${radius} ${radius} 0 0 1 ${size - 8} ${size * 0.6}`}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          style={{ transition: 'stroke-dashoffset 1s ease-out, stroke 0.5s ease' }}
        />
        {/* Score text */}
        <text x={size / 2} y={size * 0.52} textAnchor="middle" className="text-2xl font-bold" fill={color} fontSize={size * 0.22}>
          {Math.round(score)}
        </text>
      </svg>
      <p className="text-xs font-semibold uppercase tracking-wider" style={{ color }}>{riskLabel}</p>
      <p className="text-xs text-slate-500">{label}</p>
    </div>
  );
}
