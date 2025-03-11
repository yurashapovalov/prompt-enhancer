import { BaseAdapter } from './adapter-interface';
import { PromptVariable } from '@services/api-service';

/**
 * Адаптер для сайта Claude (Anthropic)
 * Упрощенная версия, которая только вставляет текст в поле ввода
 */
export class ClaudeAdapter extends BaseAdapter {
  name = 'Claude';
  
  /**
   * Проверяет, может ли адаптер обрабатывать данный URL
   * @param url URL страницы
   * @returns true, если URL содержит домен claude.ai
   */
  canHandle(url: string): boolean {
    return url.includes('claude.ai');
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
   * Находит элемент ввода на странице Claude
   * @returns Элемент ввода или null, если элемент не найден
   */
  findInputElement(): HTMLElement | null {
    this.debugLog('Searching for Claude input element');
    
    // Поиск по классу ProseMirror и максимальной ширине (характерно для Claude)
    const proseMirrorElements = document.querySelectorAll('.ProseMirror.break-words.max-w-\\[60ch\\]');
    if (proseMirrorElements.length > 0) {
      this.debugLog('Found ProseMirror element with max-width 60ch');
      return proseMirrorElements[0] as HTMLElement;
    }
    
    // Поиск по классу ProseMirror внутри контейнера с aria-label
    const claudeContainers = document.querySelectorAll('[aria-label="Write your prompt to Claude"]');
    if (claudeContainers.length > 0) {
      const container = claudeContainers[0];
      const proseMirror = container.querySelector('.ProseMirror');
      if (proseMirror) {
        this.debugLog('Found ProseMirror inside Claude container');
        return proseMirror as HTMLElement;
      }
    }
    
    // Поиск по классу ProseMirror
    const allProseMirrorElements = document.querySelectorAll('.ProseMirror[contenteditable="true"]');
    if (allProseMirrorElements.length > 0) {
      this.debugLog('Found generic ProseMirror element');
      return allProseMirrorElements[0] as HTMLElement;
    }
    
    // Поиск по атрибуту contenteditable и data-placeholder для Claude
    const claudeElements = document.querySelectorAll('[contenteditable="true"][data-placeholder="How can Claude help you today?"]');
    if (claudeElements.length > 0) {
      this.debugLog('Found element with Claude placeholder');
      return claudeElements[0] as HTMLElement;
    }
    
    // Поиск любого contenteditable элемента
    const editableElements = document.querySelectorAll('[contenteditable="true"]');
    if (editableElements.length > 0) {
      this.debugLog('Found generic contenteditable element');
      return editableElements[0] as HTMLElement;
    }
    
    this.debugLog('No suitable input element found');
    return null;
  }
  
  /**
   * Вставляет текст в элемент ввода Claude
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
    
    // Проверяем, является ли элемент ProseMirror
    if (element.classList.contains('ProseMirror') || element.closest('.ProseMirror')) {
      this.debugLog('Element is ProseMirror');
      
      try {
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
        
        // Фокус на элементе
        element.focus();
        
        this.debugLog('Text inserted successfully');
        return true;
      } catch (error) {
        this.debugLog('Error inserting text:', error);
        return false;
      }
    } else if (element.isContentEditable) {
      this.debugLog('Element is standard contenteditable');
      element.textContent = text;
      element.dispatchEvent(new Event('input', { bubbles: true }));
      element.dispatchEvent(new Event('change', { bubbles: true }));
      element.focus();
      return true;
    } else if (element.tagName === 'TEXTAREA' || (element.tagName === 'INPUT' && (element as HTMLInputElement).type === 'text')) {
      this.debugLog('Element is a TEXTAREA or INPUT (unusual for Claude)');
      const inputElement = element as HTMLTextAreaElement | HTMLInputElement;
      inputElement.value = text;
      inputElement.dispatchEvent(new Event('input', { bubbles: true }));
      inputElement.dispatchEvent(new Event('change', { bubbles: true }));
      inputElement.focus();
      return true;
    } else {
      this.debugLog('Element is not a text input or contenteditable:', element);
      return false;
    }
  }
}
