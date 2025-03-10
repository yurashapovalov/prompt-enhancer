// This script runs in the context of any web page

// Global variables
let activeTextElement: HTMLTextAreaElement | HTMLInputElement | HTMLElement | null = null;

// Function to get text from different types of text elements
function getTextFromElement(element: HTMLElement): string {
  if (!element) return '';
  
  if (element.tagName === 'TEXTAREA' || (element.tagName === 'INPUT' && (element as HTMLInputElement).type === 'text')) {
    return (element as HTMLTextAreaElement | HTMLInputElement).value;
  } else if (element.isContentEditable) {
    return element.textContent || '';
  }
  
  return '';
}

// Function to set text to different types of text elements
function setTextToElement(element: HTMLElement, text: string): void {
  if (!element) return;
  
  if (element.tagName === 'TEXTAREA' || (element.tagName === 'INPUT' && (element as HTMLInputElement).type === 'text')) {
    const inputElement = element as HTMLTextAreaElement | HTMLInputElement;
    inputElement.value = text;
    inputElement.dispatchEvent(new Event('input', { bubbles: true }));
  } else if (element.isContentEditable) {
    element.textContent = text;
    element.dispatchEvent(new Event('input', { bubbles: true }));
  }
}

// Function to handle focus on text elements
function handleFocus(event: FocusEvent): void {
  const element = event.target as HTMLElement;
  
  // Check if the element is a text input or contenteditable
  if (
    element.tagName === 'TEXTAREA' || 
    (element.tagName === 'INPUT' && (element as HTMLInputElement).type === 'text') ||
    element.isContentEditable
  ) {
    activeTextElement = element;
  }
}

// Listen for focus events on the document
document.addEventListener('focusin', handleFocus);

// Listen for messages from the background script
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.action === 'insertPrompt' && message.text) {
    // If we have an active text element, insert the prompt template
    if (activeTextElement) {
      setTextToElement(activeTextElement, message.text);
      sendResponse({ success: true });
    } else {
      // Try to find a focused text element
      const focusedElement = document.activeElement as HTMLElement;
      if (
        focusedElement && 
        (focusedElement.tagName === 'TEXTAREA' || 
         (focusedElement.tagName === 'INPUT' && (focusedElement as HTMLInputElement).type === 'text') ||
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

console.log('Prompt Enhancer: Content script loaded');
