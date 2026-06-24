import { site } from '../data/site';
import styles from './Header.module.css';

interface HeaderProps {
  onPassport: () => void;
}

export default function Header({ onPassport }: HeaderProps) {
  return (
    <header className={styles.header}>
      <div className={styles.left}>
        <div className={styles.name}>{site.name}</div>
        <div className={styles.tagline}>{site.tagline}</div>
      </div>
      <nav className={styles.nav}>
        <a href={site.links.github} target="_blank" rel="noreferrer" className={styles.link}>
          GitHub
        </a>
        <a href={site.links.linkedin} target="_blank" rel="noreferrer" className={styles.link}>
          LinkedIn
        </a>
        <a href={site.links.resume} target="_blank" rel="noreferrer" className={styles.linkResume}>
          Resume ↗
        </a>
        <button className={styles.passportBtn} onClick={onPassport} title="Open Passport">
          📕
        </button>
      </nav>
    </header>
  );
}
