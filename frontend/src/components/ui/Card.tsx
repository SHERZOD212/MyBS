'use client';

import React from 'react';

interface CardProps {
  title: string;
  value: string | number;
  color?: 'green' | 'red';
}

export default function Card({ title, value, color }: CardProps) {
  let valueClass = 'metric-val';
  if (color === 'green') valueClass += ' green';
  if (color === 'red') valueClass += ' red';

  const cardClass = `metric-card${color === 'red' ? ' red-edge' : ''}`;

  return (
    <div className={cardClass}>
      <div className="metric-lbl">{title}</div>
      <div className={valueClass}>{value}</div>
    </div>
  );
}
