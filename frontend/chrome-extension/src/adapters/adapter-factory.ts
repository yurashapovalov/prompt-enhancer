import { SiteAdapter } from './adapter-interface';
import { ChatGptAdapter } from './chatgpt-adapter';
import { ClaudeAdapter } from './claude-adapter';
import { GenericAdapter } from './generic-adapter';

/**
 * Фабрика адаптеров для сайтов
 * Выбирает подходящий адаптер в зависимости от URL
 */
export class AdapterFactory {
  /**
   * Список доступных адаптеров
   * Порядок важен: адаптеры проверяются в порядке их добавления
   */
  private static adapters: SiteAdapter[] = [
    new ChatGptAdapter(),
    new ClaudeAdapter(),
    new GenericAdapter() // Всегда должен быть последним, так как canHandle всегда возвращает true
  ];
  
  /**
   * Возвращает подходящий адаптер для данного URL
   * @param url URL страницы
   * @returns Подходящий адаптер
   */
  static getAdapter(url: string): SiteAdapter {
    for (const adapter of this.adapters) {
      if (adapter.canHandle(url)) {
        console.log(`[Prompt Enhancer] Using ${adapter.name} adapter for URL: ${url}`);
        return adapter;
      }
    }
    
    // Этот код никогда не должен выполняться, так как GenericAdapter.canHandle всегда возвращает true
    console.warn('[Prompt Enhancer] No suitable adapter found, using GenericAdapter as fallback');
    return new GenericAdapter();
  }
  
  /**
   * Регистрирует новый адаптер
   * @param adapter Адаптер для регистрации
   */
  static registerAdapter(adapter: SiteAdapter): void {
    // Вставляем новый адаптер перед GenericAdapter
    this.adapters.splice(this.adapters.length - 1, 0, adapter);
    console.log(`[Prompt Enhancer] Registered new adapter: ${adapter.name}`);
  }
}
