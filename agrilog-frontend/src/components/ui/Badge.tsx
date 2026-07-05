import React from 'react';
import styles from '../../css/ui.module.css';

type BadgeVariant = 'success' | 'warning' | 'danger' | 'neutral' | 'primary';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  children: React.ReactNode;
  variant?: BadgeVariant;
}

export function Badge({ children, variant = 'neutral', className = '', ...props }: BadgeProps) {
  return (
    <span className={`${styles.badge} ${styles[variant]} ${className}`} {...props}>
      {children}
    </span>
  );
}
