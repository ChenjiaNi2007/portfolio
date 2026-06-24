import styles from './Intro.module.css';

interface IntroProps {
  onDismiss: () => void;
}

export default function Intro({ onDismiss }: IntroProps) {
  return (
    <div className={styles.overlay} onClick={onDismiss}>
      <div className={styles.card} onClick={(e) => e.stopPropagation()}>
        <div className={styles.globe}>🛰️</div>
        <h1 className={styles.title}>Mission control</h1>
        <p className={styles.subtitle}>
          Steer a satellite scanning Earth to explore my work and travels.
          Pass over a marker to scan it, then zoom in for the full report.
        </p>
        <div className={styles.controls}>
          <div className={styles.controlRow}>
            <kbd>W A S D</kbd> <span>or</span> <kbd>↑ ← ↓ →</kbd>
            <span className={styles.action}>Move N · S · E · W</span>
          </div>
          <div className={styles.controlRow}>
            <kbd>Scroll</kbd> <span>or</span> <kbd>Pinch</kbd>
            <span className={styles.action}>Zoom in / out</span>
          </div>
          <div className={styles.controlRow}>
            <kbd>L</kbd>
            <span className={styles.action}>Scan nearest marker</span>
          </div>
          <div className={styles.controlRow}>
            <kbd>Esc</kbd>
            <span className={styles.action}>Return to orbit</span>
          </div>
          <div className={styles.controlRow}>
            <span>Touch-drag to move · pinch to zoom on mobile</span>
          </div>
        </div>
        <button className={styles.btn} onClick={onDismiss}>
          Launch 🛰️
        </button>
      </div>
    </div>
  );
}
