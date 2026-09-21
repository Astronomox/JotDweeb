export function MoodIcon({
  mood,
  size = 20,
}: {
  mood: string;
  size?: number;
}) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  const eyes = (
    <>
      <circle cx="9" cy="10" r="0.6" fill="currentColor" stroke="none" />
      <circle cx="15" cy="10" r="0.6" fill="currentColor" stroke="none" />
    </>
  );

  return (
    <svg {...common}>
      <circle cx="12" cy="12" r="9" />
      {mood === "heart" ? (
        <>
          <path d="M8.5 9.5c.6-.9 1.9-.9 2.5 0 .6-.9 1.9-.9 2.5 0" />
          <path d="M9 14.5c.9 1.2 4.1 1.2 5 0" />
        </>
      ) : (
        <>
          {eyes}
          {mood === "happy" && <path d="M8 13.5c1.2 1.8 6.8 1.8 8 0" />}
          {mood === "smile" && <path d="M8.5 14c1 1.2 5.5 1.2 6.5 0" />}
          {mood === "neutral" && <path d="M8.5 14.5h7" />}
          {mood === "sad" && <path d="M8.5 15c1-1.2 5.5-1.2 6.5 0" />}
        </>
      )}
    </svg>
  );
}
