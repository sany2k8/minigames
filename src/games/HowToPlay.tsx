import type { ReactNode } from 'react';
import './games.css';

export interface HtpStep {
  icon: ReactNode;
  text: string;
}

/**
 * Reusable "How to Play" intro overlay shown over a game board before play
 * begins. Games render it while a `ready` flag is false and start their timers /
 * bots only once the player taps the CTA, so nobody is dropped into a game they
 * haven't read the rules for. Uses the legacy in-game design tokens.
 */
export function HowToPlay({
  title,
  tagline,
  icon,
  steps,
  onStart,
  accent = '#41d3bd',
  accent2 = '#2f9e4f',
  cta = 'Play'
}: {
  title: string;
  tagline?: string;
  icon?: ReactNode;
  steps: HtpStep[];
  onStart: () => void;
  accent?: string;
  accent2?: string;
  cta?: string;
}) {
  const grad = `linear-gradient(145deg, ${accent}, ${accent2})`;
  return (
    <div className="htp-overlay">
      <div className="htp-card">
        {icon && (
          <div className="htp-icon" style={{ background: grad }}>
            <div className="htp-icon-inner">{icon}</div>
          </div>
        )}
        <div className="htp-title">How to play</div>
        <div className="htp-game">{title}</div>
        {tagline && <div className="htp-sub">{tagline}</div>}
        <div className="htp-steps">
          {steps.map((s, i) => (
            <div className="htp-step" key={i}>
              <div className="htp-step-ic">{s.icon}</div>
              <div className="htp-step-tx">{s.text}</div>
            </div>
          ))}
        </div>
        <button className="htp-btn" style={{ background: grad }} onClick={onStart}>
          {cta}
        </button>
      </div>
    </div>
  );
}
