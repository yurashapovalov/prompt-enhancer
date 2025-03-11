import { BaseAdapter } from './adapter-interface';
import { PromptVariable } from '@services/api-service';

/**
 * Адаптер для сайта ChatGPT (OpenAI)
 * Упрощенная версия, которая только вставляет текст в поле ввода
 */
export class ChatGptAdapter extends BaseAdapter {
  name = 'ChatGPT';
  
  /**
   * Проверяет, может ли адаптер обрабатывать данный URL
   * @param url URL страницы
   * @returns true, если URL содержит домен chat.openai.com
   */
  canHandle(url: string): boolean {
    return url.includes('chat.openai.com');
  }
  
  /**
   * Настраивает перехват отправки сообщения для замены переменных
   * В упрощенной версии ничего не делает, так как переменные заменяются перед вставкой
   * @param variables Массив переменных с их значениями
   */
  interceptSubmit(variables: PromptVariable[]): void {
    this.debugLog('Variables are replaced before insertion, no need for interception');
  }
  
  /**
   * Находит элемент ввода на странице ChatGPT
   * @returns Элемент ввода или null, если элемент не найден
   */
  findInputElement(): HTMLElement | null {
    this.debugLog('Searching for ChatGPT input element');
    
    // Поиск по id
    const textareaById = document.getElementById('prompt-textarea');
    if (textareaById) {
      this.debugLog('Found textarea by id: prompt-textarea');
      return textareaById;
    }
    
    // Поиск по атрибуту placeholder
    const textareaByPlaceholder = document.querySelector('textarea[placeholder*="Send a message"]');
    if (textareaByPlaceholder) {
      this.debugLog('Found textarea by placeholder: Send a message');
      return textareaByPlaceholder as HTMLElement;
    }
    
    // Поиск по классу
    const textareaByClass = document.querySelector('textarea.w-full');
    if (textareaByClass) {
      this.debugLog('Found textarea by class: w-full');
      return textareaByClass as HTMLElement;
    }
    
    // Поиск любого textarea
    const anyTextarea = document.querySelector('textarea');
    if (anyTextarea) {
      this.debugLog('Found generic textarea');
      return anyTextarea as HTMLElement;
    }
    
    this.debugLog('No suitable input element found');
    return null;
  }
  
  /**
   * Вставляет текст в элемент ввода ChatGPT
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
    
    try {
      if (element.tagName === 'TEXTAREA') {
        const textarea = element as HTMLTextAreaElement;
        textarea.value = text;
        textarea.dispatchEvent(new Event('input', { bubbles: true }));
        textarea.dispatchEvent(new Event('change', { bubbles: true }));
        textarea.focus();
        this.debugLog('Text inserted successfully into textarea');
        return true;
      } else if (element.isContentEditable) {
        element.textContent = text;
        element.dispatchEvent(new Event('input', { bubbles: true }));
        element.dispatchEvent(new Event('change', { bubbles: true }));
        element.focus();
        this.debugLog('Text inserted successfully into contenteditable');
        return true;
      } else {
        this.debugLog('Element is not a textarea or contenteditable:', element);
        return false;
      }
    } catch (error) {
      this.debugLog('Error inserting text:', error);
      return false;
    }
  }
}
