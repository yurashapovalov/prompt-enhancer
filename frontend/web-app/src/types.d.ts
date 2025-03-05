// Firebase configuration types
interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

// Declare module for shared/firebase-config.js
declare module '../../../shared/firebase-config' {
  export const firebaseConfig: FirebaseConfig;
  
  export const firebaseAuth: {
    initAuth: (auth: any) => Promise<void>;
    signInWithEmailPassword: (auth: any, email: string, password: string) => Promise<{
      user: any;
      token: string;
    }>;
    signUpWithEmailPassword: (auth: any, email: string, password: string) => Promise<{
      user: any;
      token: string;
    }>;
    signOut: (auth: any) => Promise<void>;
    getCurrentUser: (auth: any) => Promise<any>;
    getIdToken: (user: any) => Promise<string | null>;
  };
  
  export const api: {
    baseUrl: string;
    fetchWithAuth: <T>(endpoint: string, options?: RequestInit, token?: string) => Promise<T>;
    enhancePrompt: (text: string, token: string) => Promise<{ enhancedText: string }>;
    getPromptTemplates: (token: string) => Promise<{ templates: Array<{
      id: string;
      title: string;
      content: string;
      category: string;
      userId: string;
      createdAt: string;
      updatedAt: string;
    }> }>;
    createPromptTemplate: (template: {
      title: string;
      content: string;
      category: string;
    }, token: string) => Promise<{
      id: string;
      title: string;
      content: string;
      category: string;
      userId: string;
      createdAt: string;
      updatedAt: string;
    }>;
  };
}

// Declare module for @shared/firebase-config alias
declare module '@shared/firebase-config' {
  export const firebaseConfig: FirebaseConfig;
  
  export const firebaseAuth: {
    initAuth: (auth: any) => Promise<void>;
    signInWithEmailPassword: (auth: any, email: string, password: string) => Promise<{
      user: any;
      token: string;
    }>;
    signUpWithEmailPassword: (auth: any, email: string, password: string) => Promise<{
      user: any;
      token: string;
    }>;
    signOut: (auth: any) => Promise<void>;
    getCurrentUser: (auth: any) => Promise<any>;
    getIdToken: (user: any) => Promise<string | null>;
  };
  
  export const api: {
    baseUrl: string;
    fetchWithAuth: <T>(endpoint: string, options?: RequestInit, token?: string) => Promise<T>;
    enhancePrompt: (text: string, token: string) => Promise<{ enhancedText: string }>;
    getPromptTemplates: (token: string) => Promise<{ templates: Array<{
      id: string;
      title: string;
      content: string;
      category: string;
      userId: string;
      createdAt: string;
      updatedAt: string;
    }> }>;
    createPromptTemplate: (template: {
      title: string;
      content: string;
      category: string;
    }, token: string) => Promise<{
      id: string;
      title: string;
      content: string;
      category: string;
      userId: string;
      createdAt: string;
      updatedAt: string;
    }>;
  };
}
