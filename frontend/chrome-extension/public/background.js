// Background script for the Chrome extension

// API endpoint for enhancing prompts
const API_BASE_URL = 'http://localhost:8000';

// Function to handle opening the side panel
chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });

// Listen for messages from content script or side panel
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Handle enhance prompt request from content script
  if (message.action === 'enhancePrompt') {
    enhancePrompt(message.text)
      .then(enhancedText => {
        sendResponse({ enhancedText });
      })
      .catch(error => {
        console.error('Error enhancing prompt:', error);
        sendResponse({ error: 'Failed to enhance prompt' });
      });
    return true; // Keep the message channel open for async response
  }
  
  // Handle get prompt templates request from side panel
  if (message.action === 'getPromptTemplates') {
    getPromptTemplates()
      .then(templates => {
        sendResponse({ templates });
      })
      .catch(error => {
        console.error('Error fetching prompt templates:', error);
        sendResponse({ error: 'Failed to fetch prompt templates' });
      });
    return true; // Keep the message channel open for async response
  }
  
  // Handle save prompt template request from side panel
  if (message.action === 'savePromptTemplate') {
    savePromptTemplate(message.template)
      .then(result => {
        sendResponse({ success: true, template: result });
      })
      .catch(error => {
        console.error('Error saving prompt template:', error);
        sendResponse({ success: false, error: 'Failed to save prompt template' });
      });
    return true; // Keep the message channel open for async response
  }
});

// Function to enhance a prompt using the backend API
async function enhancePrompt(text) {
  try {
    // Get user authentication token
    const authToken = await getAuthToken();
    
    // Call the API to enhance the prompt
    const response = await fetch(`${API_BASE_URL}/api/enhance-prompt`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({ text })
    });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.enhancedText;
  } catch (error) {
    console.error('Error in enhancePrompt:', error);
    throw error;
  }
}

// Function to get prompt templates from the backend
async function getPromptTemplates() {
  try {
    // Get user authentication token
    const authToken = await getAuthToken();
    
    // Call the API to get prompt templates
    const response = await fetch(`${API_BASE_URL}/api/prompt-templates`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.templates;
  } catch (error) {
    console.error('Error in getPromptTemplates:', error);
    throw error;
  }
}

// Function to save a prompt template to the backend
async function savePromptTemplate(template) {
  try {
    // Get user authentication token
    const authToken = await getAuthToken();
    
    // Call the API to save the prompt template
    const response = await fetch(`${API_BASE_URL}/api/prompt-templates`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify(template)
    });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.template;
  } catch (error) {
    console.error('Error in savePromptTemplate:', error);
    throw error;
  }
}

// Function to get the authentication token
async function getAuthToken() {
  // For MVP, we'll use a simple approach to get the token from storage
  // In a production app, you would handle token refresh, etc.
  return new Promise((resolve, reject) => {
    chrome.storage.local.get(['authToken'], (result) => {
      if (result.authToken) {
        resolve(result.authToken);
      } else {
        // If no token is found, we'll need to handle authentication
        // For now, we'll just reject with an error
        reject(new Error('No authentication token found'));
      }
    });
  });
}
