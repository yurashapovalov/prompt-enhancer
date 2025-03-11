// This script runs in the context of any web page
import { AdapterFactory } from './adapters';
import { PromptVariable } from '@services/api-service';

// Global variables
let activeTextElement: HTMLTextAreaElement | HTMLInputElement | HTMLElement | null = null;

// Глобальное хранилище для переменных и их значений
interface VariableStore {
  [key: string]: {
    variables: PromptVariable[];
    timestamp: number;
  }
}

// Хранилище переменных для разных элементов ввода
const variableStore: VariableStore = {};

// Функция для сохранения переменных для элемента
function storeVariablesForElement(element: HTMLElement, variables: PromptVariable[]): void {
  // Проверяем, что переменные не пустые
  if (!variables || variables.length === 0) {
    console.log('[Prompt Enhancer] WARNING: Trying to store empty variables array');
    return;
  }
  
  // Проверяем, что у переменных есть значения
  const emptyVariables = variables.filter(v => !v.value);
  if (emptyVariables.length > 0) {
    console.log('[Prompt Enhancer] WARNING: Some variables have empty values:', emptyVariables);
  }
  
  // Создаем уникальный идентификатор для элемента
  const elementId = element.id || 
                   element.getAttribute('data-id') || 
                   `element-${element.tagName}-${Date.now()}`;
  
  // Сохраняем переменные и временную метку
  variableStore[elementId] = {
    variables,
    timestamp: Date.now()
  };
  
  // Если у элемента нет id, добавляем наш идентификатор как data-id
  if (!element.id && !element.getAttribute('data-id')) {
    element.setAttribute('data-id', elementId);
  }
  
  console.log(`[Prompt Enhancer] Stored variables for element ${elementId}:`, variables);
  console.log('[Prompt Enhancer] Current variable store:', variableStore);
  
  // Очистка старых записей (старше 1 часа)
  const oneHourAgo = Date.now() - 60 * 60 * 1000;
  Object.keys(variableStore).forEach(key => {
    if (variableStore[key].timestamp < oneHourAgo) {
      delete variableStore[key];
    }
  });
}

// Функция для получения переменных для элемента
function getVariablesForElement(element: HTMLElement): PromptVariable[] {
  console.log('[Prompt Enhancer] Getting variables for element:', element);
  console.log('[Prompt Enhancer] Element ID:', element.id);
  console.log('[Prompt Enhancer] Element data-id:', element.getAttribute('data-id'));
  console.log('[Prompt Enhancer] Element classList:', element.classList);
  console.log('[Prompt Enhancer] Current variable store:', variableStore);
  
  // Пытаемся найти переменные по id или data-id
  const elementId = element.id || element.getAttribute('data-id');
  
  if (elementId && variableStore[elementId]) {
    console.log(`[Prompt Enhancer] Found variables by ID ${elementId}:`, variableStore[elementId].variables);
    return variableStore[elementId].variables;
  }
  
  // Если не нашли по id, пробуем найти по другим атрибутам
  for (const key in variableStore) {
    // Если элемент имеет такой же класс или другие атрибуты, возвращаем переменные
    if (element.classList && element.classList.length > 0) {
      const classList = Array.from(element.classList);
      if (classList.some(cls => key.includes(cls))) {
        console.log(`[Prompt Enhancer] Found variables by class match with key ${key}:`, variableStore[key].variables);
        return variableStore[key].variables;
      }
    }
  }
  
  // Если ничего не нашли, возвращаем пустой массив
  console.log('[Prompt Enhancer] No variables found for element');
  return [];
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

// Функция для обработки вставки текста
function handleInsertPrompt(text: string, variables: PromptVariable[] = [], sendResponse: (response: any) => void, doNotReplaceVariables: boolean = false): void {
  console.log('[Prompt Enhancer] Handling insert prompt request with text:', text.substring(0, 30) + '...');
  console.log('[Prompt Enhancer] doNotReplaceVariables:', doNotReplaceVariables);
  if (variables.length > 0) {
    console.log('[Prompt Enhancer] Variables:', variables);
  }
  
  // Получаем URL текущей страницы
  const url = window.location.href;
  
  // Получаем подходящий адаптер для текущего URL
  const adapter = AdapterFactory.getAdapter(url);
  
  // Если есть переменные, всегда настраиваем перехват отправки
  // Это позволит заменить переменные при отправке, даже если установлен флаг doNotReplaceVariables
  if (variables.length > 0) {
    console.log('[Prompt Enhancer] Setting up submit interception for variables:', variables);
    adapter.interceptSubmit(variables);
  }
  
  // Пытаемся найти элемент ввода с помощью адаптера
  const inputElement = adapter.findInputElement();
  
  if (inputElement) {
    adapter.debugLog(`Found input element using ${adapter.name} adapter, inserting text`);
    
    // Сохраняем переменные для этого элемента, даже если установлен флаг doNotReplaceVariables
    // Это позволит заменить переменные при отправке, если пользователь нажмет Enter
    if (variables.length > 0) {
      storeVariablesForElement(inputElement, variables);
    }
    
    // Добавляем небольшую задержку для вставки текста
    setTimeout(() => {
      const success = adapter.insertText(inputElement, text);
      sendResponse({ success, site: adapter.name });
    }, 100);
    
    return;
  }
  
  // Если адаптер не нашел элемент ввода, пробуем использовать активный элемент
  if (activeTextElement) {
    adapter.debugLog('Using active text element');
    
    // Сохраняем переменные для активного элемента
    if (variables.length > 0) {
      storeVariablesForElement(activeTextElement, variables);
    }
    
    const success = adapter.insertText(activeTextElement, text);
    sendResponse({ success, element: 'active' });
    return;
  }
  
  // Если ничего не нашли, возвращаем ошибку
  adapter.debugLog('No suitable input element found');
  sendResponse({ success: false, error: 'No active text element found' });
}

// Listen for messages from the background script
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  console.log('[Prompt Enhancer] Received message:', message);
  
  if (message.action === 'insertPrompt') {
    if (message.text) {
      // Извлекаем переменные, если они есть
      const variables = message.variables || [];
      
      // Извлекаем флаг doNotReplaceVariables
      const doNotReplaceVariables = message.doNotReplaceVariables === true;
      
      console.log('[Prompt Enhancer] Processing insertPrompt action with:');
      console.log('[Prompt Enhancer] Text:', message.text);
      console.log('[Prompt Enhancer] Variables:', variables);
      console.log('[Prompt Enhancer] doNotReplaceVariables:', doNotReplaceVariables);
      
      try {
        // Обрабатываем вставку текста
        handleInsertPrompt(message.text, variables, sendResponse, doNotReplaceVariables);
      } catch (error: any) {
        console.error('[Prompt Enhancer] Error in handleInsertPrompt:', error);
        sendResponse({ 
          success: false, 
          error: 'Error handling insert prompt: ' + (error.message || String(error)) 
        });
      }
      return true; // Keep the message channel open for async response
    } else {
      console.error('[Prompt Enhancer] No text provided in insertPrompt message');
      sendResponse({ success: false, error: 'No text provided' });
    }
  } else {
    console.log('[Prompt Enhancer] Unknown action:', message.action);
  }
  
  return true; // Keep the message channel open for async response
});

// Экспортируем функцию getVariablesForElement для использования в адаптерах
(window as any).promptEnhancer = {
  getVariablesForElement
};

console.log('Prompt Enhancer: Content script loaded');
