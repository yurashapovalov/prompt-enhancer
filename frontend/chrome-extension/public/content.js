// This script runs in the context of any web page

// Global variables
let activeTextElement = null;
let enhanceButton = null;

// Function to create the enhance button
function createEnhanceButton() {
  if (enhanceButton) return enhanceButton;
  
  enhanceButton = document.createElement('button');
  enhanceButton.id = 'prompt-enhancer-button';
  enhanceButton.textContent = 'Enhance';
  enhanceButton.style.position = 'absolute';
  enhanceButton.style.zIndex = '10000';
  enhanceButton.style.padding = '5px 10px';
  enhanceButton.style.backgroundColor = '#4285f4';
  enhanceButton.style.color = 'white';
  enhanceButton.style.border = 'none';
  enhanceButton.style.borderRadius = '4px';
  enhanceButton.style.cursor = 'pointer';
  enhanceButton.style.fontSize = '14px';
  enhanceButton.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
  enhanceButton.style.display = 'none'; // Hidden by default
  
  // Add click event listener
  enhanceButton.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!activeTextElement) return;
    
    // Get current text
    const text = getTextFromElement(activeTextElement);
    
    if (!text.trim()) {
      console.log('Prompt Enhancer: No text to enhance');
      return;
    }
    
    // Send message to background script to enhance the prompt
    chrome.runtime.sendMessage(
      { action: 'enhancePrompt', text: text },
      (response) => {
        if (response && response.enhancedText) {
          // Update text element with enhanced prompt
          setTextToElement(activeTextElement, response.enhancedText);
        }
      }
    );
  });
  
  document.body.appendChild(enhanceButton);
  return enhanceButton;
}

// Function to position the enhance button near the active text element
function positionEnhanceButton(element) {
  if (!element || !enhanceButton) return;
  
  const rect = element.getBoundingClientRect();
  const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
  const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
  
  // Position the button at the top right of the text element
  enhanceButton.style.top = `${rect.top + scrollTop - 30}px`;
  enhanceButton.style.left = `${rect.right + scrollLeft - 80}px`;
  enhanceButton.style.display = 'block';
}

// Function to get text from different types of text elements
function getTextFromElement(element) {
  if (!element) return '';
  
  if (element.tagName === 'TEXTAREA' || element.tagName === 'INPUT') {
    return element.value;
  } else if (element.isContentEditable) {
    return element.textContent;
  }
  
  return '';
}

// Function to set text to different types of text elements
function setTextToElement(element, text) {
  if (!element) return;
  
  if (element.tagName === 'TEXTAREA' || element.tagName === 'INPUT') {
    element.value = text;
    element.dispatchEvent(new Event('input', { bubbles: true }));
  } else if (element.isContentEditable) {
    element.textContent = text;
    element.dispatchEvent(new Event('input', { bubbles: true }));
  }
}

// Function to handle focus on text elements
function handleFocus(event) {
  const element = event.target;
  
  // Check if the element is a text input or contenteditable
  if (
    element.tagName === 'TEXTAREA' || 
    (element.tagName === 'INPUT' && element.type === 'text') ||
    element.isContentEditable
  ) {
    activeTextElement = element;
    const button = createEnhanceButton();
    positionEnhanceButton(element);
  }
}

// Function to handle blur (focus lost) on text elements
function handleBlur(event) {
  // Hide the button with a small delay to allow clicking it
  setTimeout(() => {
    if (enhanceButton) {
      enhanceButton.style.display = 'none';
    }
  }, 200);
}

// Listen for focus events on the document
document.addEventListener('focusin', handleFocus);
document.addEventListener('blur', handleBlur, true);

// Listen for window resize to reposition the button
window.addEventListener('resize', () => {
  if (activeTextElement) {
    positionEnhanceButton(activeTextElement);
  }
});

// Listen for messages from the side panel
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'insertPrompt' && message.text) {
    // If we have an active text element, insert the prompt template
    if (activeTextElement) {
      setTextToElement(activeTextElement, message.text);
      sendResponse({ success: true });
    } else {
      // Try to find a focused text element
      const focusedElement = document.activeElement;
      if (
        focusedElement && 
        (focusedElement.tagName === 'TEXTAREA' || 
         (focusedElement.tagName === 'INPUT' && focusedElement.type === 'text') ||
         focusedElement.isContentEditable)
      ) {
        setTextToElement(focusedElement, message.text);
        sendResponse({ success: true });
      } else {
        sendResponse({ success: false, error: 'No active text element found' });
      }
    }
  }
  return true; // Keep the message channel open for async response
});

// Initialize when the page loads
createEnhanceButton();
console.log('Prompt Enhancer: Content script loaded');
