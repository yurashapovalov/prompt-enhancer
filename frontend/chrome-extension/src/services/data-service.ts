import { getCurrentUserToken } from './auth-service';

// Интерфейс для API клиента
export interface ApiClient<T> {
  getAll: (token: string) => Promise<T[]>;
  create: (item: T, token: string) => Promise<T>;
  update: (id: string, item: T, token: string) => Promise<T>;
  delete: (id: string, token: string) => Promise<void>;
}

// Базовый тип для всех данных
export interface BaseItem {
  id?: string;
  [key: string]: any;
}

// Проверка, находимся ли мы в расширении Chrome
const isChromeExtension = typeof chrome !== 'undefined' && chrome.storage && chrome.runtime;

/**
 * Универсальный сервис данных с подходом "offline-first"
 * Обеспечивает мгновенный доступ к данным из памяти и локального хранилища
 * с фоновой синхронизацией с сервером
 */
export class DataService<T extends BaseItem> {
  private storageKey: string;
  private memoryCache: T[] = [];
  private listeners: ((data: T[]) => void)[] = [];
  private apiClient: ApiClient<T>;
  private syncInProgress = false;
  
  constructor(storageKey: string, apiClient: ApiClient<T>) {
    this.storageKey = storageKey;
    this.apiClient = apiClient;
    this.loadFromStorage();
  }
  
  /**
   * Получить все элементы мгновенно из памяти
   */
  getAll(): T[] {
    return [...this.memoryCache];
  }
  
  /**
   * Получить элемент по ID мгновенно из памяти
   */
  getById(id: string): T | undefined {
    return this.memoryCache.find(item => item.id === id);
  }
  
  /**
   * Подписаться на изменения данных
   * @returns Функция для отписки
   */
  subscribe(listener: (data: T[]) => void): () => void {
    this.listeners.push(listener);
    // Сразу отправляем текущие данные
    listener([...this.memoryCache]);
    
    // Возвращаем функцию для отписки
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }
  
  /**
   * Сохранить элемент (локально + фоновая синхронизация)
   */
  async save(item: T): Promise<void> {
    // Если нет ID, генерируем временный
    if (!item.id) {
      item.id = 'temp_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
    }
    
    // Обновляем в памяти
    const index = this.memoryCache.findIndex(i => i.id === item.id);
    if (index >= 0) {
      this.memoryCache[index] = { ...item };
    } else {
      this.memoryCache.push({ ...item });
    }
    
    // Уведомляем слушателей
    this.notifyListeners();
    
    // Сохраняем локально
    await this.saveToStorage();
    
    // Синхронизируем с сервером в фоне
    this.syncItemToServer(item, index >= 0 ? 'update' : 'create');
  }
  
  /**
   * Удалить элемент (локально + фоновая синхронизация)
   */
  async delete(id: string): Promise<void> {
    if (id === 'all') {
      // Специальный случай для удаления всех элементов
      this.memoryCache = [];
      
      // Уведомляем слушателей
      this.notifyListeners();
      
      // Сохраняем локально
      await this.saveToStorage();
      
      // Синхронизируем с сервером в фоне
      this.syncClearAllToServer();
      return;
    }
    
    // Удаляем из памяти
    this.memoryCache = this.memoryCache.filter(i => i.id !== id);
    
    // Уведомляем слушателей
    this.notifyListeners();
    
    // Сохраняем локально
    await this.saveToStorage();
    
    // Синхронизируем с сервером в фоне
    this.syncDeleteToServer(id);
  }
  
  /**
   * Загрузить данные с сервера (вызывается при старте приложения)
   */
  async loadFromServer(): Promise<void> {
    if (this.syncInProgress) return;
    
    try {
      this.syncInProgress = true;
      
      const token = await getCurrentUserToken();
      if (!token) {
        console.error(`[${this.storageKey}] No authentication token available`);
        return;
      }
      
      console.log(`[${this.storageKey}] Loading data from server...`);
      const serverData = await this.apiClient.getAll(token);
      console.log(`[${this.storageKey}] Server data:`, serverData);
      
      // Обновляем данные в памяти
      this.memoryCache = serverData;
      console.log(`[${this.storageKey}] Memory cache updated:`, this.memoryCache);
      
      // Уведомляем слушателей
      this.notifyListeners();
      console.log(`[${this.storageKey}] Listeners notified`);
      
      // Сохраняем локально
      await this.saveToStorage();
      console.log(`[${this.storageKey}] Data saved to storage`);
    } catch (error) {
      // Логируем ошибку, но продолжаем работать с локальными данными
      console.error(`[${this.storageKey}] Error loading data from server:`, error);
    } finally {
      this.syncInProgress = false;
    }
  }
  
