import { Link } from "@tanstack/react-router";

interface LogoProps {
  className?: string;
  linkClassName?: string;
  showText?: boolean;
}

export function Logo({ className = "", linkClassName = "", showText = true }: LogoProps) {
  return (
    <Link to="/" className={`flex items-center gap-2 hover:opacity-80 transition-opacity shrink-0 ${linkClassName}`}>
      <div className={`h-8 w-8 rounded-lg bg-foreground flex items-center justify-center shrink-0 ${className}`}>
        <span className="text-background font-black text-sm leading-none">N</span>
      </div>
      {showText && (
        <span className="font-display font-black text-base text-foreground hidden sm:block">
          Nexora
        </span>
      )}
    </Link>
  );
}
