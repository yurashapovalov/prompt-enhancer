import { BaseAdapter } from './adapter-interface';

/**
 * Общий адаптер для сайтов, которые не имеют специализированного адаптера
 */
export class GenericAdapter extends BaseAdapter {
  name = 'Generic';
  
  /**
   * Проверяет, может ли адаптер обрабатывать данный URL
   * @param url URL страницы
   * @returns всегда возвращает true, так как это адаптер по умолчанию
   */
  canHandle(_url: string): boolean {
    return true; // Этот адаптер может обрабатывать любой URL
  }
  
  /**
   * Находит элемент ввода на странице
   * @returns Элемент ввода или null, если элемент не найден
   */
  findInputElement(): HTMLElement | null {
    this.debugLog('Searching for any suitable input element');
    
    // Пробуем найти элемент в фокусе
    const focusedElement = document.activeElement as HTMLElement;
    if (
      focusedElement && 
      (focusedElement.tagName === 'TEXTAREA' || 
       (focusedElement.tagName === 'INPUT' && (focusedElement as HTMLInputElement).type === 'text') ||
       focusedElement.isContentEditable)
    ) {
      this.debugLog('Found focused element');
      return focusedElement;
    }
    
    // Поиск textarea
    const textareas = document.querySelectorAll('textarea');
    if (textareas.length > 0) {
      this.debugLog('Found textarea');
      return textareas[0] as HTMLTextAreaElement;
    }
    
    // Поиск text input
    const inputs = document.querySelectorAll('input[type="text"]');
    if (inputs.length > 0) {
      this.debugLog('Found text input');
      return inputs[0] as HTMLInputElement;
    }
    
    // Поиск contenteditable
    const editables = document.querySelectorAll('[contenteditable="true"]');
    if (editables.length > 0) {
      this.debugLog('Found contenteditable');
      return editables[0] as HTMLElement;
    }
    
    this.debugLog('No suitable input element found');
    return null;
  }
  
  /**
   * Вставляет текст в элемент ввода
   * @param element Элемент ввода
   * @param text Текст для вставки
   * @returns true, если вставка прошла успешно
   */
  insertText(element: HTMLElement, text: string): boolean {
    if (!element) {
      this.debugLog('No element provided to insertText');
      return false;
    }
    
    this.debugLog('Setting text to element:', element.tagName, element.className);
    
    if (element.tagName === 'TEXTAREA' || (element.tagName === 'INPUT' && (element as HTMLInputElement).type === 'text')) {
      this.debugLog('Element is a TEXTAREA or INPUT');
      const inputElement = element as HTMLTextAreaElement | HTMLInputElement;
      inputElement.value = text;
      inputElement.dispatchEvent(new Event('input', { bubbles: true }));
      inputElement.dispatchEvent(new Event('change', { bubbles: true }));
      inputElement.focus();
      return true;
    } else if (element.isContentEditable) {
      this.debugLog('Element is contenteditable');
      element.textContent = text;
      element.dispatchEvent(new Event('input', { bubbles: true }));
      element.dispatchEvent(new Event('change', { bubbles: true }));
      element.focus();
      return true;
    } else {
      this.debugLog('Element is not a text input or contenteditable:', element);
      return false;
    }
  }
}
