
// Store for automation tasks
let automationConfig = [];
let isRunning = false;

// Listen for installation
chrome.runtime.onInstalled.addListener(() => {
  console.log('Extension installed');
  // Initialize empty automation config in storage
  chrome.storage.local.set({ automationConfig: [], isRunning: false });
});

// Listen for messages
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'GET_CURRENT_URL') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      sendResponse({ url: tabs[0].url });
    });
    return true; // Required for async response
  }
  
  if (request.type === 'START_AUTOMATION') {
    chrome.storage.local.get(['automationConfig'], (result) => {
      automationConfig = request.config || result.automationConfig;
      chrome.storage.local.set({ automationConfig, isRunning: true });
      isRunning = true;
      runAutomation();
      sendResponse({ success: true });
    });
    return true;
  }
  
  if (request.type === 'STOP_AUTOMATION') {
    isRunning = false;
    chrome.storage.local.set({ isRunning: false });
    sendResponse({ success: true });
    return true;
  }
  
  if (request.type === 'SAVE_CONFIG') {
    chrome.storage.local.set({ automationConfig: request.config }, () => {
      sendResponse({ success: true });
    });
    return true;
  }

  if (request.type === 'GET_STATUS') {
    chrome.storage.local.get(['isRunning', 'automationConfig'], (result) => {
      sendResponse({ 
        isRunning: result.isRunning || false,
        automationConfig: result.automationConfig || []
      });
    });
    return true;
  }
});

// Execute automation steps
async function runAutomation() {
  try {
    // Create a new tab for automation
    let tab = await new Promise(resolve => {
      chrome.tabs.create({ active: true }, tab => resolve(tab));
    });
    
    let stepIndex = 0;
    
    while (stepIndex < automationConfig.length && isRunning) {
      const step = automationConfig[stepIndex];
      console.log(`Executing step ${stepIndex + 1}/${automationConfig.length}:`, step.type);
      
      switch (step.type) {
        case 'newPage':
          // We already have a tab, so just continue
          break;
          
        case 'gotoUrl':
          await new Promise(resolve => {
            chrome.tabs.update(tab.id, { url: step.config.url }, () => {
              // Wait for page to load
              chrome.tabs.onUpdated.addListener(function listener(tabId, info) {
                if (tabId === tab.id && info.status === 'complete') {
                  chrome.tabs.onUpdated.removeListener(listener);
                  setTimeout(resolve, 1000); // Additional buffer
                }
              });
            });
          });
          
          // Wait for timeout from config
          if (step.config.timeout) {
            await new Promise(resolve => setTimeout(resolve, step.config.timeout));
          }
          break;
          
        case 'waitTime':
          let waitTime = step.config.timeout;
          
          // Use random interval if specified
          if (step.config.timeoutType === 'randomInterval') {
            waitTime = Math.floor(Math.random() * 
              (step.config.timeoutMax - step.config.timeoutMin + 1)) + step.config.timeoutMin;
          }
          
          await new Promise(resolve => setTimeout(resolve, waitTime));
          break;
          
        case 'scrollPage':
          // Execute scroll operation in the content of the tab
          await new Promise(resolve => {
            chrome.scripting.executeScript({
              target: { tabId: tab.id },
              func: (scrollConfig) => {
                const scrollSmoothly = (scrollType, position, options) => {
                  const randomBetween = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
                  
                  if (scrollType === 'position') {
                    if (position === 'top') {
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    } else if (position === 'bottom') {
                      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
                    }
                  } else if (scrollType === 'wheel') {
                    // Implement smooth wheel scrolling with random intervals
                    const totalScrolls = Math.ceil(
                      (position === 'bottom' ? document.body.scrollHeight : window.scrollY) / 
                      options.randomWheelDistance[1]
                    );
                    
                    let currentScroll = 0;
                    
                    const wheelScroll = () => {
                      if (currentScroll >= totalScrolls) return;
                      
                      const distance = randomBetween(
                        options.randomWheelDistance[0], 
                        options.randomWheelDistance[1]
                      );
                      
                      window.scrollBy({
                        top: position === 'bottom' ? distance : -distance,
                        behavior: 'smooth'
                      });
                      
                      currentScroll++;
                      
                      setTimeout(
                        wheelScroll, 
                        randomBetween(options.randomWheelSleepTime[0], options.randomWheelSleepTime[1])
                      );
                    };
                    
                    wheelScroll();
                  }
                };
                
                scrollSmoothly(
                  scrollConfig.scrollType, 
                  scrollConfig.position, 
                  {
                    randomWheelDistance: scrollConfig.randomWheelDistance,
                    randomWheelSleepTime: scrollConfig.randomWheelSleepTime
                  }
                );
                
                // Signal completion after scrolling (with timeout for smooth scroll)
                setTimeout(() => {
                  return true;
                }, scrollConfig.position === 'bottom' ? 3000 : 2000);
              },
              args: [step.config]
            }, () => setTimeout(resolve, 3000)); // Give enough time for scrolling
          });
          break;
          
        case 'closePage':
          await new Promise(resolve => {
            chrome.tabs.remove(tab.id, resolve);
          });
          break;
      }
      
      stepIndex++;
    }
    
    // Ensure we update the running state when completed
    isRunning = false;
    chrome.storage.local.set({ isRunning: false });
    console.log('Automation completed');
    
  } catch (error) {
    console.error('Automation error:', error);
    isRunning = false;
    chrome.storage.local.set({ isRunning: false });
  }
}
