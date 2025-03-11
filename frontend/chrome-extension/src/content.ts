// This script runs in the context of any web page

// Global variables
let activeTextElement: HTMLTextAreaElement | HTMLInputElement | HTMLElement | null = null;

// Function to get text from different types of text elements (unused for now)
// function getTextFromElement(element: HTMLElement): string {
//   if (!element) return '';
//   
//   if (element.tagName === 'TEXTAREA' || (element.tagName === 'INPUT' && (element as HTMLInputElement).type === 'text')) {
//     return (element as HTMLTextAreaElement | HTMLInputElement).value;
//   } else if (element.isContentEditable) {
//     return element.textContent || '';
//   }
//   
//   return '';
// }

// Отключаем отладочные сообщения для стабильности интерфейса
const DEBUG = false;

// Функция для логирования отладочных сообщений
function debugLog(...args: any[]): void {
  if (DEBUG) {
    console.log('[Prompt Enhancer]', ...args);
  }
}

// Функция для вставки текста через буфер обмена
function insertTextViaClipboard(element: HTMLElement, text: string): boolean {
  try {
    debugLog('Attempting to insert text via clipboard');
    
    // Сохраняем текущее содержимое буфера обмена
    const originalClipboardData = navigator.clipboard.readText().catch(() => '');
    
    // Фокус на элементе
    element.focus();
    
    // Записываем текст в буфер обмена
    navigator.clipboard.writeText(text).then(() => {
      // Вставляем текст из буфера обмена
      document.execCommand('paste');
      
      // Отправляем события
      element.dispatchEvent(new Event('input', { bubbles: true }));
      element.dispatchEvent(new Event('change', { bubbles: true }));
      
      // Восстанавливаем оригинальное содержимое буфера обмена
      originalClipboardData.then(originalText => {
        navigator.clipboard.writeText(originalText);
      });
      
      debugLog('Text inserted via clipboard');
    }).catch(error => {
      debugLog('Error writing to clipboard:', error);
      return false;
    });
    
    return true;
  } catch (error) {
    debugLog('Error inserting text via clipboard:', error);
    return false;
  }
}

// Функция для вставки текста через Selection API
function insertTextViaSelection(element: HTMLElement, text: string): boolean {
  try {
    debugLog('Attempting to insert text via Selection API');
    
    // Фокус на элементе
    element.focus();
    
    // Очистка текущего выделения
    const selection = window.getSelection();
    if (!selection) {
      debugLog('No selection available');
      return false;
    }
    
    // Создаем новый диапазон
    const range = document.createRange();
    
    // Очищаем содержимое элемента
    element.innerHTML = '';
    
    // Устанавливаем диапазон внутри элемента
    range.selectNodeContents(element);
    selection.removeAllRanges();
    selection.addRange(range);
    
    // Вставляем текст через команду execCommand
    const success = document.execCommand('insertText', false, text);
    
    if (success) {
      // Отправляем события
      element.dispatchEvent(new Event('input', { bubbles: true }));
      element.dispatchEvent(new Event('change', { bubbles: true }));
      debugLog('Text inserted via Selection API');
    } else {
      debugLog('execCommand insertText failed');
    }
    
    return success;
  } catch (error) {
    debugLog('Error inserting text via Selection API:', error);
    return false;
  }
}

// Функция для вставки текста через DataTransfer API
function insertTextViaDataTransfer(element: HTMLElement, text: string): boolean {
  try {
    debugLog('Attempting to insert text via DataTransfer API');
    
    // Фокус на элементе
    element.focus();
    
    // Создаем объект DataTransfer
    const dataTransfer = new DataTransfer();
    dataTransfer.setData('text/plain', text);
    
    // Создаем событие вставки
    const pasteEvent = new ClipboardEvent('paste', {
      clipboardData: dataTransfer,
      bubbles: true,
      cancelable: true
    });
    
    // Отправляем событие
    const success = element.dispatchEvent(pasteEvent);
    
    if (success) {
      // Отправляем дополнительные события
      element.dispatchEvent(new Event('input', { bubbles: true }));
      element.dispatchEvent(new Event('change', { bubbles: true }));
      debugLog('Text inserted via DataTransfer API');
    } else {
      debugLog('DataTransfer paste event failed');
    }
    
    return success;
  } catch (error) {
    debugLog('Error inserting text via DataTransfer API:', error);
    return false;
  }
}

