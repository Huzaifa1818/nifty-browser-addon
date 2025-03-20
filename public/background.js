
// Store for automation tasks
let automationConfig = [];
let isRunning = false;
let currentTabId = null;

// Listen for installation
chrome.runtime.onInstalled.addListener(() => {
  console.log('Extension installed');
  // Initialize empty automation config in storage
  chrome.storage.local.set({ automationConfig: [], isRunning: false });
});

// Listen for messages
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Received message:', request.type, request);

  if (request.type === 'GET_CURRENT_URL') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      sendResponse({ url: tabs[0].url });
    });
    return true; // Required for async response
  }
  
  if (request.type === 'START_AUTOMATION') {
    console.log('Starting automation with config:', request.config);
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
    console.log('Stopping automation');
    isRunning = false;
    chrome.storage.local.set({ isRunning: false });
    sendResponse({ success: true });
    return true;
  }
  
  if (request.type === 'SAVE_CONFIG') {
    console.log('Saving config:', request.config);
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
    console.log('Running automation with steps:', automationConfig);
    // Create a new tab for automation
    let tab = await new Promise(resolve => {
      chrome.tabs.create({ active: true }, tab => {
        console.log('Created new tab:', tab.id);
        currentTabId = tab.id;
        resolve(tab);
      });
    });
    
    let stepIndex = 0;
    
    while (stepIndex < automationConfig.length && isRunning) {
      const step = automationConfig[stepIndex];
      console.log(`Executing step ${stepIndex + 1}/${automationConfig.length}:`, step);
      
      switch (step.type) {
        case 'newPage':
          console.log('New page step - tab already created');
          // We already have a tab, so just continue
          break;
          
        case 'gotoUrl':
          console.log('Going to URL:', step.config.url);
          await new Promise((resolve, reject) => {
            chrome.tabs.update(tab.id, { url: step.config.url }, (updatedTab) => {
              if (chrome.runtime.lastError) {
                console.error('Error updating tab:', chrome.runtime.lastError);
                reject(chrome.runtime.lastError);
                return;
              }
              
              // Wait for page to load
              console.log('Waiting for page to load');
              const listener = function(tabId, info) {
                if (tabId === tab.id && info.status === 'complete') {
                  console.log('Page loaded successfully');
                  chrome.tabs.onUpdated.removeListener(listener);
                  
                  // Give extra time for the page to fully render
                  setTimeout(resolve, 2000);
                }
              };
              
              chrome.tabs.onUpdated.addListener(listener);
            });
          });
          
          // Wait for timeout from config if specified
          if (step.config.timeout) {
            console.log(`Waiting ${step.config.timeout}ms`);
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
          
          console.log(`Waiting ${waitTime}ms`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
          break;
          
        case 'scrollPage':
          console.log('Executing scroll operation:', step.config);
          // Execute scroll operation in the content of the tab
          await new Promise((resolve, reject) => {
            chrome.scripting.executeScript({
              target: { tabId: tab.id },
              func: (scrollConfig) => {
                console.log('In page script - scroll config:', scrollConfig);
                
                const scrollSmoothly = (scrollType, position, options) => {
                  console.log('Scroll params:', scrollType, position, options);
                  const randomBetween = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
                  
                  if (scrollType === 'position') {
                    console.log('Scrolling to position:', position);
                    if (position === 'top') {
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    } else if (position === 'bottom') {
                      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
                    }
                  } else if (scrollType === 'wheel') {
                    console.log('Scrolling with wheel simulation');
                    // Implement smooth wheel scrolling with random intervals
                    const totalScrolls = Math.ceil(
                      (position === 'bottom' ? document.body.scrollHeight : window.scrollY) / 
                      options.randomWheelDistance[1]
                    );
                    
                    console.log('Total scroll operations:', totalScrolls);
                    let currentScroll = 0;
                    
                    const wheelScroll = () => {
                      if (currentScroll >= totalScrolls) {
                        console.log('Wheel scrolling complete');
                        return;
                      }
                      
                      const distance = randomBetween(
                        options.randomWheelDistance[0], 
                        options.randomWheelDistance[1]
                      );
                      
                      console.log(`Scroll ${currentScroll + 1}/${totalScrolls}, distance: ${distance}`);
                      
                      window.scrollBy({
                        top: position === 'bottom' ? distance : -distance,
                        behavior: 'smooth'
                      });
                      
                      currentScroll++;
                      
                      const sleepTime = randomBetween(
                        options.randomWheelSleepTime[0], 
                        options.randomWheelSleepTime[1]
                      );
                      console.log(`Next scroll in ${sleepTime}ms`);
                      
                      setTimeout(
                        wheelScroll, 
                        sleepTime
                      );
                    };
                    
                    wheelScroll();
                  }
                  
                  // Ensure we return true after scrolling completes
                  return true;
                };
                
                scrollSmoothly(
                  scrollConfig.scrollType || 'position', 
                  scrollConfig.position, 
                  {
                    randomWheelDistance: scrollConfig.randomWheelDistance || [100, 200],
                    randomWheelSleepTime: scrollConfig.randomWheelSleepTime || [300, 600]
                  }
                );
                
                // Signal completion after scrolling (with timeout for smooth scroll)
                return true;
              },
              args: [step.config]
            }, (results) => {
              if (chrome.runtime.lastError) {
                console.error('Error executing script:', chrome.runtime.lastError);
                reject(chrome.runtime.lastError);
                return;
              }
              
              console.log('Script execution results:', results);
              // Give enough time for scrolling to complete
              setTimeout(resolve, step.config.position === 'bottom' ? 5000 : 3000);
            });
          });
          break;
          
        case 'closePage':
          console.log('Closing tab:', tab.id);
          await new Promise(resolve => {
            chrome.tabs.remove(tab.id, () => {
              currentTabId = null;
              resolve();
            });
          });
          break;
      }
      
      stepIndex++;
      console.log('Moving to next step, index:', stepIndex);
    }
    
    // Ensure we update the running state when completed
    console.log('Automation completed or stopped');
    isRunning = false;
    chrome.storage.local.set({ isRunning: false });
    
  } catch (error) {
    console.error('Automation error:', error);
    isRunning = false;
    chrome.storage.local.set({ isRunning: false });
  }
}

// Ensure we clean up if extension is reloaded
chrome.runtime.onSuspend.addListener(() => {
  console.log('Extension being suspended, cleaning up');
  if (currentTabId) {
    chrome.tabs.remove(currentTabId, () => {
      console.log('Automation tab closed');
    });
  }
});
