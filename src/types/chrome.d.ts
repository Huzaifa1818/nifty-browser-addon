
interface Chrome {
  runtime: {
    sendMessage: (message: any, callback?: (response: any) => void) => void;
    onMessage: {
      addListener: (callback: (message: any, sender: any, sendResponse: any) => void) => void;
    };
  };
  tabs: {
    create: (options: any, callback?: (tab: any) => void) => void;
    update: (tabId: number, options: any, callback?: () => void) => void;
    onUpdated: {
      addListener: (callback: (tabId: number, info: any, tab: any) => void) => void;
      removeListener: (callback: any) => void;
    };
    remove: (tabId: number, callback?: () => void) => void;
    query: (options: any, callback: (tabs: any[]) => void) => void;
  };
  storage: {
    local: {
      get: (keys: string | string[] | object | null, callback: (items: any) => void) => void;
      set: (items: object, callback?: () => void) => void;
    };
  };
  scripting: {
    executeScript: (options: any, callback?: () => void) => void;
  };
}

declare global {
  interface Window {
    chrome: Chrome;
  }
  const chrome: Chrome;
}

export {};
