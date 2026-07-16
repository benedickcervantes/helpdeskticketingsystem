import Image from 'next/image';

export const FPDC_LOGO_SRC = '/fpdc-logo.png';

const sizeClasses = {
  sm: 'w-8 h-8',
  md: 'w-8 h-8 sm:w-10 sm:h-10',
  lg: 'w-10 h-10',
  xl: 'h-14 w-14',
};

const roundedClasses = {
  sm: 'rounded-lg',
  md: 'rounded-xl',
  lg: 'rounded-xl',
  xl: 'rounded-2xl',
};

interface FpdcLogoProps {
  size?: keyof typeof sizeClasses;
  className?: string;
  priority?: boolean;
}

export function FpdcLogo({
  size = 'md',
  className = '',
  priority = false,
}: FpdcLogoProps) {
  return (
    <div
      className={`${sizeClasses[size]} ${roundedClasses[size]} bg-white flex items-center justify-center shadow-lg overflow-hidden p-0.5 ${className}`}
    >
      <Image
        src={FPDC_LOGO_SRC}
        alt="FPDC logo"
        width={112}
        height={112}
        className="w-full h-full object-contain"
        priority={priority}
      />
    </div>
  );
}
