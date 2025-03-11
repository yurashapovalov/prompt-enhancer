// Type definitions for Chrome extension API
// This file provides basic type definitions for Chrome extension API

interface Chrome {
  runtime: {
    id: string;
    sendMessage: (message: any, callback?: (response: any) => void) => void;
    onMessage: {
      addListener: (callback: (message: any, sender: any, sendResponse: (response?: any) => void) => void | boolean) => void;
      removeListener: (callback: (message: any, sender: any, sendResponse: (response?: any) => void) => void | boolean) => void;
    };
    onMessageExternal: {
      addListener: (callback: (message: any, sender: any, sendResponse: (response?: any) => void) => void | boolean) => void;
      removeListener: (callback: (message: any, sender: any, sendResponse: (response?: any) => void) => void | boolean) => void;
    };
    lastError?: {
      message: string;
    };
    getManifest: () => any;
  };
  storage: {
    local: {
      get: (keys: string | string[] | object | null, callback: (items: { [key: string]: any }) => void) => void;
      set: (items: { [key: string]: any }, callback?: () => void) => void;
      remove: (keys: string | string[], callback?: () => void) => void;
      clear: (callback?: () => void) => void;
    };
  };
  tabs: {
    query: (queryInfo: { active?: boolean; currentWindow?: boolean }, callback: (tabs: { id?: number; url?: string }[]) => void) => void;
    create: (createProperties: { url?: string }, callback?: (tab: any) => void) => void;
    sendMessage: (tabId: number, message: any, callback?: (response: any) => void) => void;
  };
  sidePanel: {
    setPanelBehavior: (options: { openPanelOnActionClick: boolean }) => void;
  };
}

declare global {
  interface Window {
    chrome: Chrome;
  }
  
  const chrome: Chrome;
}

export {};