// Функция для вставки текста в ProseMirror
function insertTextToProseMirror(element: HTMLElement, text: string): boolean {
  debugLog('Inserting text to ProseMirror element');
  
  // Пробуем разные методы вставки текста
  let success = false;
  
  // Метод 1: Через Selection API
  if (!success) {
    success = insertTextViaSelection(element, text);
    if (success) debugLog('Inserted via Selection API');
  }
  
  // Метод 2: Через DataTransfer API
  if (!success) {
    success = insertTextViaDataTransfer(element, text);
    if (success) debugLog('Inserted via DataTransfer API');
  }
  
  // Метод 3: Через буфер обмена
  if (!success) {
    success = insertTextViaClipboard(element, text);
    if (success) debugLog('Inserted via Clipboard API');
  }
  
  // Метод 4: Прямая вставка HTML
  if (!success) {
    try {
      debugLog('Attempting direct HTML insertion');
      
      // Очищаем содержимое
      element.innerHTML = '';
      
      // Создаем параграф для текста
      const p = document.createElement('p');
      p.textContent = text;
      
      // Добавляем параграф в contenteditable элемент
      element.appendChild(p);
      
      // Отправляем события для уведомления о изменениях
      element.dispatchEvent(new Event('input', { bubbles: true }));
      element.dispatchEvent(new Event('change', { bubbles: true }));
      
      success = true;
      debugLog('Inserted via direct HTML manipulation');
    } catch (error) {
      debugLog('Error with direct HTML insertion:', error);
    }
  }
  
  // Дополнительные события для ProseMirror
  if (success) {
    setTimeout(() => {
      debugLog('Dispatching additional events for ProseMirror');
      
      // Симулируем нажатие клавиши Enter для активации обработчиков ProseMirror
      const enterEvent = new KeyboardEvent('keydown', {
        key: 'Enter',
        code: 'Enter',
        bubbles: true
      });
      element.dispatchEvent(enterEvent);
      
      // Симулируем нажатие клавиши Space
      const spaceEvent = new KeyboardEvent('keydown', {
        key: ' ',
        code: 'Space',
        bubbles: true
      });
      element.dispatchEvent(spaceEvent);
      
      // Симулируем событие input
      const inputEvent = new InputEvent('input', {
        bubbles: true,
        cancelable: true,
        inputType: 'insertText',
        data: text
      });
      element.dispatchEvent(inputEvent);
    }, 100);
  }
  
  return success;
}

