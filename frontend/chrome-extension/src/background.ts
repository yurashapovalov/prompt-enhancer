import { 
  initAuthService, 
  getCurrentUserToken, 
  isAuthenticated,
  openAuthPage
} from '@services/auth-service';
import { api } from '../../shared/firebase-config';

// Initialize auth service
initAuthService();

// Function to handle opening the side panel
chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });

// Listen for messages from content script or side panel
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
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
  
  // Handle check auth request
  if (message.action === 'checkAuth') {
    isAuthenticated()
      .then(isAuth => {
        sendResponse({ isAuthenticated: isAuth });
      })
      .catch(error => {
        console.error('Error checking auth:', error);
        sendResponse({ isAuthenticated: false, error: 'Failed to check auth' });
      });
    return true; // Keep the message channel open for async response
  }
  
  // Handle login request
  if (message.action === 'login') {
    openAuthPage();
    sendResponse({ success: true });
    return false; // No async response needed
  }
  
  // Handle sending message to active tab
  if (message.action === 'sendToActiveTab') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        chrome.tabs.sendMessage(tabs[0].id, message.data);
      }
    });
    return false; // No async response needed
  }
});

// Function to get prompt templates from the backend
async function getPromptTemplates(): Promise<any[]> {
  try {
    // Check if user is authenticated
    const isAuth = await isAuthenticated();
    if (!isAuth) {
      // Open auth page if not authenticated
      openAuthPage();
      throw new Error('User not authenticated');
    }
    
    // Get user authentication token
    const token = await getCurrentUserToken();
    if (!token) {
      throw new Error('No authentication token found');
    }
    
    // Call the API to get prompt templates
    const data = await api.getPromptTemplates(token);
    return data.templates;
  } catch (error) {
    console.error('Error in getPromptTemplates:', error);
    throw error;
  }
}

// Function to save a prompt template to the backend
async function savePromptTemplate(template: any): Promise<any> {
  try {
    // Check if user is authenticated
    const isAuth = await isAuthenticated();
    if (!isAuth) {
      // Open auth page if not authenticated
      openAuthPage();
      throw new Error('User not authenticated');
    }
    
    // Get user authentication token
    const token = await getCurrentUserToken();
    if (!token) {
      throw new Error('No authentication token found');
    }
    
    // Call the API to save the prompt template
    return await api.createPromptTemplate(template, token);
  } catch (error) {
    console.error('Error in savePromptTemplate:', error);
    throw error;
  }
}

// Log that the background script has loaded
console.log('Prompt Enhancer background script loaded');
