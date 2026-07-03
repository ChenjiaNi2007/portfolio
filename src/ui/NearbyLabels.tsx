import { useMemo } from 'react';
import { useMarkers } from '../lib/markerStore';
import styles from './NearbyLabels.module.css';

const CARD_W = 212;
const CARD_H = 122; // approximate rendered height (title + city + 2-line summary + button)
const GAP = 12;
const ANCHOR_GAP = 38; // horizontal offset between pin and its card
const TOP_MARGIN = 70;
const BOTTOM_MARGIN = 12;

interface NearbyLabelsProps {
  viewport: { w: number; h: number };
  onLand: (id: string) => void;
}

// Lays the projected markers out as non-overlapping cards: each card sits beside its
// pin, but cards are pushed apart vertically when they would collide, and a leader
// line connects every card back to its true pin position.
export default function NearbyLabels({ viewport, onLand }: NearbyLabelsProps) {
  const markers = useMarkers();

  const laid = useMemo(() => {
    const sorted = [...markers].sort((a, b) => a.y - b.y);

    // Pass 1: place each card near its pin's height, pushing down to clear the one above.
    let prevBottom = -Infinity;
    const placed = sorted.map((m) => {
      let cardY = m.y - CARD_H / 2;
      if (cardY < TOP_MARGIN) cardY = TOP_MARGIN;
      if (cardY < prevBottom + GAP) cardY = prevBottom + GAP;
      prevBottom = cardY + CARD_H;
      return { ...m, cardY };
    });

    // Pass 2: if the stack runs off the bottom, slide the whole column up (never above
    // the top margin) so cards stay evenly spaced instead of piling on the last slot.
    const maxBottom = viewport.h - BOTTOM_MARGIN;
    if (placed.length > 0) {
      const overflow = prevBottom - maxBottom;
      if (overflow > 0) {
        const shift = Math.min(overflow, placed[0].cardY - TOP_MARGIN);
        if (shift > 0) for (const p of placed) p.cardY -= shift;
      }
    }

    // Pass 3: pick a side, then hard-clamp both axes so a card can never leave the screen
    // (even if that means a slight overlap when many markers are clustered at once).
    const maxCardY = Math.max(TOP_MARGIN, viewport.h - CARD_H - BOTTOM_MARGIN);
    return placed.map((m) => {
      const side: 'left' | 'right' = m.x > viewport.w * 0.6 ? 'left' : 'right';
      let cardX = side === 'right' ? m.x + ANCHOR_GAP : m.x - CARD_W - ANCHOR_GAP;
      cardX = Math.max(12, Math.min(viewport.w - CARD_W - 12, cardX));
      const cardY = Math.max(TOP_MARGIN, Math.min(maxCardY, m.cardY));
      return { ...m, cardX, cardY, side };
    });
  }, [markers, viewport.w, viewport.h]);

  if (markers.length === 0) return null;

  return (
    <div className={styles.layer}>
      <svg className={styles.lines} width={viewport.w} height={viewport.h}>
        {laid.map((m) => {
          const connectX = m.side === 'right' ? m.cardX : m.cardX + CARD_W;
          const connectY = m.cardY + CARD_H / 2;
          return (
            <g key={m.id}>
              <line
                x1={m.x}
                y1={m.y}
                x2={connectX}
                y2={connectY}
                className={m.type === 'project' ? styles.lineProject : styles.linePhoto}
              />
              <circle
                cx={m.x}
                cy={m.y}
                r={3.5}
                className={m.type === 'project' ? styles.dotProject : styles.dotPhoto}
              />
            </g>
          );
        })}
      </svg>

      {laid.map((m) => (
        <div
          key={m.id}
          className={`${styles.card} ${m.type === 'project' ? styles.cardProject : styles.cardPhoto}`}
          style={{ transform: `translate3d(${m.cardX}px, ${m.cardY}px, 0)`, width: CARD_W }}
        >
          <div className={styles.title}>{m.title}</div>
          <div className={styles.city}>{m.city}</div>
          <div className={styles.summary}>{m.summary}</div>
          <button
            className={`${styles.scan} ${m.type === 'project' ? styles.scanProject : styles.scanPhoto}`}
            onClick={() => onLand(m.id)}
          >
            {m.type === 'project' ? '🛰 Scan location' : '📷 Capture'}
          </button>
        </div>
      ))}
    </div>
  );
}
