
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import ExtensionHeader from "@/components/ExtensionHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import UrlConfigItem from "@/components/UrlConfigItem";
import { 
  Play, 
  Square, 
  Plus,
  Settings,
  Upload,
  Download,
  RefreshCw,
  AlertCircle
} from "lucide-react";
import { toast } from "sonner";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface UrlConfig {
  url: string;
  waitTimeMin: number;
  waitTimeMax: number;
  scrollConfig: {
    wheelDistanceMin: number;
    wheelDistanceMax: number;
    scrollSleepTimeMin: number;
    scrollSleepTimeMax: number;
  };
}

// Convert URL configs to automation steps
const generateAutomationSteps = (urlConfigs: UrlConfig[]) => {
  const steps = [];
  
  // Start with new page
  steps.push({
    type: "newPage",
    config: {}
  });
  
  // Add steps for each URL
  urlConfigs.forEach((urlConfig) => {
    // Go to URL
    steps.push({
      type: "gotoUrl",
      config: {
        url: urlConfig.url,
        timeout: 3000 // Add consistent timeout for page loading
      }
    });
    
    // Wait random time
    steps.push({
      type: "waitTime",
      config: {
        timeoutType: "randomInterval",
        timeoutMin: urlConfig.waitTimeMin,
        timeoutMax: urlConfig.waitTimeMax
      }
    });
    
    // Scroll to bottom
    steps.push({
      type: "scrollPage",
      config: {
        scrollType: "wheel",
        position: "bottom",
        randomWheelDistance: [
          urlConfig.scrollConfig.wheelDistanceMin,
          urlConfig.scrollConfig.wheelDistanceMax
        ],
        randomWheelSleepTime: [
          urlConfig.scrollConfig.scrollSleepTimeMin,
          urlConfig.scrollConfig.scrollSleepTimeMax
        ]
      }
    });
    
    // Wait a bit before scrolling back up
    steps.push({
      type: "waitTime",
      config: {
        timeoutType: "randomInterval",
        timeoutMin: 2000,
        timeoutMax: 4000
      }
    });
    
    // Scroll back to top
    steps.push({
      type: "scrollPage",
      config: {
        scrollType: "wheel",
        position: "top",
        randomWheelDistance: [
          urlConfig.scrollConfig.wheelDistanceMin,
          urlConfig.scrollConfig.wheelDistanceMax
        ],
        randomWheelSleepTime: [
          urlConfig.scrollConfig.scrollSleepTimeMin,
          urlConfig.scrollConfig.scrollSleepTimeMax
        ]
      }
    });
  });
  
  // Close page at the end
  steps.push({
    type: "closePage",
    config: {}
  });
  
  return steps;
};

const defaultUrlConfig: UrlConfig = {
  url: "https://example.com",
  waitTimeMin: 5000,
  waitTimeMax: 10000,
  scrollConfig: {
    wheelDistanceMin: 50,
    wheelDistanceMax: 100,
    scrollSleepTimeMin: 500,
    scrollSleepTimeMax: 1000
  }
};

