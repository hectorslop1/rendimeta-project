"use client";

interface EmployeeScoreRingProps {
  totalPoints: number;
  salesPoints: number;
  attendancePoints: number;
  streakPoints: number;
  bonusPoints: number;
}

interface Segment {
  label: string;
  value: number;
  color: string;
  tailwindColor: string;
}

export function EmployeeScoreRing({
  totalPoints,
  salesPoints,
  attendancePoints,
  streakPoints,
  bonusPoints,
}: EmployeeScoreRingProps) {
  const segments: Segment[] = [
    { label: "Ventas", value: salesPoints, color: "#e11d48", tailwindColor: "bg-rose-600" },
    { label: "Asistencia", value: attendancePoints, color: "#2563eb", tailwindColor: "bg-blue-600" },
    { label: "Racha", value: streakPoints, color: "#f59e0b", tailwindColor: "bg-amber-500" },
    { label: "Bonos", value: bonusPoints, color: "#10b981", tailwindColor: "bg-emerald-500" },
  ];

  const size = 140;
  const cx = size / 2;
  const cy = size / 2;
  const radius = 55;
  const strokeWidth = 18;

  // Build arc paths
  let currentAngle = -90; // start from top
  const arcs = segments
    .filter((s) => s.value > 0)
    .map((seg) => {
      const pct = totalPoints > 0 ? seg.value / totalPoints : 0;
      const angle = pct * 360;
      const startAngle = currentAngle;
      const endAngle = currentAngle + angle;
      currentAngle = endAngle;

      const startRad = (startAngle * Math.PI) / 180;
      const endRad = (endAngle * Math.PI) / 180;

      const x1 = cx + radius * Math.cos(startRad);
      const y1 = cy + radius * Math.sin(startRad);
      const x2 = cx + radius * Math.cos(endRad);
      const y2 = cy + radius * Math.sin(endRad);

      const largeArc = angle > 180 ? 1 : 0;

      const d = `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`;

      return { ...seg, d };
    });

  return (
    <div className="flex items-center gap-6">
      {/* Ring */}
      <div className="relative flex-shrink-0">
        <svg width={size} height={size}>
          {/* Background circle */}
          <circle
            cx={cx}
            cy={cy}
            r={radius}
            fill="none"
            strokeWidth={strokeWidth}
            className="stroke-gray-200 dark:stroke-gray-700"
          />
          {/* Segments */}
          {arcs.map((arc) => (
            <path
              key={arc.label}
              d={arc.d}
              fill="none"
              stroke={arc.color}
              strokeWidth={strokeWidth}
              strokeLinecap="butt"
            />
          ))}
        </svg>
        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-bold text-gray-900 dark:text-gray-100">
            {totalPoints.toLocaleString("es-MX")}
          </span>
          <span className="text-[10px] text-gray-500 dark:text-gray-400">
            puntos
          </span>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-col gap-2">
        {segments.map((seg) => (
          <div key={seg.label} className="flex items-center gap-2">
            <div className={`h-3 w-3 rounded-full ${seg.tailwindColor}`} />
            <span className="text-xs text-gray-600 dark:text-gray-400">
              {seg.label}
            </span>
            <span className="text-xs font-semibold text-gray-900 dark:text-gray-100">
              {seg.value.toLocaleString("es-MX")}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
