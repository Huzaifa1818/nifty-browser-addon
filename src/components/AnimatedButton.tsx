
import { ButtonHTMLAttributes, useState } from "react";
import { cn } from "@/lib/utils";

interface AnimatedButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline";
  size?: "sm" | "md" | "lg";
  className?: string;
}

const AnimatedButton = ({
  children,
  variant = "primary",
  size = "md",
  className,
  ...props
}: AnimatedButtonProps) => {
  const [isPressed, setIsPressed] = useState(false);

  const baseStyles = "inline-flex items-center justify-center rounded-md font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none";
  
  const variantStyles = {
    primary: "bg-primary text-primary-foreground shadow hover:brightness-105",
    secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
    outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground"
  };
  
  const sizeStyles = {
    sm: "text-xs h-8 px-3 py-1",
    md: "text-sm h-10 px-4 py-2",
    lg: "text-base h-12 px-6 py-3"
  };

  return (
    <button
      className={cn(
        baseStyles,
        variantStyles[variant],
        sizeStyles[size],
        isPressed ? "scale-95" : "scale-100",
        className
      )}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onMouseLeave={() => isPressed && setIsPressed(false)}
      {...props}
    >
      {children}
    </button>
  );
};

export default AnimatedButton;