// Function to set text to different types of text elements
function setTextToElement(element: HTMLElement, text: string): void {
  if (!element) {
    debugLog('No element provided to setTextToElement');
    return;
  }
  
  debugLog('Setting text to element:', element.tagName, element.className);
  
  if (element.tagName === 'TEXTAREA' || (element.tagName === 'INPUT' && (element as HTMLInputElement).type === 'text')) {
    debugLog('Element is a TEXTAREA or INPUT');
    const inputElement = element as HTMLTextAreaElement | HTMLInputElement;
    inputElement.value = text;
    inputElement.dispatchEvent(new Event('input', { bubbles: true }));
    inputElement.dispatchEvent(new Event('change', { bubbles: true }));
  } else if (element.isContentEditable) {
    debugLog('Element is contenteditable');
    
    // Специальная обработка для ProseMirror (используется в Claude)
    if (element.classList.contains('ProseMirror') || element.closest('.ProseMirror')) {
      debugLog('Element is ProseMirror');
      insertTextToProseMirror(element, text);
    } else {
      // Стандартная обработка для других contenteditable элементов
      debugLog('Element is standard contenteditable');
      element.textContent = text;
      element.dispatchEvent(new Event('input', { bubbles: true }));
      element.dispatchEvent(new Event('change', { bubbles: true }));
    }
    
    // Фокус на элементе
    element.focus();
  } else {
    debugLog('Element is not a text input or contenteditable:', element);
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

// Функция для поиска элемента ввода на сайте Claude
function findClaudeInputElement(): HTMLElement | null {
  debugLog('Searching for Claude input element');
  
  // Поиск по классу ProseMirror и максимальной ширине (характерно для Claude)
  const proseMirrorElements = document.querySelectorAll('.ProseMirror.break-words.max-w-\\[60ch\\]');
  if (proseMirrorElements.length > 0) {
    debugLog('Found ProseMirror element with max-width 60ch');
    return proseMirrorElements[0] as HTMLElement;
  }
  
  // Поиск по классу ProseMirror внутри контейнера с aria-label
  const claudeContainers = document.querySelectorAll('[aria-label="Write your prompt to Claude"]');
  if (claudeContainers.length > 0) {
    const container = claudeContainers[0];
    const proseMirror = container.querySelector('.ProseMirror');
    if (proseMirror) {
      debugLog('Found ProseMirror inside Claude container');
      return proseMirror as HTMLElement;
    }
  }
  
  // Поиск по классу ProseMirror
  const allProseMirrorElements = document.querySelectorAll('.ProseMirror[contenteditable="true"]');
  if (allProseMirrorElements.length > 0) {
    debugLog('Found generic ProseMirror element');
    return allProseMirrorElements[0] as HTMLElement;
  }
  
  // Поиск по атрибуту contenteditable и data-placeholder для Claude
  const claudeElements = document.querySelectorAll('[contenteditable="true"][data-placeholder="How can Claude help you today?"]');
  if (claudeElements.length > 0) {
    debugLog('Found element with Claude placeholder');
    return claudeElements[0] as HTMLElement;
  }
  
  // Поиск любого contenteditable элемента
  const editableElements = document.querySelectorAll('[contenteditable="true"]');
  if (editableElements.length > 0) {
    debugLog('Found generic contenteditable element');
    return editableElements[0] as HTMLElement;
  }
  
  debugLog('No suitable input element found');
  return null;
}

// Функция для обработки вставки текста
function handleInsertPrompt(text: string, sendResponse: (response: any) => void): void {
  debugLog('Handling insert prompt request with text:', text.substring(0, 30) + '...');
  
  // Проверяем, находимся ли мы на сайте Claude
  const isClaudeSite = window.location.href.includes('claude.ai');
  debugLog('Is Claude site:', isClaudeSite);
  
  // Если мы на сайте Claude, используем специальную логику
  if (isClaudeSite) {
    debugLog('Using Claude-specific logic');
    
    // Пытаемся найти элемент ввода на сайте Claude
    const claudeInputElement = findClaudeInputElement();
    
    if (claudeInputElement) {
      debugLog('Found Claude input element, inserting text');
      
      // Добавляем небольшую задержку для Claude
      setTimeout(() => {
        setTextToElement(claudeInputElement, text);
        sendResponse({ success: true, site: 'claude' });
      }, 100);
      
      return;
    } else {
      debugLog('Could not find Claude input element');
    }
  }
  
  // Если у нас есть активный текстовый элемент, вставляем в него
  if (activeTextElement) {
    debugLog('Using active text element');
    setTextToElement(activeTextElement, text);
    sendResponse({ success: true, element: 'active' });
    return;
  }
  
  // Пробуем найти элемент в фокусе
  const focusedElement = document.activeElement as HTMLElement;
  if (
    focusedElement && 
    (focusedElement.tagName === 'TEXTAREA' || 
     (focusedElement.tagName === 'INPUT' && (focusedElement as HTMLInputElement).type === 'text') ||
     focusedElement.isContentEditable)
  ) {
    debugLog('Using focused element');
    setTextToElement(focusedElement, text);
    sendResponse({ success: true, element: 'focused' });
    return;
  }
  
  // Если ничего не нашли, пробуем найти любой подходящий элемент
  debugLog('Searching for any suitable input element');
  
  // Поиск textarea
  const textareas = document.querySelectorAll('textarea');
  if (textareas.length > 0) {
    debugLog('Found textarea');
    setTextToElement(textareas[0] as HTMLTextAreaElement, text);
    sendResponse({ success: true, element: 'textarea' });
    return;
  }
  
  // Поиск text input
  const inputs = document.querySelectorAll('input[type="text"]');
  if (inputs.length > 0) {
    debugLog('Found text input');
    setTextToElement(inputs[0] as HTMLInputElement, text);
    sendResponse({ success: true, element: 'input' });
    return;
  }
  
  // Поиск contenteditable
  const editables = document.querySelectorAll('[contenteditable="true"]');
  if (editables.length > 0) {
    debugLog('Found contenteditable');
    setTextToElement(editables[0] as HTMLElement, text);
    sendResponse({ success: true, element: 'contenteditable' });
    return;
  }
  
  // Если ничего не нашли, возвращаем ошибку
  debugLog('No suitable input element found');
  sendResponse({ success: false, error: 'No active text element found' });
}

// Listen for messages from the background script
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  debugLog('Received message:', message);
  
  if (message.action === 'insertPrompt' && message.text) {
    handleInsertPrompt(message.text, sendResponse);
    return true; // Keep the message channel open for async response
  }
  
  return true; // Keep the message channel open for async response
});

console.log('Prompt Enhancer: Content script loaded');
