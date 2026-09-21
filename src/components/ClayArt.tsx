export function ClayArt() {
  return (
    <svg
      className="pointer-events-none absolute inset-0 h-full w-full opacity-50"
      viewBox="0 0 400 620"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      <g stroke="#C98F6B" strokeWidth={1.1} fill="none" opacity={0.5}>
        <path d="M-20,120 C80,60 150,180 260,110 S420,140 460,90" />
        <path d="M-20,170 C80,110 150,230 260,160 S420,190 460,140" />
        <path d="M-20,220 C80,160 150,280 260,210 S420,240 460,190" />
        <path d="M-20,470 C80,410 150,530 260,460 S420,490 460,410" />
        <path d="M-20,520 C80,460 150,580 260,510 S420,540 460,460" />
      </g>
      <g fill="#CB8A5E" opacity={0.4}>
        <circle cx="60" cy="330" r="4" />
        <circle cx="120" cy="360" r="3" />
        <circle cx="330" cy="300" r="4" />
        <circle cx="290" cy="350" r="3" />
        <circle cx="360" cy="560" r="4" />
        <circle cx="50" cy="590" r="3" />
      </g>
    </svg>
  );
}
