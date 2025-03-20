
import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface FeatureCardProps {
  icon: ReactNode;
  title: string;
  description: string;
  className?: string;
  onClick?: () => void;
  delay?: number;
}

const FeatureCard = ({ 
  icon, 
  title, 
  description, 
  className,
  onClick,
  delay = 0
}: FeatureCardProps) => {
  return (
    <div
      className={cn(
        "glass-panel rounded-xl p-4 hover-lift cursor-pointer animate-slide-up",
        className
      )}
      onClick={onClick}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-start space-x-4">
        <div className="flex-shrink-0 p-1.5 bg-primary/10 text-primary rounded-lg">
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium text-foreground">{title}</h3>
          <p className="mt-1 text-xs text-muted-foreground text-balance">
            {description}
          </p>
        </div>
      </div>
    </div>
  );
};

export default FeatureCard;
