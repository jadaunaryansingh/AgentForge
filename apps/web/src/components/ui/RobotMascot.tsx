import React, { useState, useEffect } from 'react';

export type RobotMode = 'idle' | 'thinking' | 'happy' | 'working';

interface RobotMascotProps {
  mode?: RobotMode;
  message?: string;
  size?: number;
  className?: string;
  showBubble?: boolean;
  position?: 'fixed-br' | 'fixed-bl' | 'inline';
}

const defaultMessages: Record<RobotMode, string[]> = {
  idle: [
    'Ready to architect your AI system!',
    'What shall we build today?',
    'I can design multi-agent graphs for you!',
  ],
  thinking: [
    'Analyzing your requirements...',
    'Designing the perfect agent graph...',
    'Calculating optimal node topology...',
  ],
  happy: [
    'Architecture generated successfully! 🎉',
    'Your AI system is ready to deploy!',
    'Great work, engineer!',
  ],
  working: [
    'Compiling LangGraph code...',
    'Running AI pipeline...',
    'Synthesizing agent logic...',
  ],
};

export const RobotMascot: React.FC<RobotMascotProps> = ({
  mode = 'idle',
  message,
  size = 80,
  className = '',
  showBubble = true,
  position = 'fixed-br',
}) => {
  const [bubbleMsg, setBubbleMsg] = useState('');
  const [showMsg, setShowMsg] = useState(true);
  const [msgIdx, setMsgIdx] = useState(0);

  useEffect(() => {
    const msgs = defaultMessages[mode];
    setBubbleMsg(message || msgs[0]);
    setMsgIdx(0);
    setShowMsg(true);
  }, [mode, message]);

  useEffect(() => {
    if (message) return;
    const msgs = defaultMessages[mode];
    const interval = setInterval(() => {
      setShowMsg(false);
      setTimeout(() => {
        const next = (msgIdx + 1) % msgs.length;
        setMsgIdx(next);
        setBubbleMsg(msgs[next]);
        setShowMsg(true);
      }, 400);
    }, 4000);
    return () => clearInterval(interval);
  }, [mode, msgIdx, message]);

  const posClass =
    position === 'fixed-br'
      ? 'robot-mascot-fixed-br'
      : position === 'fixed-bl'
      ? 'robot-mascot-fixed-bl'
      : 'robot-mascot-inline';

  const alignStyle: React.CSSProperties =
    position === 'fixed-br'
      ? { alignItems: 'flex-end' }
      : position === 'fixed-bl'
      ? { alignItems: 'flex-start' }
      : { alignItems: 'center' };

  return (
    <div className={`robot-mascot-wrapper ${posClass} ${className}`} style={alignStyle}>
      {showBubble && bubbleMsg && (
        <div className={`robot-speech-bubble ${showMsg ? 'visible' : 'hidden'}`}>
          <span>{bubbleMsg}</span>
          <div className="bubble-tail" />
        </div>
      )}
      <div
        className={`robot-body robot-mode-${mode}`}
        style={{ width: size, height: size * 1.2 }}
      >
        <svg
          viewBox="0 0 100 120"
          xmlns="http://www.w3.org/2000/svg"
          className="robot-svg"
          role="img"
          aria-label="AgentForge AI Robot Mascot"
        >
          {/* Glow filter */}
          <defs>
            <filter id="robot-glow">
              <feGaussianBlur stdDeviation="3" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <linearGradient id="bodyGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#6366f1" />
              <stop offset="100%" stopColor="#8b5cf6" />
            </linearGradient>
            <linearGradient id="headGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#7c83fd" />
              <stop offset="100%" stopColor="#a78bfa" />
            </linearGradient>
            <linearGradient id="screenGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#0ea5e9" />
              <stop offset="100%" stopColor="#6366f1" />
            </linearGradient>
          </defs>

          {/* Shadow/ground glow */}
          <ellipse cx="50" cy="118" rx="22" ry="4" fill="rgba(99,102,241,0.25)" className="robot-ground-shadow" />

          {/* Body */}
          <rect x="25" y="60" width="50" height="42" rx="10" fill="url(#bodyGrad)" filter="url(#robot-glow)" />
          {/* Body panel lines */}
          <rect x="33" y="72" width="34" height="20" rx="5" fill="url(#screenGrad)" opacity="0.9" />
          {/* Screen dots */}
          <circle cx="40" cy="82" r="2.5" fill="#fff" opacity="0.9" />
          <circle cx="50" cy="82" r="2.5" fill="#fff" opacity="0.9" />
          <circle cx="60" cy="82" r="2.5" fill="#fff" opacity="0.9" />

          {/* Neck */}
          <rect x="43" y="53" width="14" height="10" rx="3" fill="#5558c8" />

          {/* Head */}
          <rect x="20" y="20" width="60" height="38" rx="14" fill="url(#headGrad)" filter="url(#robot-glow)" />

          {/* Face plate */}
          <rect x="28" y="27" width="44" height="24" rx="8" fill="rgba(255,255,255,0.12)" />

          {/* Eyes */}
          <ellipse cx="38" cy="39" rx="7" ry="7" fill="rgba(255,255,255,0.15)" />
          <ellipse cx="62" cy="39" rx="7" ry="7" fill="rgba(255,255,255,0.15)" />
          {/* Eye glow */}
          <ellipse cx="38" cy="39" rx="4.5" ry="4.5" fill="#38bdf8" className="robot-eye" filter="url(#robot-glow)" />
          <ellipse cx="62" cy="39" rx="4.5" ry="4.5" fill="#38bdf8" className="robot-eye" filter="url(#robot-glow)" />
          {/* Eye pupils */}
          <circle cx="38" cy="39" r="2" fill="#fff" />
          <circle cx="62" cy="39" r="2" fill="#fff" />
          {/* Eye shine */}
          <circle cx="40" cy="37" r="1" fill="rgba(255,255,255,0.9)" />
          <circle cx="64" cy="37" r="1" fill="rgba(255,255,255,0.9)" />

          {/* Mouth / expression based on mode */}
          {(mode === 'happy') && (
            <path d="M 38 49 Q 50 56 62 49" stroke="#fff" strokeWidth="2" fill="none" strokeLinecap="round" />
          )}
          {(mode === 'idle' || mode === 'working') && (
            <rect x="38" y="49" width="24" height="3" rx="1.5" fill="rgba(255,255,255,0.5)" />
          )}
          {(mode === 'thinking') && (
            <path d="M 40 50 Q 50 47 60 50" stroke="rgba(255,255,255,0.5)" strokeWidth="2" fill="none" strokeLinecap="round" />
          )}

          {/* Antenna */}
          <line x1="50" y1="20" x2="50" y2="8" stroke="#a78bfa" strokeWidth="3" strokeLinecap="round" />
          <circle cx="50" cy="6" r="4" fill="#f0abfc" filter="url(#robot-glow)" className="robot-antenna-orb" />
          <circle cx="50" cy="6" r="2" fill="#fff" />

          {/* Left Arm */}
          <rect x="10" y="62" width="14" height="28" rx="7" fill="#5558c8" className="robot-arm-left" />
          <circle cx="17" cy="94" r="5.5" fill="#6366f1" />

          {/* Right Arm */}
          <rect x="76" y="62" width="14" height="28" rx="7" fill="#5558c8" className="robot-arm-right" />
          <circle cx="83" cy="94" r="5.5" fill="#6366f1" />

          {/* Legs */}
          <rect x="31" y="99" width="14" height="16" rx="5" fill="#4f46e5" />
          <rect x="55" y="99" width="14" height="16" rx="5" fill="#4f46e5" />
          {/* Feet */}
          <rect x="28" y="112" width="18" height="6" rx="4" fill="#3730a3" />
          <rect x="54" y="112" width="18" height="6" rx="4" fill="#3730a3" />
        </svg>
      </div>
    </div>
  );
};

export default RobotMascot;
