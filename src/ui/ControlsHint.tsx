import { useState } from 'react';
import styles from './ControlsHint.module.css';

export default function ControlsHint() {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;
  return (
    <div className={styles.hint}>
      <span>WASD / Arrow keys to move · Scroll to zoom · L to scan</span>
      <button className={styles.close} onClick={() => setDismissed(true)}>✕</button>
    </div>
  );
}
