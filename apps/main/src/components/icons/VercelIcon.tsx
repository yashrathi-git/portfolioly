import React from "react";

interface VercelIconProps extends React.SVGProps<SVGSVGElement> {
  size?: number;
}

export const VercelIcon: React.FC<VercelIconProps> = ({
  size = 16,
  className,
  ...props
}) => {
  return (
    <svg
      data-testid="geist-icon"
      height={size}
      width={size}
      strokeLinejoin="round"
      viewBox="0 0 16 16"
      className={className}
      {...props}
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M8 1L16 15H0L8 1Z"
        fill="currentColor"
      />
    </svg>
  );
};

export default VercelIcon;