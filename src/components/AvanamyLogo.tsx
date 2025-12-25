import React from 'react';

interface AvanamyLogoProps {
  size?: number;
  variant?: 'color' | 'white' | 'purple';
  className?: string;
  alt?: string;
}

export const AvanamyLogo: React.FC<AvanamyLogoProps> = ({
  size = 56,
  variant = 'color',
  className = '',
  alt = 'Avanamy Logo'
}) => {
  const renderColorVersion = () => (
    <>
      <path 
        d="M2 48 L8 48 L12 40 L16 48 L22 12 L28 48 L34 16 L40 40 L44 32 L48 32 L54 32" 
        stroke="url(#pulseGradient)" 
        strokeWidth="3" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        fill="none"
      />
      <line 
        x1="20" 
        y1="32" 
        x2="36" 
        y2="32" 
        stroke="#00CCFF" 
        strokeWidth="3.5" 
        strokeLinecap="round"
      />
      <circle cx="28" cy="32" r="3.5" fill="#00CCFF"/>
      <defs>
        <linearGradient id="pulseGradient" x1="2" y1="28" x2="54" y2="28">
          <stop offset="0%" stopColor="#B800E6"/>
          <stop offset="50%" stopColor="#00CCFF"/>
          <stop offset="100%" stopColor="#B800E6"/>
        </linearGradient>
      </defs>
    </>
  );

  const renderWhiteVersion = () => (
    <>
      <path 
        d="M2 48 L8 48 L12 40 L16 48 L22 12 L28 48 L34 16 L40 40 L44 32 L48 32 L54 32" 
        stroke="white" 
        strokeWidth="3" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        fill="none"
      />
      <line 
        x1="20" 
        y1="32" 
        x2="36" 
        y2="32" 
        stroke="white" 
        strokeWidth="3.5" 
        strokeLinecap="round"
      />
      <circle cx="28" cy="32" r="3.5" fill="white"/>
    </>
  );

  const renderPurpleVersion = () => (
    <>
      <path 
        d="M2 48 L8 48 L12 40 L16 48 L22 12 L28 48 L34 16 L40 40 L44 32 L48 32 L54 32" 
        stroke="#B800E6" 
        strokeWidth="3" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        fill="none"
      />
      <line 
        x1="20" 
        y1="32" 
        x2="36" 
        y2="32" 
        stroke="#B800E6" 
        strokeWidth="3.5" 
        strokeLinecap="round"
      />
      <circle cx="28" cy="32" r="3.5" fill="#B800E6"/>
    </>
  );

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 56 56"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label={alt}
    >
      {variant === 'color' && renderColorVersion()}
      {variant === 'white' && renderWhiteVersion()}
      {variant === 'purple' && renderPurpleVersion()}
    </svg>
  );
};

export default AvanamyLogo;
