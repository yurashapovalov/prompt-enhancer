import { Prompt, promptsApi, historyApi } from './api-service';
import { getCurrentUserToken } from './auth-service';

// Keys for local storage
const STORAGE_KEYS = {
  PROMPTS: 'local_prompts',
  HISTORY: 'local_history',
  SYNC_QUEUE: 'sync_queue',
  LAST_SYNC: 'last_sync_timestamp',
};

// Check if we're in a Chrome extension environment
const isChromeExtension = typeof chrome !== 'undefined' && chrome.storage && chrome.runtime;

// Types for sync queue
interface SyncQueueItem {
  type: 'prompt' | 'history';
  action: 'create' | 'update' | 'delete';
  id?: string;
  data?: any;
  timestamp: number;
}

// In-memory cache for faster access
const memoryCache: Record<string, any> = {};

/**
 * Get data from storage with memory cache for performance
 */
const getFromStorage = async <T>(key: string): Promise<T | null> => {
  // First check memory cache for instant access
  if (memoryCache[key] !== undefined) {
    return memoryCache[key] as T;
  }
  
  // Get from actual storage
  let data = null;
  
  if (!isChromeExtension) {
    // Browser localStorage
    const rawData = localStorage.getItem(key);
    data = rawData ? JSON.parse(rawData) : null;
  } else {
    // Chrome extension storage
    data = await new Promise((resolve) => {
      chrome.storage.local.get([key], (result) => {
        resolve(result[key] || null);
      });
    });
  }
  
  // Update cache and return
  memoryCache[key] = data;
  return data;
};

/**
 * Set data in storage with memory cache update
 */
const setInStorage = async <T>(key: string, data: T): Promise<void> => {
  // Update memory cache immediately
  memoryCache[key] = data;
  
  // Store in actual storage
  if (!isChromeExtension) {
    // Browser localStorage
    localStorage.setItem(key, JSON.stringify(data));
    return Promise.resolve();
  } else {
    // Chrome extension storage
    return new Promise((resolve) => {
      chrome.storage.local.set({ [key]: data }, () => {
        resolve();
      });
    });
  }
};

/**
 * Local storage service for prompts
 */
export const localPromptsStorage = {
  // Get all prompts from local storage
  getAll: async (): Promise<Prompt[]> => {
    const prompts = await getFromStorage<Prompt[]>(STORAGE_KEYS.PROMPTS);
    return prompts || [];
  },
  
  // Get a specific prompt by ID
  getById: async (id: string): Promise<Prompt | null> => {
    const prompts = await localPromptsStorage.getAll();
    return prompts.find(p => p.id === id) || null;
  },
  
  // Save a prompt to local storage and queue for sync
  save: async (prompt: Prompt): Promise<void> => {
    // Get current prompts
    const prompts = await localPromptsStorage.getAll();
    const index = prompts.findIndex(p => p.id === prompt.id);
    
    // Update or add the prompt
    if (index >= 0) {
      prompts[index] = prompt;
    } else {
      prompts.push(prompt);
    }
    
    // Save to storage
    await setInStorage(STORAGE_KEYS.PROMPTS, prompts);
    
    // Queue for server sync
    await syncQueue.add({
      type: 'prompt',
      action: index >= 0 ? 'update' : 'create',
      id: prompt.id,
      data: prompt,
      timestamp: Date.now(),
    });
  },
  
  // Delete a prompt from local storage
  delete: async (id: string): Promise<void> => {
    const prompts = await localPromptsStorage.getAll();
    const filteredPrompts = prompts.filter(p => p.id !== id);
    
    await setInStorage(STORAGE_KEYS.PROMPTS, filteredPrompts);
    
    // Add to sync queue
    await syncQueue.add({
      type: 'prompt',
      action: 'delete',
      id,
      timestamp: Date.now(),
    });
  },
  
  // Initialize local storage with data from server
  initialize: async (): Promise<void> => {
    try {
      const token = await getCurrentUserToken();
      if (!token) return;
      
      const serverPrompts = await promptsApi.getPrompts(token);
      await setInStorage(STORAGE_KEYS.PROMPTS, serverPrompts);
      
      console.log('Initialized local prompts storage with server data');
    } catch (error) {
      console.error('Failed to initialize local prompts storage:', error);
    }
  },
};