  /**
   * Уведомить всех слушателей об изменении данных
   */
  private notifyListeners(): void {
    const data = [...this.memoryCache];
    this.listeners.forEach(listener => {
      try {
        listener(data);
      } catch (error) {
        // Игнорируем ошибки в слушателях
      }
    });
  }
  
  /**
   * Загрузить данные из локального хранилища
   */
  private async loadFromStorage(): Promise<void> {
    try {
      let data: T[] | null = null;
      
      if (isChromeExtension) {
        // Chrome extension storage
        data = await new Promise<T[] | null>((resolve) => {
          chrome.storage.local.get([this.storageKey], (result) => {
            resolve(result[this.storageKey] || null);
          });
        });
      } else {
        // Browser localStorage
        const rawData = localStorage.getItem(this.storageKey);
        data = rawData ? JSON.parse(rawData) : null;
      }
      
      if (data) {
        this.memoryCache = data;
        this.notifyListeners();
      }
    } catch (error) {
      // Если ошибка чтения - просто используем пустой массив
    }
  }
  
  /**
   * Сохранить данные в локальное хранилище
   */
  private async saveToStorage(): Promise<void> {
    try {
      if (isChromeExtension) {
        // Chrome extension storage
        await new Promise<void>((resolve) => {
          chrome.storage.local.set({ [this.storageKey]: this.memoryCache }, () => {
            resolve();
          });
        });
      } else {
        // Browser localStorage
        localStorage.setItem(this.storageKey, JSON.stringify(this.memoryCache));
      }
    } catch (error) {
      // Тихо обрабатываем ошибки хранилища
    }
  }
  
  /**
   * Синхронизировать элемент с сервером (создание или обновление)
   */
  private async syncItemToServer(item: T, action: 'create' | 'update'): Promise<void> {
    if (this.syncInProgress) return;
    
    // Запускаем синхронизацию в фоне
    setTimeout(async () => {
      try {
        this.syncInProgress = true;
        
        const token = await getCurrentUserToken();
        if (!token) return;
        
        let serverItem: T;
        
        if (action === 'create') {
          // Создаем на сервере
          serverItem = await this.apiClient.create(item, token);
          
          // Если ID изменился (временный -> постоянный)
          if (serverItem.id !== item.id) {
            // Обновляем ID в памяти
            const index = this.memoryCache.findIndex(i => i.id === item.id);
            if (index >= 0) {
              this.memoryCache[index] = serverItem;
              this.notifyListeners();
              await this.saveToStorage();
            }
          }
        } else {
          // Обновляем на сервере
          serverItem = await this.apiClient.update(item.id!, item, token);
        }
      } catch (error) {
        // Тихо обрабатываем ошибки - данные останутся в локальном хранилище
      } finally {
        this.syncInProgress = false;
      }
    }, 100);
  }
  
  /**
   * Синхронизировать удаление с сервером
   */
  private async syncDeleteToServer(id: string): Promise<void> {
    if (this.syncInProgress) return;
    
    // Запускаем синхронизацию в фоне
    setTimeout(async () => {
      try {
        this.syncInProgress = true;
        
        const token = await getCurrentUserToken();
        if (!token) return;
        
        // Удаляем на сервере
        await this.apiClient.delete(id, token);
      } catch (error) {
        // Тихо обрабатываем ошибки
      } finally {
        this.syncInProgress = false;
      }
    }, 100);
  }
  
  /**
   * Синхронизировать удаление всех элементов с сервером
   */
  private async syncClearAllToServer(): Promise<void> {
    if (this.syncInProgress) return;
    
    // Запускаем синхронизацию в фоне
    setTimeout(async () => {
      try {
        this.syncInProgress = true;
        
        const token = await getCurrentUserToken();
        if (!token) return;
        
        // Для истории есть специальный метод clearHistory
        if (this.storageKey === 'local_history') {
          await this.apiClient.delete('', token);
        } else {
          // Для других типов данных удаляем каждый элемент по отдельности
          // Это не оптимально, но обеспечивает совместимость с API
          const items = await this.apiClient.getAll(token);
          for (const item of items) {
            if (item.id) {
              await this.apiClient.delete(item.id, token);
            }
          }
        }
      } catch (error) {
        // Тихо обрабатываем ошибки
      } finally {
        this.syncInProgress = false;
      }
    }, 100);
  }
}
