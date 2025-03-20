
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
                  setTimeout(resolve, 3000); // Increased from 2000 to 3000ms
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
                
                // Function for smooth scrolling, pixel by pixel
                const smoothScroll = (to, duration) => {
                  return new Promise(resolve => {
                    const element = document.scrollingElement || document.documentElement;
                    const start = element.scrollTop;
                    const change = to - start;
                    const increment = 20;
                    let currentTime = 0;
                    
                    function animateScroll() {
                      currentTime += increment;
                      const val = Math.easeInOutQuad(currentTime, start, change, duration);
                      element.scrollTop = val;
                      if (currentTime < duration) {
                        setTimeout(animateScroll, increment);
                      } else {
                        resolve();
                      }
                    }
                    
                    // Easing function
                    Math.easeInOutQuad = function(t, b, c, d) {
                      t /= d/2;
                      if (t < 1) return c/2*t*t + b;
                      t--;
                      return -c/2 * (t*(t-2) - 1) + b;
                    };
                    
                    animateScroll();
                  });
                };
                
                async function performScroll() {
                  const position = scrollConfig.position;
                  const randomWheelDistance = scrollConfig.randomWheelDistance || [100, 200];
                  const randomWheelSleepTime = scrollConfig.randomWheelSleepTime || [300, 600];
                  
                  // Get random sleep time
                  const getRandomSleep = () => {
                    return Math.floor(Math.random() * 
                      (randomWheelSleepTime[1] - randomWheelSleepTime[0] + 1)) + randomWheelSleepTime[0];
                  };
                  
                  // Slow scrolling function
                  const slowScroll = async (direction) => {
                    const documentHeight = Math.max(
                      document.body.scrollHeight, 
                      document.documentElement.scrollHeight,
                      document.body.offsetHeight, 
                      document.documentElement.offsetHeight
                    );
                    
                    if (direction === 'down') {
                      // Scroll down pixel by pixel
                      const scrollSteps = Math.ceil(documentHeight / 100); // Divide page into steps
                      for (let i = 1; i <= scrollSteps && i * 100 < documentHeight; i++) {
                        await smoothScroll(i * 100, 1000); // Smooth scroll to next section
                        await new Promise(r => setTimeout(r, getRandomSleep())); // Random pause
                      }
                      // Final scroll to ensure we reach bottom
                      await smoothScroll(documentHeight, 1000);
                    } else {
                      // Scroll up pixel by pixel
                      const scrollSteps = Math.ceil(documentHeight / 100);
                      for (let i = scrollSteps; i >= 0; i--) {
                        await smoothScroll(i * 100, 1000); // Smooth scroll to previous section
                        await new Promise(r => setTimeout(r, getRandomSleep())); // Random pause
                      }
                      // Final scroll to ensure we reach top
                      await smoothScroll(0, 1000);
                    }
                  };
                  
                  try {
                    if (position === 'bottom') {
                      await slowScroll('down');
                    } else if (position === 'top') {
                      await slowScroll('up');
                    }
                    return true;
                  } catch (error) {
                    console.error('Error during scrolling:', error);
                    return false;
                  }
                }
                
                // Perform the scroll and return a promise
                return performScroll();
              },
              args: [step.config]
            }, async (results) => {
              if (chrome.runtime.lastError) {
                console.error('Error executing script:', chrome.runtime.lastError);
                reject(chrome.runtime.lastError);
                return;
              }
              
              console.log('Script execution results:', results);
              // Give enough time for scrolling to complete
              // We'll increase this timeout significantly to ensure scrolling completes
              setTimeout(resolve, 15000); // Increased to 15 seconds
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
