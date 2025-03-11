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
    chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
      if (tabs[0]?.id) {
        try {
          // Сначала пробуем отправить сообщение через chrome.tabs.sendMessage
          try {
            chrome.tabs.sendMessage(tabs[0].id, message.data, (response) => {
              // Проверяем, есть ли ошибка chrome.runtime.lastError
              if (chrome.runtime.lastError) {
                console.error('Error sending message to tab:', chrome.runtime.lastError);
                
                // Если не удалось отправить сообщение, пробуем выполнить скрипт напрямую
                chrome.scripting.executeScript({
                  target: { tabId: tabs[0].id as number },
                  func: (text: string) => {
                    // Функция для вставки текста в активный элемент
                    const insertTextToActiveElement = (text: string) => {
                      // Получаем активный элемент
                      const activeElement = document.activeElement;
                      
                      // Проверяем, что активный элемент - текстовое поле или contenteditable
                      if (activeElement && (
                        activeElement.tagName === 'TEXTAREA' || 
                        (activeElement.tagName === 'INPUT' && (activeElement as HTMLInputElement).type === 'text') ||
                        activeElement.hasAttribute('contenteditable')
                      )) {
                        // Проверяем, находимся ли мы на сайте ChatGPT
                        const isChatGPT = window.location.href.includes('chat.openai.com');
                        
                        // Вставляем текст в зависимости от типа элемента
                        if (activeElement.tagName === 'TEXTAREA' || activeElement.tagName === 'INPUT') {
                          (activeElement as HTMLTextAreaElement | HTMLInputElement).value = text;
                          
                          // Для ChatGPT генерируем только событие input, чтобы не вызвать автоматическую отправку
                          activeElement.dispatchEvent(new Event('input', { bubbles: true }));
                          
                          // Для других сайтов генерируем также событие change
                          if (!isChatGPT) {
                            activeElement.dispatchEvent(new Event('change', { bubbles: true }));
                          }
                        } else if (activeElement.hasAttribute('contenteditable')) {
                          activeElement.textContent = text;
                          
                          // Для ChatGPT генерируем только событие input, чтобы не вызвать автоматическую отправку
                          activeElement.dispatchEvent(new Event('input', { bubbles: true }));
                          
                          // Для других сайтов генерируем также событие change
                          if (!isChatGPT) {
                            activeElement.dispatchEvent(new Event('change', { bubbles: true }));
                          }
                        }
                        return true;
                      }
                      
                      // Проверяем, находимся ли мы на сайте ChatGPT
                      const isChatGPT = window.location.href.includes('chat.openai.com');
                      
                      // Если активный элемент не подходит, ищем другие элементы
                      // Поиск textarea
                      const textareas = document.querySelectorAll('textarea');
                      if (textareas.length > 0) {
                        const textarea = textareas[0] as HTMLTextAreaElement;
                        textarea.value = text;
                        
                        // Для ChatGPT генерируем только событие input, чтобы не вызвать автоматическую отправку
                        textarea.dispatchEvent(new Event('input', { bubbles: true }));
                        
                        // Для других сайтов генерируем также событие change
                        if (!isChatGPT) {
                          textarea.dispatchEvent(new Event('change', { bubbles: true }));
                        }
                        
                        // Фокусируемся на элементе
                        textarea.focus();
                        return true;
                      }
                      
                      // Поиск input[type="text"]
                      const inputs = document.querySelectorAll('input[type="text"]');
                      if (inputs.length > 0) {
                        const input = inputs[0] as HTMLInputElement;
                        input.value = text;
                        
                        // Для ChatGPT генерируем только событие input, чтобы не вызвать автоматическую отправку
                        input.dispatchEvent(new Event('input', { bubbles: true }));
                        
                        // Для других сайтов генерируем также событие change
                        if (!isChatGPT) {
                          input.dispatchEvent(new Event('change', { bubbles: true }));
                        }
                        
                        // Фокусируемся на элементе
                        input.focus();
                        return true;
                      }
                      
                      // Поиск contenteditable
                      const editables = document.querySelectorAll('[contenteditable="true"]');
                      if (editables.length > 0) {
                        const editable = editables[0] as HTMLElement;
                        editable.textContent = text;
                        
                        // Для ChatGPT генерируем только событие input, чтобы не вызвать автоматическую отправку
                        editable.dispatchEvent(new Event('input', { bubbles: true }));
                        
                        // Для других сайтов генерируем также событие change
                        if (!isChatGPT) {
                          editable.dispatchEvent(new Event('change', { bubbles: true }));
                        }
                        
                        // Фокусируемся на элементе
                        editable.focus();
                        return true;
                      }
                      
                      return false;
                    };
                    
                    // Вставляем текст
                    return insertTextToActiveElement(text);
                  },
                  args: [message.data.text]
                }).then((results) => {
                  if (results && results[0] && results[0].result) {
                    sendResponse({ success: true, method: 'executeScript' });
                  } else {
                    sendResponse({ 
                      success: false, 
                      error: 'Could not find suitable input element' 
                    });
                  }
                }).catch((error) => {
                  console.error('Error executing script:', error);
                  sendResponse({ 
                    success: false, 
                    error: 'Error executing script: ' + error.message 
                  });
                });
              } else {
                // Если ответ получен успешно, передаем его обратно
                sendResponse(response);
              }
            });
          } catch (error) {
            console.error('Error sending message to tab:', error);
            sendResponse({ 
              success: false, 
              error: 'Exception when sending message to tab: ' + error 
            });
          }
        } catch (error) {
          console.error('Error in sendToActiveTab:', error);
          sendResponse({ 
            success: false, 
            error: 'Error in sendToActiveTab: ' + error 
          });
        }
      } else {
        sendResponse({ success: false, error: 'No active tab found' });
      }
    });
    return true; // Keep the message channel open for async response
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
