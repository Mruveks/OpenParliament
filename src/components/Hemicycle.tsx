import { useMemo, useState } from 'react';
import { POLITICAL_GROUP_COLORS } from '../types';

interface HemicycleProps {
  groups: { short: string; full: string; mepCount: number }[];
  width?: number;
  height?: number;
}

interface Seat {
  x: number;
  y: number;
  group: string;
  groupFull: string;
  color: string;
}

export default function Hemicycle({ groups, width = 800, height = 440 }: HemicycleProps) {
  const [hoveredGroup, setHoveredGroup] = useState<string | null>(null);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; group: string; count: number } | null>(null);

  const seats = useMemo(() => {
    const totalSeats = groups.reduce((s, g) => s + g.mepCount, 0);
    const allSeats: Seat[] = [];

    // Hemicycle parameters
    const cx = width / 2;
    const cy = height - 20;
    const innerRadius = height * 0.25;
    const outerRadius = height * 0.88;
    const startAngle = Math.PI;
    const endAngle = 0;

    // Calculate rows - distribute seats across concentric arcs
    const seatDiameter = 8;
    const seatGap = 2.5;
    const rowGap = seatDiameter + seatGap;
    const numRows = Math.floor((outerRadius - innerRadius) / rowGap);
    const rows: number[] = [];

    for (let r = 0; r < numRows; r++) {
      const radius = innerRadius + r * rowGap + rowGap / 2;
      const arcLength = Math.PI * radius;
      const seatsInRow = Math.floor(arcLength / (seatDiameter + seatGap));
      rows.push(seatsInRow);
    }

    const totalCapacity = rows.reduce((s, n) => s + n, 0);
    const scale = totalSeats / totalCapacity;

    // Adjust seats per row proportionally
    const adjustedRows = rows.map((n) => Math.round(n * scale));

    // Ensure total matches
    let diff = totalSeats - adjustedRows.reduce((s, n) => s + n, 0);
    for (let i = adjustedRows.length - 1; diff !== 0 && i >= 0; i--) {
      if (diff > 0 && adjustedRows[i] > 0) { adjustedRows[i]++; diff--; }
      else if (diff < 0 && adjustedRows[i] > 1) { adjustedRows[i]--; diff++; }
    }

    // Build ordered group seat list
    // Order: far left to far right, typical EP hemicycle arrangement
    const groupOrder = ['The Left', 'GUE/NGL', 'Greens/EFA', 'S&D', 'RE', 'EPP', 'ECR', 'PfE', 'ID', 'ESN', 'NI'];
    const orderedGroups = [...groups].sort((a, b) => {
      const ai = groupOrder.indexOf(a.short);
      const bi = groupOrder.indexOf(b.short);
      return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
    });

    const seatAssignments: { group: string; groupFull: string; color: string }[] = [];
    for (const g of orderedGroups) {
      const color = POLITICAL_GROUP_COLORS[g.short] || '#888888';
      for (let i = 0; i < g.mepCount; i++) {
        seatAssignments.push({ group: g.short, groupFull: g.full, color });
      }
    }

    // Place seats in the hemicycle
    let seatIdx = 0;
    for (let r = 0; r < numRows && seatIdx < totalSeats; r++) {
      const radius = innerRadius + r * rowGap + rowGap / 2;
      const seatsInRow = adjustedRows[r];
      if (seatsInRow <= 0) continue;

      for (let s = 0; s < seatsInRow && seatIdx < totalSeats; s++) {
        const angle = startAngle - (s + 0.5) * (startAngle - endAngle) / seatsInRow;
        const x = cx + radius * Math.cos(angle);
        const y = cy - radius * Math.sin(angle);

        const assignment = seatAssignments[seatIdx];
        allSeats.push({
          x,
          y,
          group: assignment.group,
          groupFull: assignment.groupFull,
          color: assignment.color,
        });
        seatIdx++;
      }
    }

    return allSeats;
  }, [groups, width, height]);

  const groupCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const g of groups) counts[g.short] = g.mepCount;
    return counts;
  }, [groups]);

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-auto"
        onMouseLeave={() => { setHoveredGroup(null); setTooltip(null); }}
      >
        {/* Background arc decoration */}
        <path
          d={`M ${width * 0.05} ${height - 20} A ${width * 0.45} ${height * 0.88} 0 0 1 ${width * 0.95} ${height - 20}`}
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
          className="text-slate-200 dark:text-slate-700"
          opacity={0.5}
        />

        {/* Seats */}
        {seats.map((seat, i) => (
          <circle
            key={i}
            cx={seat.x}
            cy={seat.y}
            r={3.5}
            fill={seat.color}
            opacity={hoveredGroup === null || hoveredGroup === seat.group ? 1 : 0.15}
            className="transition-opacity duration-200 cursor-pointer"
            onMouseEnter={(e) => {
              setHoveredGroup(seat.group);
              const rect = (e.target as SVGElement).closest('svg')?.getBoundingClientRect();
              if (rect) {
                setTooltip({
                  x: e.clientX - rect.left,
                  y: e.clientY - rect.top,
                  group: seat.group,
                  count: groupCounts[seat.group] || 0,
                });
              }
            }}
            onMouseMove={(e) => {
              const rect = (e.target as SVGElement).closest('svg')?.getBoundingClientRect();
              if (rect) {
                setTooltip((prev) => prev ? {
                  ...prev,
                  x: e.clientX - rect.left,
                  y: e.clientY - rect.top,
                } : null);
              }
            }}
            onMouseLeave={() => { setHoveredGroup(null); setTooltip(null); }}
          />
        ))}

        {/* Center label */}
        <text
          x={width / 2}
          y={height - 15}
          textAnchor="middle"
          className="fill-slate-500 dark:fill-slate-400 text-xs"
          fontSize="14"
          fontWeight="bold"
        >
          {seats.length}
        </text>
      </svg>

      {/* Tooltip */}
      {tooltip && (
        <div
          className="absolute pointer-events-none bg-slate-900 dark:bg-slate-700 text-white px-3 py-1.5 rounded-lg text-sm shadow-lg z-10 whitespace-nowrap"
          style={{
            left: tooltip.x,
            top: tooltip.y - 40,
            transform: 'translateX(-50%)',
          }}
        >
          <span
            className="inline-block w-2.5 h-2.5 rounded-full mr-1.5"
            style={{ backgroundColor: POLITICAL_GROUP_COLORS[tooltip.group] || '#888' }}
          />
          {tooltip.group}: {tooltip.count} seats
        </div>
      )}

      {/* Legend */}
      <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 mt-3">
        {groups
          .filter((g) => g.mepCount > 0)
          .sort((a, b) => b.mepCount - a.mepCount)
          .map((g) => (
            <button
              key={g.short}
              className={`flex items-center gap-1.5 text-xs transition-opacity ${
                hoveredGroup === null || hoveredGroup === g.short ? 'opacity-100' : 'opacity-40'
              }`}
              onMouseEnter={() => setHoveredGroup(g.short)}
              onMouseLeave={() => setHoveredGroup(null)}
            >
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: POLITICAL_GROUP_COLORS[g.short] || '#888' }}
              />
              <span className="text-slate-600 dark:text-slate-300">{g.short}</span>
              <span className="text-slate-400 dark:text-slate-500">{g.mepCount}</span>
            </button>
          ))}
      </div>
    </div>
  );
}