/**
 * Sync queue service for managing server synchronization
 */
export const syncQueue = {
  // Get all items in the sync queue
  getAll: async (): Promise<SyncQueueItem[]> => {
    const queue = await getFromStorage<SyncQueueItem[]>(STORAGE_KEYS.SYNC_QUEUE);
    return queue || [];
  },
  
  // Add an item to the sync queue
  add: async (item: SyncQueueItem): Promise<void> => {
    const queue = await syncQueue.getAll();
    queue.push(item);
    await setInStorage(STORAGE_KEYS.SYNC_QUEUE, queue);
    
    // Trigger sync if needed
    syncService.scheduleSyncIfNeeded();
  },
  
  // Clear the sync queue
  clear: async (): Promise<void> => {
    await setInStorage(STORAGE_KEYS.SYNC_QUEUE, []);
  },
};

/**
 * Sync service for synchronizing with the server
 */
export const syncService = {
  syncInProgress: false,
  syncTimeout: null as number | null,
  
  // Schedule a sync if needed
  scheduleSyncIfNeeded: () => {
    if (syncService.syncTimeout) {
      clearTimeout(syncService.syncTimeout);
    }
    
    // Schedule sync after 30 seconds
    syncService.syncTimeout = setTimeout(() => {
      syncService.syncWithServer();
    }, 30000); // 30 seconds
  },
  
  // Sync with server
  syncWithServer: async (): Promise<void> => {
    if (syncService.syncInProgress) return;
    
    try {
      syncService.syncInProgress = true;
      
      const token = await getCurrentUserToken();
      if (!token) {
        console.log('No authentication token, skipping sync');
        return;
      }
      
      const queue = await syncQueue.getAll();
      if (queue.length === 0) {
        console.log('Sync queue is empty, nothing to sync');
        return;
      }
      
      console.log(`Syncing ${queue.length} items with server...`);
      
      // Process queue items
      for (const item of queue) {
        try {
          await syncService.processQueueItem(item, token);
        } catch (error) {
          console.error(`Failed to process sync queue item:`, item, error);
          // Continue with next item
        }
      }
      
      // Clear the queue after successful sync
      await syncQueue.clear();
      
      // Update last sync timestamp
      await setInStorage(STORAGE_KEYS.LAST_SYNC, Date.now());
      
      console.log('Sync completed successfully');
    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      syncService.syncInProgress = false;
    }
  },
  
  // Process a queue item
  processQueueItem: async (item: SyncQueueItem, token: string): Promise<void> => {
    switch (item.type) {
      case 'prompt':
        await syncService.syncPrompt(item, token);
        break;
      case 'history':
        await syncService.syncHistory(item, token);
        break;
    }
  },
  
  // Sync a prompt
  syncPrompt: async (item: SyncQueueItem, token: string): Promise<void> => {
    switch (item.action) {
      case 'create':
        if (item.data) {
          await promptsApi.createPrompt(item.data, token);
        }
        break;
      case 'update':
        if (item.id && item.data) {
          await promptsApi.updatePrompt(item.id, item.data, token);
        }
        break;
      case 'delete':
        if (item.id) {
          await promptsApi.deletePrompt(item.id, token);
        }
        break;
    }
  },
  
  // Sync a history entry
  syncHistory: async (item: SyncQueueItem, token: string): Promise<void> => {
    switch (item.action) {
      case 'create':
        if (item.data) {
          await historyApi.addHistoryEntry(item.data, token);
        }
        break;
      case 'delete':
        if (item.id) {
          await historyApi.deleteHistoryEntry(item.id, token);
        }
        break;
    }
  },
  
  // Initialize sync service
  initialize: async (): Promise<void> => {
    // Set up event listeners for sync
    window.addEventListener('beforeunload', () => {
      syncService.syncWithServer();
    });
    
    // Initial sync
    syncService.syncWithServer();
    
    // Schedule periodic sync
    setInterval(() => {
      syncService.syncWithServer();
    }, 60000); // Every minute
  },
};

/**
 * Initialize all local storage
 */
export const initializeLocalStorage = async (): Promise<void> => {
  await localPromptsStorage.initialize();
  
  // Initialize sync service
  await syncService.initialize();
  
  console.log('Local storage initialized');
};
