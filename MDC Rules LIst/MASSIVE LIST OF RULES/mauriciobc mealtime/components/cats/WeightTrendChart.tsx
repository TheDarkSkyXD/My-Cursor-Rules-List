import * as React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { H3 } from "@/components/ui/typography";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface WeightEntry {
  date: string;
  weight: number;
}
interface FeedingEntry {
  date: string;
  count: number;
}
interface WeightTrendChartProps {
  weights: WeightEntry[];
  feedings: FeedingEntry[];
}

const ranges = [30, 60, 90];

export function WeightTrendChart({ weights, feedings }: WeightTrendChartProps) {
  const [range, setRange] = React.useState(30);
  const [openIndex, setOpenIndex] = React.useState<number | null>(null);
  // Swipe gesture state
  const touchStartX = React.useRef<number | null>(null);
  const lastX = React.useRef<number | null>(null);

  function handleTouchStart(e: React.TouchEvent<HTMLDivElement>) {
    touchStartX.current = e.touches[0].clientX;
    lastX.current = e.touches[0].clientX;
  }
  function handleTouchMove(e: React.TouchEvent<HTMLDivElement>) {
    lastX.current = e.touches[0].clientX;
  }
  function handleTouchEnd(e: React.TouchEvent<HTMLDivElement>) {
    if (touchStartX.current === null || lastX.current === null) return;
    const deltaX = lastX.current - touchStartX.current;
    const currentIdx = ranges.indexOf(range);
    if (deltaX < -50 && currentIdx < ranges.length - 1) {
      setRange(ranges[currentIdx + 1]); // swipe left: next range
    } else if (deltaX > 50 && currentIdx > 0) {
      setRange(ranges[currentIdx - 1]); // swipe right: prev range
    }
    touchStartX.current = null;
    lastX.current = null;
  }
  function handlePointerDown(e: React.PointerEvent<HTMLDivElement>) {
    const pointerType = e.pointerType ?? (e.nativeEvent as any).pointerType;
    const clientX = e.clientX ?? (e.nativeEvent as any).clientX;
    if (pointerType === 'touch' || pointerType === 'pen' || pointerType === 'mouse') {
      touchStartX.current = clientX;
      lastX.current = clientX;
    }
  }
  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    const pointerType = e.pointerType ?? (e.nativeEvent as any).pointerType;
    const clientX = e.clientX ?? (e.nativeEvent as any).clientX;
    if (pointerType === 'touch' || pointerType === 'pen' || pointerType === 'mouse') {
      lastX.current = clientX;
    }
  }
  function handlePointerUp(e: React.PointerEvent<HTMLDivElement>) {
    const pointerType = e.pointerType ?? (e.nativeEvent as any).pointerType;
    const clientX = e.clientX ?? (e.nativeEvent as any).clientX;
    if (touchStartX.current === null || lastX.current === null) return;
    const deltaX = lastX.current - touchStartX.current;
    const currentIdx = ranges.indexOf(range);
    if (deltaX < -50 && currentIdx < ranges.length - 1) {
      setRange(ranges[currentIdx + 1]);
    } else if (deltaX > 50 && currentIdx > 0) {
      setRange(ranges[currentIdx - 1]);
    }
    touchStartX.current = null;
    lastX.current = null;
  }

  // Mouse event handlers for swipe (for test and desktop support)
  function handleMouseDown(e: React.MouseEvent<HTMLDivElement>) {
    touchStartX.current = e.clientX;
    lastX.current = e.clientX;
  }
  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    lastX.current = e.clientX;
  }
  function handleMouseUp(e: React.MouseEvent<HTMLDivElement>) {
    if (touchStartX.current === null || lastX.current === null) return;
    const deltaX = lastX.current - touchStartX.current;
    const currentIdx = ranges.indexOf(range);
    if (deltaX < -50 && currentIdx < ranges.length - 1) {
      setRange(ranges[currentIdx + 1]);
    } else if (deltaX > 50 && currentIdx > 0) {
      setRange(ranges[currentIdx - 1]);
    }
    touchStartX.current = null;
    lastX.current = null;
  }

  return (
    <div>
      <H3>Weight Trend</H3>
      <div className="flex gap-2 mb-4">
        {ranges.map((r) => (
          <Button
            key={r}
            variant="outline"
            aria-pressed={range === r}
            onClick={() => setRange(r)}
          >
            {r} days
          </Button>
        ))}
      </div>
      <div
        data-testid="trend-swipe-area"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        style={{ touchAction: 'pan-y' }}
      >
        <ul>
          {weights.map((w, i) => {
            const feeding = feedings.find((f) => f.date === w.date);
            return (
              <li key={w.date} className="flex items-center gap-2 mb-2">
                <Popover open={openIndex === i} onOpenChange={(open) => setOpenIndex(open ? i : null)}>
                  <PopoverTrigger asChild>
                    <span
                      tabIndex={0}
                      role="button"
                      onClick={() => setOpenIndex(i)}
                      onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && setOpenIndex(i)}
                      className="underline cursor-pointer"
                    >
                      {w.date}
                    </span>
                  </PopoverTrigger>
                  <PopoverContent role="dialog">
                    <div><strong>Date:</strong> {w.date}</div>
                    <div><strong>Weight:</strong> {w.weight}</div>
                    {feeding && <div><strong>Feedings:</strong> {feeding.count}</div>}
                  </PopoverContent>
                </Popover>
                <span>{w.weight} kg</span>
                {feeding && (
                  <Badge>
                    {feeding.count} feedings
                  </Badge>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
} 