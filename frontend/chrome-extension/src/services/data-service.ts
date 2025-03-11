import { getCurrentUserToken } from './auth-service';

// Interface for API client
export interface ApiClient<T> {
  getAll: (token: string) => Promise<T[]>;
  create: (item: T, token: string) => Promise<T>;
  update: (id: string, item: T, token: string) => Promise<T>;
  delete: (id: string, token: string) => Promise<void>;
}

// Base type for all data items
export interface BaseItem {
  id?: string;
  [key: string]: any;
}

// Check if we're running in a Chrome extension environment
const isChromeExtension = typeof chrome !== 'undefined' && chrome.storage && chrome.runtime;

/**
 * Universal data service with an "offline-first" approach
 * Provides instant access to data from memory and local storage
 * with background synchronization to the server
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
   * Get all items instantly from memory cache
   */
  getAll(): T[] {
    return [...this.memoryCache];
  }
  
  /**
   * Get a specific item by ID instantly from memory cache
   */
  getById(id: string): T | undefined {
    return this.memoryCache.find(item => item.id === id);
  }
  
  /**
   * Subscribe to data changes
   * @returns Unsubscribe function
   */
  subscribe(listener: (data: T[]) => void): () => void {
    this.listeners.push(listener);
    // Immediately send current data to the new listener
    listener([...this.memoryCache]);
    
    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }
  
  /**
   * Save an item (locally + background server synchronization)
   */
  async save(item: T): Promise<void> {
    // If no ID is provided, generate a temporary one
    if (!item.id) {
      item.id = 'temp_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
    }
    
    // Update in memory cache
    const index = this.memoryCache.findIndex(i => i.id === item.id);
    if (index >= 0) {
      this.memoryCache[index] = { ...item };
    } else {
      this.memoryCache.push({ ...item });
    }
    
    // Notify all listeners about the change
    this.notifyListeners();
    
    // Save to local storage
    await this.saveToStorage();
    
    // Synchronize with server in the background
    this.syncItemToServer(item, index >= 0 ? 'update' : 'create');
  }
  
  /**
   * Delete an item (locally + background server synchronization)
   */
  async delete(id: string): Promise<void> {
    if (id === 'all') {
      // Special case for deleting all items at once
      this.memoryCache = [];
      
      // Notify all listeners about the change
      this.notifyListeners();
      
      // Save to local storage
      await this.saveToStorage();
      
      // Synchronize with server in the background
      this.syncClearAllToServer();
      return;
    }
    
    // Remove from memory cache
    this.memoryCache = this.memoryCache.filter(i => i.id !== id);
    
    // Notify all listeners about the change
    this.notifyListeners();
    
    // Save to local storage
    await this.saveToStorage();
    
    // Synchronize with server in the background
    this.syncDeleteToServer(id);
  }
  
  /**
   * Load data from server (called at application startup)
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
      
      // Update memory cache with server data
      this.memoryCache = serverData;
      console.log(`[${this.storageKey}] Memory cache updated:`, this.memoryCache);
      
      // Notify all listeners about the change
      this.notifyListeners();
      console.log(`[${this.storageKey}] Listeners notified`);
      
      // Save to local storage
      await this.saveToStorage();
      console.log(`[${this.storageKey}] Data saved to storage`);
    } catch (error) {
      // Log error but continue working with local data
      console.error(`[${this.storageKey}] Error loading data from server:`, error);
    } finally {
      this.syncInProgress = false;
    }
  }
  
  /**
   * Notify all listeners about data changes
   */
  private notifyListeners(): void {
    const data = [...this.memoryCache];
    this.listeners.forEach(listener => {
      try {
        listener(data);
      } catch (error) {
        // Ignore errors in listeners to prevent one bad listener from breaking everything
      }
    });
  }
  
  /**
   * Load data from local storage
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
      // If there's a reading error, just use an empty array
    }
  }
  
  /**
   * Save data to local storage
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
      // Silently handle storage errors
    }
  }
  
  /**
   * Synchronize an item with the server (create or update)
   */
  private async syncItemToServer(item: T, action: 'create' | 'update'): Promise<void> {
    if (this.syncInProgress) return;
    
    // Start background synchronization
    setTimeout(async () => {
      try {
        this.syncInProgress = true;
        
        const token = await getCurrentUserToken();
        if (!token) return;
        
        let serverItem: T;
        
        if (action === 'create') {
          // Create item on the server
          serverItem = await this.apiClient.create(item, token);
          
          // If ID changed (temporary -> permanent)
          if (serverItem.id !== item.id) {
            // Update ID in memory cache
            const index = this.memoryCache.findIndex(i => i.id === item.id);
            if (index >= 0) {
              this.memoryCache[index] = serverItem;
              this.notifyListeners();
              await this.saveToStorage();
            }
          }
        } else {
          // Update item on the server
          serverItem = await this.apiClient.update(item.id!, item, token);
        }
      } catch (error) {
        // Silently handle errors - data will remain in local storage
      } finally {
        this.syncInProgress = false;
      }
    }, 100);
  }
  
  /**
   * Synchronize item deletion with the server
   */
  private async syncDeleteToServer(id: string): Promise<void> {
    if (this.syncInProgress) return;
    
    // Start background synchronization
    setTimeout(async () => {
      try {
        this.syncInProgress = true;
        
        const token = await getCurrentUserToken();
        if (!token) return;
        
        // Delete item on the server
        await this.apiClient.delete(id, token);
      } catch (error) {
        // Silently handle errors
      } finally {
        this.syncInProgress = false;
      }
    }, 100);
  }
  
  /**
   * Synchronize deletion of all items with the server
   */
  private async syncClearAllToServer(): Promise<void> {
    if (this.syncInProgress) return;
    
    // Start background synchronization
    setTimeout(async () => {
      try {
        this.syncInProgress = true;
        
        const token = await getCurrentUserToken();
        if (!token) return;
        
        // For history, there's a special clearHistory method
        if (this.storageKey === 'local_history') {
          await this.apiClient.delete('', token);
        } else {
          // For other data types, delete each item individually
          // This is not optimal, but ensures compatibility with the API
          const items = await this.apiClient.getAll(token);
          for (const item of items) {
            if (item.id) {
              await this.apiClient.delete(item.id, token);
            }
          }
        }
      } catch (error) {
        // Silently handle errors
      } finally {
        this.syncInProgress = false;
      }
    }, 100);
  }
}
