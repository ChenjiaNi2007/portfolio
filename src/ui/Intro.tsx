import { useEffect } from 'react';
import { site } from '../data/site';
import styles from './Intro.module.css';

interface IntroProps {
  onDismiss: () => void;
}

export default function Intro({ onDismiss }: IntroProps) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onDismiss();
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onDismiss]);

  return (
    <div className={styles.overlay}>
      <div className={styles.grain} aria-hidden />

      <header className={styles.topBar}>
        <span className={styles.brand}>{site.name}</span>
        <span className={styles.brandDim}>Interactive Portfolio</span>
      </header>

      <div className={styles.center}>
        <div className={styles.kicker}>
          <span className={styles.kickerDot} />
          Now in orbit
        </div>

        <h1 className={styles.title}>
          <span className={styles.lineMask}>
            <span className={`${styles.line} ${styles.l1}`}>Explore my work</span>
          </span>
          <span className={styles.lineMask}>
            <span className={`${styles.line} ${styles.l2}`}>from orbit.</span>
          </span>
        </h1>

        <p className={styles.lede}>
          Pilot a satellite across the planet to scan my projects, research, and
          travels — each one pinned where it actually happened.
        </p>

        <div className={styles.actions}>
          <button className={styles.cta} onClick={onDismiss}>
            <span>Begin exploration</span>
            <span className={styles.arrow}>→</span>
          </button>

          <div className={styles.hintRow}>
            <span className={styles.hint}><kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> move</span>
            <span className={styles.dot} />
            <span className={styles.hint}><kbd>Scroll</kbd> zoom</span>
            <span className={styles.dot} />
            <span className={styles.hint}><kbd>L</kbd> scan</span>
          </div>
        </div>
      </div>

      <footer className={styles.bottomBar}>
        <span>Est. 2026</span>
        <span className={styles.bottomMid}>Drag · Scroll · Scan</span>
        <span className={styles.bottomRight}>{site.tagline}</span>
      </footer>
    </div>
  );
}
