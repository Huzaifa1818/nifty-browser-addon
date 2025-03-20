
import { useState, useEffect } from "react";
import { motion } from "framer-motion";

interface ExtensionHeaderProps {
  title: string;
  subtitle?: string;
}

const ExtensionHeader = ({ title, subtitle }: ExtensionHeaderProps) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="py-4 px-1">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
        {subtitle && (
          <motion.p 
            className="text-sm text-muted-foreground mt-1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.3 }}
          >
            {subtitle}
          </motion.p>
        )}
      </motion.div>
    </div>
  );
};

export default ExtensionHeader;
