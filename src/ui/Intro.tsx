import styles from './Intro.module.css';

interface IntroProps {
  onDismiss: () => void;
}

export default function Intro({ onDismiss }: IntroProps) {
  return (
    <div className={styles.overlay} onClick={onDismiss}>
      <div className={styles.card} onClick={(e) => e.stopPropagation()}>
        <div className={styles.globe}>🌍</div>
        <h1 className={styles.title}>Welcome aboard</h1>
        <p className={styles.subtitle}>
          Pilot a plane around Earth to explore my work and travels.
          Fly close to a pin to discover it, then land to dive deeper.
        </p>
        <div className={styles.controls}>
          <div className={styles.controlRow}>
            <kbd>W A S D</kbd> <span>or</span> <kbd>↑ ← ↓ →</kbd>
            <span className={styles.action}>Steer the plane</span>
          </div>
          <div className={styles.controlRow}>
            <kbd>Scroll</kbd> <span>or</span> <kbd>Pinch</kbd>
            <span className={styles.action}>Zoom in / out</span>
          </div>
          <div className={styles.controlRow}>
            <kbd>L</kbd>
            <span className={styles.action}>Land at nearest pin</span>
          </div>
          <div className={styles.controlRow}>
            <kbd>Esc</kbd>
            <span className={styles.action}>Take off / dismiss</span>
          </div>
          <div className={styles.controlRow}>
            <span>Touch-drag to steer · pinch to zoom on mobile</span>
          </div>
        </div>
        <button className={styles.btn} onClick={onDismiss}>
          Start Flying ✈
        </button>
      </div>
    </div>
  );
}
