import type { ReactNode } from 'react';

import styles from './section.module.scss';

interface SectionProps {
  label: string;
  children: ReactNode;
}

export default function Section({ label, children }: SectionProps) {
  return (
    <div className={styles.section}>
      <div className={styles.label}>{label}</div>
      <div className={styles.content}>{children}</div>
    </div>
  );
}
