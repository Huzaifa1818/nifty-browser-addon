
import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Trash2, Sliders } from "lucide-react";
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

interface UrlConfigItemProps {
  config: UrlConfig;
  index: number;
  onUpdate: (index: number, config: UrlConfig) => void;
  onDelete: (index: number) => void;
}

const UrlConfigItem: React.FC<UrlConfigItemProps> = ({
  config,
  index,
  onUpdate,
  onDelete
}) => {
  const handleChange = (key: keyof UrlConfig, value: string | number) => {
    onUpdate(index, { ...config, [key]: value });
  };

  const handleScrollConfigChange = (key: keyof typeof config.scrollConfig, value: number) => {
    onUpdate(index, {
      ...config,
      scrollConfig: {
        ...config.scrollConfig,
        [key]: value
      }
    });
  };

  return (
    <div className="p-4 border rounded-md mb-4 bg-card shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold flex items-center">
          <span className="bg-primary/10 text-primary px-2 py-1 rounded-md text-xs mr-2">
            #{index + 1}
          </span>
          URL Configuration
        </h3>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => onDelete(index)}
                className="h-8 w-8 p-0"
              >
                <Trash2 size={16} className="text-destructive" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Delete this URL</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      
      <div className="space-y-3">
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">URL to visit</label>
          <Input
            value={config.url}
            onChange={(e) => handleChange("url", e.target.value)}
            placeholder="https://example.com"
            className="mb-2"
          />
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Min Wait (ms)</label>
            <Input
              type="number"
              value={config.waitTimeMin}
              onChange={(e) => handleChange("waitTimeMin", parseInt(e.target.value))}
              min={1000}
              placeholder="5000"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Max Wait (ms)</label>
            <Input
              type="number"
              value={config.waitTimeMax}
              onChange={(e) => handleChange("waitTimeMax", parseInt(e.target.value))}
              min={1000}
              placeholder="10000"
            />
          </div>
        </div>
        
        <Accordion type="single" collapsible className="w-full border-t pt-2 mt-3">
          <AccordionItem value="scrolling-settings" className="border-b-0">
            <AccordionTrigger className="py-2">
              <div className="flex items-center">
                <Sliders className="h-4 w-4 mr-2" />
                <span className="text-sm font-medium">Scrolling Settings</span>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-3 pt-2">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Scroll Step Min (px)</label>
                    <Input
                      type="number"
                      value={config.scrollConfig.wheelDistanceMin}
                      onChange={(e) => handleScrollConfigChange("wheelDistanceMin", parseInt(e.target.value))}
                      min={20}
                      max={200}
                      placeholder="50"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Lower = smoother, slower scrolling
                    </p>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Scroll Step Max (px)</label>
                    <Input
                      type="number"
                      value={config.scrollConfig.wheelDistanceMax}
                      onChange={(e) => handleScrollConfigChange("wheelDistanceMax", parseInt(e.target.value))}
                      min={50}
                      max={300}
                      placeholder="100"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Higher = faster scrolling
                    </p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Pause Min (ms)</label>
                    <Input
                      type="number"
                      value={config.scrollConfig.scrollSleepTimeMin}
                      onChange={(e) => handleScrollConfigChange("scrollSleepTimeMin", parseInt(e.target.value))}
                      min={100}
                      max={1000}
                      placeholder="500"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Time between scroll steps
                    </p>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Pause Max (ms)</label>
                    <Input
                      type="number"
                      value={config.scrollConfig.scrollSleepTimeMax}
                      onChange={(e) => handleScrollConfigChange("scrollSleepTimeMax", parseInt(e.target.value))}
                      min={300}
                      max={2000}
                      placeholder="1000"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Higher = more natural pauses
                    </p>
                  </div>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </div>
  );
};

export default UrlConfigItem;
