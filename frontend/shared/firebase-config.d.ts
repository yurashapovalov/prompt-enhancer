// Type definitions for shared/firebase-config.js

// Firebase configuration
export const firebaseConfig: {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
};

// Firebase Authentication helper functions
export const firebaseAuth: {
  // Initialize Firebase Auth
  initAuth: (auth: any) => Promise<void>;
  
  // Sign in with email and password
  signInWithEmailPassword: (auth: any, email: string, password: string) => Promise<{
    user: any;
    token: string;
  }>;
  
  // Sign up with email and password
  signUpWithEmailPassword: (auth: any, email: string, password: string) => Promise<{
    user: any;
    token: string;
  }>;
  
  // Sign out
  signOut: (auth: any) => Promise<void>;
  
  // Get current user
  getCurrentUser: (auth: any) => Promise<any>;
  
  // Get ID token
  getIdToken: (user: any) => Promise<string | null>;
};

// API helper functions
export const api: {
  // Base URL for API requests
  baseUrl: string;
  
  // Make authenticated request to API
  fetchWithAuth: <T>(endpoint: string, options?: RequestInit, token?: string) => Promise<T>;
  
  // Enhance prompt
  enhancePrompt: (text: string, token: string) => Promise<{ enhancedText: string }>;
  
  // Get prompt templates
  getPromptTemplates: (token: string) => Promise<{ templates: Array<{
    id: string;
    title: string;
    content: string;
    category: string;
    userId: string;
    createdAt: string;
    updatedAt: string;
  }> }>;
  
  // Create prompt template
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
