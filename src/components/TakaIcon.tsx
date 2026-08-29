import React from 'react';

interface TakaIconProps {
  className?: string;
}

export const TakaIcon: React.FC<TakaIconProps> = ({ className = 'w-5 h-5' }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`${className} select-none`}
    >
      <text
        x="50%"
        y="17"
        fontSize="17"
        fontFamily="sans-serif"
        fontWeight="bold"
        textAnchor="middle"
        fill="currentColor"
      >
        ৳
      </text>
    </svg>
  );
};

export default TakaIcon;