const Index = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [urlConfigs, setUrlConfigs] = useState<UrlConfig[]>([{ ...defaultUrlConfig }]);
  const [jsonConfig, setJsonConfig] = useState("");
  const [showUrlHelp, setShowUrlHelp] = useState(false);
  
  // Check status on load
  useEffect(() => {
    const checkStatus = async () => {
      if (chrome?.runtime && chrome?.runtime.sendMessage) {
        try {
          chrome.runtime.sendMessage({ type: 'GET_STATUS' }, (response) => {
            if (response) {
              setIsRunning(response.isRunning);
              
              // If we have saved configs, convert them to URL configs
              if (response.automationConfig && response.automationConfig.length > 0) {
                // Extract URL configs from automation steps
                const steps = response.automationConfig;
                const extractedConfigs: UrlConfig[] = [];
                
                let currentConfig: Partial<UrlConfig> | null = null;
                
                steps.forEach(step => {
                  if (step.type === "gotoUrl") {
                    currentConfig = { 
                      url: step.config.url,
                      scrollConfig: {
                        wheelDistanceMin: 100,
                        wheelDistanceMax: 200, 
                        scrollSleepTimeMin: 300,
                        scrollSleepTimeMax: 600
                      }
                    };
                  } else if (step.type === "waitTime" && currentConfig) {
                    currentConfig.waitTimeMin = step.config.timeoutMin;
                    currentConfig.waitTimeMax = step.config.timeoutMax;
                  } else if (step.type === "scrollPage" && step.config.position === "bottom" && currentConfig) {
                    currentConfig.scrollConfig = {
                      wheelDistanceMin: step.config.randomWheelDistance[0],
                      wheelDistanceMax: step.config.randomWheelDistance[1],
                      scrollSleepTimeMin: step.config.randomWheelSleepTime[0],
                      scrollSleepTimeMax: step.config.randomWheelSleepTime[1]
                    };
                    
                    // Add the completed config
                    if (currentConfig.url && currentConfig.waitTimeMin && currentConfig.waitTimeMax) {
                      extractedConfigs.push(currentConfig as UrlConfig);
                      currentConfig = null;
                    }
                  }
                });
                
                if (extractedConfigs.length > 0) {
                  setUrlConfigs(extractedConfigs);
                }
              }
            }
          });
        } catch (error) {
          console.log("Not in a Chrome extension context");
        }
      }
    };
    
    checkStatus();
  }, []);
  
  const startAutomation = () => {
    if (chrome?.runtime && chrome?.runtime.sendMessage) {
      const config = generateAutomationSteps(urlConfigs);
      
      chrome.runtime.sendMessage(
        { type: 'START_AUTOMATION', config },
        (response) => {
          if (response && response.success) {
            setIsRunning(true);
            toast.success("Automation started");
          }
        }
      );
    } else {
      toast.error("Extension API not available");
      console.log(generateAutomationSteps(urlConfigs));
    }
  };
  
  const stopAutomation = () => {
    if (chrome?.runtime && chrome?.runtime.sendMessage) {
      chrome.runtime.sendMessage(
        { type: 'STOP_AUTOMATION' },
        (response) => {
          if (response && response.success) {
            setIsRunning(false);
            toast.info("Automation stopped");
          }
        }
      );
    } else {
      setIsRunning(false);
      toast.error("Extension API not available");
    }
  };
  
  const saveConfiguration = () => {
    if (chrome?.runtime && chrome?.runtime.sendMessage) {
      const config = generateAutomationSteps(urlConfigs);
      
      chrome.runtime.sendMessage(
        { type: 'SAVE_CONFIG', config },
        (response) => {
          if (response && response.success) {
            toast.success("Configuration saved");
          }
        }
      );
    } else {
      toast.error("Extension API not available");
    }
  };
  
  const addNewUrl = () => {
    setUrlConfigs([...urlConfigs, { ...defaultUrlConfig }]);
  };
  
  const updateUrlConfig = (index: number, config: UrlConfig) => {
    const newConfigs = [...urlConfigs];
    newConfigs[index] = config;
    setUrlConfigs(newConfigs);
  };
  
  const deleteUrlConfig = (index: number) => {
    if (urlConfigs.length <= 1) {
      toast.error("At least one URL is required");
      return;
    }
    
    const newConfigs = [...urlConfigs];
    newConfigs.splice(index, 1);
    setUrlConfigs(newConfigs);
  };
  
  const importFromJson = () => {
    try {
      const config = JSON.parse(jsonConfig);
      
      // Basic validation
      if (!Array.isArray(config)) {
        throw new Error("Invalid JSON format: expected an array");
      }
      
      // Import into automation system
      if (chrome?.runtime && chrome?.runtime.sendMessage) {
        chrome.runtime.sendMessage(
          { type: 'SAVE_CONFIG', config },
          (response) => {
            if (response && response.success) {
              toast.success("JSON configuration imported");
              // Refresh the page to load the new config
              setTimeout(() => {
                window.location.reload();
              }, 1000);
            }
          }
        );
      } else {
        toast.error("Extension API not available");
      }
    } catch (error) {
      toast.error(`Error importing JSON: ${error.message}`);
    }
  };
  
  const exportToJson = () => {
    const config = generateAutomationSteps(urlConfigs);
    setJsonConfig(JSON.stringify(config, null, 2));
    toast.success("Configuration exported to JSON");
  };
  
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
        title="URL Automation" 
        subtitle="Configure and run automated browsing sequences"
      />
      
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="mb-16"
      >
        <motion.div variants={itemVariants} className="mb-4">
          <div className="flex space-x-3 mb-4">
            {isRunning ? (
              <Button
                variant="destructive"
                className="flex-1"
                disabled={!isRunning}
                onClick={stopAutomation}
              >
                <Square size={18} className="mr-2" />
                Stop Automation
              </Button>
            ) : (
              <Button
                variant="default"
                className="flex-1"
                disabled={isRunning || urlConfigs.length === 0}
                onClick={startAutomation}
              >
                <Play size={18} className="mr-2" />
                Start Automation
              </Button>
            )}
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    disabled={isRunning}
                    onClick={saveConfiguration}
                  >
                    <Settings size={18} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Save current configuration</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </motion.div>
        
        {!isRunning && (
          <>
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-sm font-medium">URL Configuration</h3>
              <div 
                className="cursor-pointer text-blue-500 flex items-center"
                onClick={() => setShowUrlHelp(!showUrlHelp)}
              >
                <AlertCircle size={16} className="mr-1" />
                <span className="text-xs">Help</span>
              </div>
            </div>
            
            {showUrlHelp && (
              <div className="bg-blue-50 p-3 rounded-md mb-4 text-xs text-blue-800">
                <p className="font-medium mb-1">How the automation works:</p>
                <ol className="list-decimal pl-4 space-y-1">
                  <li>Add one or more URLs to visit</li>
                  <li>For each URL, set wait times and scroll speeds</li>
                  <li>Click "Start Automation" to begin the sequence</li>
                  <li>The extension will open a tab and visit each URL</li>
                  <li>At each URL, it will wait, scroll down, then scroll back up</li>
                </ol>
              </div>
            )}
            
            {urlConfigs.map((config, index) => (
              <motion.div key={index} variants={itemVariants}>
                <UrlConfigItem
                  config={config}
                  index={index}
                  onUpdate={updateUrlConfig}
                  onDelete={deleteUrlConfig}
                />
              </motion.div>
            ))}
            
            <motion.div variants={itemVariants} className="mt-4 flex justify-center">
              <Button 
                variant="outline" 
                className="w-full border-dashed"
                onClick={addNewUrl}
                disabled={isRunning}
              >
                <Plus size={18} className="mr-2" />
                Add Another URL
              </Button>
            </motion.div>
          </>
        )}
      </motion.div>
      
      <div className="absolute bottom-0 left-0 right-0 p-4 glass-panel border-t">
        <div className="flex items-center justify-between">
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                disabled={isRunning}
              >
                <Upload size={14} className="mr-2" />
                Import/Export
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Import/Export Configuration</SheetTitle>
                <SheetDescription>
                  Paste your JSON configuration below or export your current settings
                </SheetDescription>
              </SheetHeader>
              <div className="py-4">
                <Textarea
                  placeholder='[{"type":"newPage","config":{}}]'
                  className="h-64 font-mono text-xs"
                  value={jsonConfig}
                  onChange={(e) => setJsonConfig(e.target.value)}
                />
              </div>
              <div className="flex justify-between">
                <Button
                  variant="default" 
                  onClick={importFromJson}
                  disabled={!jsonConfig}
                >
                  <Upload size={14} className="mr-2" />
                  Import
                </Button>
                <Button
                  variant="outline"
                  onClick={exportToJson}
                >
                  <Download size={14} className="mr-2" />
                  Export
                </Button>
              </div>
            </SheetContent>
          </Sheet>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.location.reload()}
          >
            <RefreshCw size={14} />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Index;
