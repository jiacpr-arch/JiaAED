type JiaAedLogoProps = {
  className?: string;
  /** "light" = white "jia" for dark backgrounds, "dark" = black "jia" for light backgrounds. */
  variant?: "light" | "dark";
};

export function JiaAedLogo({ className, variant = "light" }: JiaAedLogoProps) {
  const wordColor = variant === "light" ? "#ffffff" : "#111111";

  return (
    <svg
      viewBox="0 0 300 90"
      className={className}
      role="img"
      aria-label="JiaAED"
    >
      <circle cx="20" cy="14" r="6" fill="#dc2626" />
      <circle cx="42" cy="14" r="6" fill="#dc2626" />
      <text
        x="4"
        y="70"
        fontFamily="Georgia, 'Times New Roman', serif"
        fontWeight="700"
        fontSize="64"
        fill={wordColor}
      >
        jia
      </text>
      <polyline
        points="140,52 152,52 158,32 166,64 172,52 184,52"
        fill="none"
        stroke="#dc2626"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <text
        x="178"
        y="70"
        fontFamily="Georgia, 'Times New Roman', serif"
        fontWeight="700"
        fontSize="64"
        fill="#dc2626"
      >
        aed
      </text>
      <g transform="translate(264, 10)">
        <path
          d="M12 22 C2 14 -2 4 6 1 C10 -0.5 12 2 12 5 C12 2 14 -0.5 18 1 C26 4 22 14 12 22 Z"
          fill="#dc2626"
        />
        <path d="M13 3 L8 11 L12 11 L10 18 L17 8 L13 8 Z" fill="#ffffff" />
      </g>
    </svg>
  );
}
