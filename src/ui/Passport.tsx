import { useEffect } from 'react';
import locations from '../data/locations';
import type { ProjectLocation } from '../data/locations';
import styles from './Passport.module.css';

interface PassportProps {
  open: boolean;
  visitedIds: Set<string>;
  onClose: () => void;
  onFlyTo: (id: string) => void;
}

export default function Passport({ open, visitedIds, onClose, onFlyTo }: PassportProps) {
  const important = locations.filter(
    (l): l is ProjectLocation => l.type === 'project' && l.important,
  );

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape' && open) onClose();
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  return (
    <>
      {open && <div className={styles.backdrop} onClick={onClose} />}
      <aside className={`${styles.panel} ${open ? styles.open : ''}`}>
        <div className={styles.cover}>
          <div className={styles.coverEmblem}>✈</div>
          <div className={styles.coverTitle}>PORTFOLIO PASSPORT</div>
          <div className={styles.coverSub}>Explore · Discover · Land</div>
        </div>

        <button className={styles.closeBtn} onClick={onClose} aria-label="Close passport">
          ✕
        </button>

        <div className={styles.body}>
          <div className={styles.sectionLabel}>Featured Projects</div>
          <p className={styles.hint}>Click to fly to a project location</p>
          <ul className={styles.list}>
            {important.map((loc) => {
              const visited = visitedIds.has(loc.id);
              return (
                <li key={loc.id} className={styles.entry}>
                  <button
                    className={`${styles.entryBtn} ${visited ? styles.visited : ''}`}
                    onClick={() => {
                      onFlyTo(loc.id);
                      onClose();
                    }}
                  >
                    <div className={styles.stamp}>
                      {visited ? '✦' : '○'}
                    </div>
                    <div className={styles.entryContent}>
                      <div className={styles.entryTitle}>{loc.title}</div>
                      <div className={styles.entryCity}>{loc.city}</div>
                      <div className={styles.entryTech}>{loc.tech.slice(0, 3).join(' · ')}</div>
                    </div>
                    {visited && <div className={styles.visitedBadge}>Visited</div>}
                  </button>
                </li>
              );
            })}
          </ul>

          {visitedIds.size > 0 && (
            <div className={styles.visitedCount}>
              {visitedIds.size} location{visitedIds.size !== 1 ? 's' : ''} visited
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
