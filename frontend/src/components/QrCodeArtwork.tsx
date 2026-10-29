type QrCodeArtworkProps = {
  className?: string;
};

const moduleCount = 25;

const isFinderModule = (x: number, y: number, originX: number, originY: number) => {
  const localX = x - originX;
  const localY = y - originY;

  if (localX < 0 || localX > 6 || localY < 0 || localY > 6) return null;
  if (localX === 0 || localX === 6 || localY === 0 || localY === 6) return true;
  if (localX === 1 || localX === 5 || localY === 1 || localY === 5) return false;
  return true;
};

const isDarkModule = (x: number, y: number) => {
  const finderOrigins = [
    [0, 0],
    [moduleCount - 7, 0],
    [0, moduleCount - 7],
  ];

  for (const [originX, originY] of finderOrigins) {
    const finderModule = isFinderModule(x, y, originX, originY);
    if (finderModule !== null) return finderModule;
  }

  if (x === 6 || y === 6) return (x + y) % 2 === 0;

  const alignmentX = moduleCount - 7;
  const alignmentY = moduleCount - 7;
  const alignmentDistance = Math.max(Math.abs(x - alignmentX), Math.abs(y - alignmentY));
  if (alignmentDistance <= 2) return alignmentDistance !== 1;

  return ((x * 17 + y * 31 + x * y * 7) % 13) < 6;
};

const modules = Array.from({ length: moduleCount * moduleCount }, (_, index) => {
  const x = index % moduleCount;
  const y = Math.floor(index / moduleCount);
  return { x, y, dark: isDarkModule(x, y) };
});

export default function QrCodeArtwork({ className = 'h-40 w-40' }: QrCodeArtworkProps) {
  return (
    <div className={`rounded-2xl border border-slate-200 bg-white p-2.5 shadow-[0_8px_24px_rgba(15,23,42,0.10)] ${className}`}>
      <svg
        viewBox="0 0 29 29"
        role="img"
        aria-label="Mã QR minh họa VietQR"
        className="block h-full w-full rounded-lg"
        shapeRendering="crispEdges"
      >
        <rect width="29" height="29" fill="white" />
        {modules.filter((module) => module.dark).map(({ x, y }) => (
          <rect
            key={`${x}-${y}`}
            x={x + 2}
            y={y + 2}
            width="1"
            height="1"
            fill="#0f172a"
          />
        ))}
      </svg>
    </div>
  );
}
