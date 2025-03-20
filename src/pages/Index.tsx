
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import ExtensionHeader from "@/components/ExtensionHeader";
import FeatureCard from "@/components/FeatureCard";
import AnimatedButton from "@/components/AnimatedButton";
import { 
  Star, 
  Bookmark, 
  Share2, 
  Settings, 
  Search,
  Link,
  Eye,
  Lock
} from "lucide-react";

const Index = () => {
  const [currentUrl, setCurrentUrl] = useState<string>("");
  const [activeTab, setActiveTab] = useState<string>("features");
  
  // Simulate getting current tab URL (Chrome API not available in preview)
  useEffect(() => {
    const mockUrl = "https://example.com/current-page";
    
    // In a real extension, this would use:
    // chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
    //   setCurrentUrl(tabs[0].url || "");
    // });
    
    setTimeout(() => {
      setCurrentUrl(mockUrl);
    }, 300);
  }, []);

  const features = [
    {
      icon: <Bookmark size={18} />,
      title: "Save for later",
      description: "Bookmark this page to your collection",
      onClick: () => console.log("Bookmark clicked")
    },
    {
      icon: <Share2 size={18} />,
      title: "Share page",
      description: "Share this page via email or social media",
      onClick: () => console.log("Share clicked")
    },
    {
      icon: <Star size={18} />,
      title: "Add to favorites",
      description: "Add this page to your favorites list",
      onClick: () => console.log("Favorite clicked")
    },
    {
      icon: <Eye size={18} />,
      title: "Reader mode",
      description: "View this page in a clean, distraction-free format",
      onClick: () => console.log("Reader mode clicked")
    }
  ];
  
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };
  
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 24
      }
    }
  };

  return (
    <div className="extension-container p-4 bg-background">
      <ExtensionHeader 
        title="Web Extension" 
        subtitle="Enhance your browsing experience"
      />
      
      <div className="mt-4 mb-6">
        <div className="glass-panel rounded-lg px-3 py-2 flex items-center space-x-2 animate-fade-in">
          <Link size={14} className="text-muted-foreground" />
          <p className="text-xs text-muted-foreground truncate flex-1">
            {currentUrl || "Loading..."}
          </p>
          <Lock size={14} className="text-muted-foreground" />
        </div>
      </div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-3"
      >
        {features.map((feature, index) => (
          <motion.div key={index} variants={itemVariants}>
            <FeatureCard
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
              onClick={feature.onClick}
            />
          </motion.div>
        ))}
      </motion.div>

      <div className="absolute bottom-0 left-0 right-0 p-4 glass-panel border-t">
        <div className="flex items-center justify-between">
          <AnimatedButton
            variant="outline"
            size="sm"
            onClick={() => console.log("Search clicked")}
          >
            <Search size={14} className="mr-2" />
            Search
          </AnimatedButton>
          
          <AnimatedButton
            variant="outline"
            size="sm"
            onClick={() => console.log("Settings clicked")}
          >
            <Settings size={14} className="mr-2" />
            Settings
          </AnimatedButton>
        </div>
      </div>
    </div>
  );
};

export default Index;
