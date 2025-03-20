
import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Trash2, Plus } from "lucide-react";

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
    <div className="p-4 border rounded-md mb-4 bg-card">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium">URL #{index + 1}</h3>
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => onDelete(index)}
        >
          <Trash2 size={16} className="text-destructive" />
        </Button>
      </div>
      
      <div className="space-y-3">
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">URL</label>
          <Input
            value={config.url}
            onChange={(e) => handleChange("url", e.target.value)}
            placeholder="https://example.com"
          />
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Wait Min (ms)</label>
            <Input
              type="number"
              value={config.waitTimeMin}
              onChange={(e) => handleChange("waitTimeMin", parseInt(e.target.value))}
              min={1000}
              placeholder="20000"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Wait Max (ms)</label>
            <Input
              type="number"
              value={config.waitTimeMax}
              onChange={(e) => handleChange("waitTimeMax", parseInt(e.target.value))}
              min={1000}
              placeholder="30000"
            />
          </div>
        </div>
        
        <details className="text-sm">
          <summary className="cursor-pointer font-medium mb-2">Scroll Settings</summary>
          <div className="pl-2 pt-2 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Wheel Dist Min</label>
                <Input
                  type="number"
                  value={config.scrollConfig.wheelDistanceMin}
                  onChange={(e) => handleScrollConfigChange("wheelDistanceMin", parseInt(e.target.value))}
                  min={50}
                  placeholder="100"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Wheel Dist Max</label>
                <Input
                  type="number"
                  value={config.scrollConfig.wheelDistanceMax}
                  onChange={(e) => handleScrollConfigChange("wheelDistanceMax", parseInt(e.target.value))}
                  min={50}
                  placeholder="200"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Sleep Time Min (ms)</label>
                <Input
                  type="number"
                  value={config.scrollConfig.scrollSleepTimeMin}
                  onChange={(e) => handleScrollConfigChange("scrollSleepTimeMin", parseInt(e.target.value))}
                  min={100}
                  placeholder="300"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Sleep Time Max (ms)</label>
                <Input
                  type="number"
                  value={config.scrollConfig.scrollSleepTimeMax}
                  onChange={(e) => handleScrollConfigChange("scrollSleepTimeMax", parseInt(e.target.value))}
                  min={100}
                  placeholder="600"
                />
              </div>
            </div>
          </div>
        </details>
      </div>
    </div>
  );
};

export default UrlConfigItem;
