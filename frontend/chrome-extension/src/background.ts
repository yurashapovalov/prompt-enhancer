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
                
                console.error('Error details:', chrome.runtime.lastError);
                
                // Если не удалось отправить сообщение, пробуем выполнить скрипт напрямую
                console.log('Trying to execute script directly with data:', message.data);
                chrome.scripting.executeScript({
                  target: { tabId: tabs[0].id as number },
                  func: (text: string, url: string, originalText: string, variables: Array<{name: string, value: string}>, doNotReplaceVariables: boolean) => {
                    // Функция для вставки текста в активный элемент
                    const insertTextToActiveElement = (text: string, url: string, originalText: string, variables: Array<{name: string, value: string}>, doNotReplaceVariables: boolean) => {
                      console.log('Executing script to insert text:', { text, url, originalText, variables, doNotReplaceVariables });
                      
                      // Проверяем флаг doNotReplaceVariables
                      const shouldNotReplaceVariables = doNotReplaceVariables === true;
                      console.log('[Prompt Enhancer][Background] doNotReplaceVariables:', shouldNotReplaceVariables);
                      
                      // Если флаг не установлен и есть переменные, заменяем их на значения
                      if (!shouldNotReplaceVariables && variables && variables.length > 0) {
                        console.log('[Prompt Enhancer][Background] Replacing variables in text');
                        
                        // Используем текст для замены (originalText или text)
                        const textToProcess = originalText || text;
                        console.log('[Prompt Enhancer][Background] Original text with variables:', textToProcess);
                        console.log('[Prompt Enhancer][Background] Variables:', variables);
                        
                        // Заменяем переменные на их значения
                        let processedText = textToProcess;
                        variables.forEach(variable => {
                          // Экранируем специальные символы в имени переменной для использования в регулярном выражении
                          const escapedName = variable.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                          
                          // Создаем регулярное выражение, которое учитывает возможные пробелы в имени переменной
                          const pattern = new RegExp(`\\{\\{\\s*${escapedName}\\s*\\}\\}`, 'g');
                          
                          // Проверяем, есть ли совпадения
                          const matches = processedText.match(pattern);
                          
                          if (matches && matches.length > 0) {
                            console.log(`[Prompt Enhancer][Background] Found ${matches.length} occurrences of variable "${variable.name}"`);
                            console.log(`[Prompt Enhancer][Background] Matches:`, matches);
                            
                            // Заменяем переменную на ее значение
                            processedText = processedText.replace(pattern, variable.value || '');
                            console.log(`[Prompt Enhancer][Background] Replaced "${variable.name}" with "${variable.value}"`);
                          } else {
                            console.log(`[Prompt Enhancer][Background] No occurrences of variable "${variable.name}" found in text`);
                            console.log(`[Prompt Enhancer][Background] Pattern used:`, pattern.toString());
                          }
                        });
                        
                        console.log('[Prompt Enhancer][Background] Processed text with replaced variables:', processedText);
                        
                        // Используем обработанный текст, если он отличается от переданного
                        if (processedText !== text) {
                          console.log('[Prompt Enhancer][Background] Using processed text instead of original');
                          text = processedText;
                        } else {
                          console.log('[Prompt Enhancer][Background] Processed text is the same as original, no variables were replaced');
                        }
                      } else {
                        if (shouldNotReplaceVariables) {
                          console.log('[Prompt Enhancer][Background] Not replacing variables as requested by doNotReplaceVariables flag');
                        } else {
                          console.log('[Prompt Enhancer][Background] No variables provided for replacement');
                          if (!variables || variables.length === 0) console.log('[Prompt Enhancer][Background] variables are missing or empty');
                        }
                      }
                      // Определяем тип сайта по URL
                      const isChatGPT = url.includes('chat.openai.com');
                      const isClaude = url.includes('claude.ai');
                      
                      // Получаем активный элемент
                      const activeElement = document.activeElement;
                      
                      // Проверяем, что активный элемент - текстовое поле или contenteditable
                      if (activeElement && (
                        activeElement.tagName === 'TEXTAREA' || 
                        (activeElement.tagName === 'INPUT' && (activeElement as HTMLInputElement).type === 'text') ||
                        activeElement.hasAttribute('contenteditable')
                      )) {
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
                          // Для Claude нужна специальная обработка ProseMirror
                          if (isClaude && (activeElement.classList.contains('ProseMirror') || activeElement.closest('.ProseMirror'))) {
                            // Для ProseMirror используем прямую вставку HTML
                            activeElement.innerHTML = '';
                            const p = document.createElement('p');
                            p.textContent = text;
                            activeElement.appendChild(p);
                          } else {
                            activeElement.textContent = text;
                          }
                          
                          // Для ChatGPT генерируем только событие input, чтобы не вызвать автоматическую отправку
                          activeElement.dispatchEvent(new Event('input', { bubbles: true }));
                          
                          // Для других сайтов генерируем также событие change
                          if (!isChatGPT) {
                            activeElement.dispatchEvent(new Event('change', { bubbles: true }));
                          }
                        }
                        return true;
                      }
                      
                      // Если активный элемент не подходит, ищем другие элементы
                      
                      // Для ChatGPT ищем специфичные элементы
                      if (isChatGPT) {
                        // Поиск по id (наиболее надежный способ)
                        const promptTextarea = document.getElementById('prompt-textarea');
                        if (promptTextarea) {
                          (promptTextarea as HTMLTextAreaElement).value = text;
                          promptTextarea.dispatchEvent(new Event('input', { bubbles: true }));
                          promptTextarea.focus();
                          return true;
                        }
                        
                        // Поиск по атрибуту placeholder
                        const placeholderElements = document.querySelectorAll('textarea[placeholder*="Send a message"]');
                        if (placeholderElements.length > 0) {
                          const textarea = placeholderElements[0] as HTMLTextAreaElement;
                          textarea.value = text;
                          textarea.dispatchEvent(new Event('input', { bubbles: true }));
                          textarea.focus();
                          return true;
                        }
                      }
                      
                      // Для Claude ищем специфичные элементы
                      if (isClaude) {
                        // Поиск по классу ProseMirror
                        const proseMirrorElements = document.querySelectorAll('.ProseMirror[contenteditable="true"]');
                        if (proseMirrorElements.length > 0) {
                          const element = proseMirrorElements[0] as HTMLElement;
                          element.innerHTML = '';
                          const p = document.createElement('p');
                          p.textContent = text;
                          element.appendChild(p);
                          element.dispatchEvent(new Event('input', { bubbles: true }));
                          element.dispatchEvent(new Event('change', { bubbles: true }));
                          element.focus();
                          return true;
                        }
                      }
                      
                      // Общий поиск для всех сайтов
                      
                      // Поиск textarea
                      const textareas = document.querySelectorAll('textarea');
                      if (textareas.length > 0) {
                        const textarea = textareas[0] as HTMLTextAreaElement;
                        textarea.value = text;
                        textarea.dispatchEvent(new Event('input', { bubbles: true }));
                        if (!isChatGPT) {
                          textarea.dispatchEvent(new Event('change', { bubbles: true }));
                        }
                        textarea.focus();
                        return true;
                      }
                      
                      // Поиск input[type="text"]
                      const inputs = document.querySelectorAll('input[type="text"]');
                      if (inputs.length > 0) {
                        const input = inputs[0] as HTMLInputElement;
                        input.value = text;
                        input.dispatchEvent(new Event('input', { bubbles: true }));
                        if (!isChatGPT) {
                          input.dispatchEvent(new Event('change', { bubbles: true }));
                        }
                        input.focus();
                        return true;
                      }
                      
                      // Поиск contenteditable
                      const editables = document.querySelectorAll('[contenteditable="true"]');
                      if (editables.length > 0) {
                        const editable = editables[0] as HTMLElement;
                        editable.textContent = text;
                        editable.dispatchEvent(new Event('input', { bubbles: true }));
                        if (!isChatGPT) {
                          editable.dispatchEvent(new Event('change', { bubbles: true }));
                        }
                        editable.focus();
                        return true;
                      }
                      
                      return false;
                    };
                    
                    // Вставляем текст
                    return insertTextToActiveElement(text, url, originalText, variables, doNotReplaceVariables);
                  },
                  args: [
                    message.data.text, 
                    tabs[0].url || '', 
                    message.data.originalText || '',
                    message.data.variables || [],
                    message.data.doNotReplaceVariables || false
                  ]
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
