import { PromptVariable } from '@services/api-service';

/**
 * Интерфейс для адаптеров сайтов чатов
 * Каждый адаптер отвечает за взаимодействие с конкретным сайтом (ChatGPT, Claude и т.д.)
 */
export interface SiteAdapter {
  /**
   * Название сайта/сервиса
   */
  name: string;
  
  /**
   * Проверяет, может ли адаптер обрабатывать данный URL
   * @param url URL страницы
   * @returns true, если адаптер может обрабатывать данный URL
   */
  canHandle(url: string): boolean;
  
  /**
   * Находит элемент ввода на странице
   * @returns Элемент ввода или null, если элемент не найден
   */
  findInputElement(): HTMLElement | null;
  
  /**
   * Вставляет текст в элемент ввода
   * @param element Элемент ввода
   * @param text Текст для вставки
   * @returns true, если вставка прошла успешно
   */
  insertText(element: HTMLElement, text: string): boolean;
  
  /**
   * Логирует отладочные сообщения
   * @param args Аргументы для логирования
   */
  debugLog(...args: any[]): void;
  
  /**
   * Настраивает перехват отправки сообщения для замены переменных
   * @param variables Массив переменных с их значениями
   */
  interceptSubmit(variables: PromptVariable[]): void;
  
  /**
   * Заменяет переменные в тексте на их значения
   * @param text Текст с переменными в формате {{variable_name}}
   * @param variables Массив переменных с их значениями
   * @returns Текст с замененными переменными
   */
  replaceVariables(text: string, variables: PromptVariable[]): string;
}

/**
 * Базовый класс для адаптеров сайтов
 * Содержит общую функциональность для всех адаптеров
 */
export abstract class BaseAdapter implements SiteAdapter {
  abstract name: string;
  abstract canHandle(url: string): boolean;
  abstract findInputElement(): HTMLElement | null;
  abstract insertText(element: HTMLElement, text: string): boolean;
  
  // Флаг для включения/отключения отладочных сообщений
  protected DEBUG = true;
  
  /**
   * Логирует отладочные сообщения
   * @param args Аргументы для логирования
   */
  debugLog(...args: any[]): void {
    if (this.DEBUG) {
      console.log(`[Prompt Enhancer][${this.name}]`, ...args);
    }
  }
  
  /**
   * Заменяет переменные в тексте на их значения
   * @param text Текст с переменными в формате {{variable_name}}
   * @param variables Массив переменных с их значениями
   * @returns Текст с замененными переменными
   */
  replaceVariables(text: string, variables: PromptVariable[]): string {
    if (!text || !variables || variables.length === 0) return text;
    
    console.log('[Prompt Enhancer] Replacing variables in text:', text);
    console.log('[Prompt Enhancer] Variables:', variables);
    
    let processedText = text;
    variables.forEach(variable => {
      // Экранируем специальные символы в имени переменной для использования в регулярном выражении
      const escapedName = variable.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      
      // Создаем регулярное выражение, которое учитывает возможные пробелы в имени переменной
      const pattern = new RegExp(`\\{\\{\\s*${escapedName}\\s*\\}\\}`, 'g');
      
      // Проверяем, есть ли совпадения
      const matches = processedText.match(pattern);
      console.log(`[Prompt Enhancer] Matches for variable "${variable.name}":`, matches);
      
      if (matches && matches.length > 0) {
        // Заменяем переменную на ее значение
        processedText = processedText.replace(pattern, variable.value || '');
        console.log(`[Prompt Enhancer] Replaced "${variable.name}" with "${variable.value}"`);
      } else {
        console.log(`[Prompt Enhancer] No matches found for variable "${variable.name}"`);
      }
    });
    
    console.log('[Prompt Enhancer] Processed text:', processedText);
    return processedText;
  }
  
  /**
   * Настраивает перехват отправки сообщения для замены переменных
   * По умолчанию ничего не делает, должен быть переопределен в конкретных адаптерах
   * @param variables Массив переменных с их значениями
   */
  interceptSubmit(variables: PromptVariable[]): void {
    // Базовая реализация ничего не делает
    this.debugLog('interceptSubmit not implemented for this adapter');
  }
}
