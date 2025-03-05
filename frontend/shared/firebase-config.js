// Firebase configuration
// This file should be imported by both web app and extension

// Firebase configuration from Firebase Console
export const firebaseConfig = {
  apiKey: "AIzaSyDf1lMT5LTJXdoKw7neVzzmk_Wb3AUzMEo",
  authDomain: "prompt-enhancer-8f2c8.firebaseapp.com",
  projectId: "prompt-enhancer-8f2c8",
  storageBucket: "prompt-enhancer-8f2c8.firebasestorage.app",
  messagingSenderId: "766330989860",
  appId: "1:766330989860:web:e7e3fa777439eddbb4d7b1"
};

// Firebase Authentication helper functions
export const firebaseAuth = {
  // Initialize Firebase Auth
  initAuth: async (auth) => {
    // Set persistence to LOCAL to keep the user logged in
    // even after browser restart
    try {
      await auth.setPersistence('local');
      console.log('Firebase Auth initialized with LOCAL persistence');
    } catch (error) {
      console.error('Error setting auth persistence:', error);
    }
  },
  
  // Sign in with email and password
  signInWithEmailPassword: async (auth, email, password) => {
    try {
      const userCredential = await auth.signInWithEmailAndPassword(email, password);
      return {
        user: userCredential.user,
        token: await userCredential.user.getIdToken()
      };
    } catch (error) {
      console.error('Error signing in:', error);
      throw error;
    }
  },
  
  // Sign up with email and password
  signUpWithEmailPassword: async (auth, email, password) => {
    try {
      const userCredential = await auth.createUserWithEmailAndPassword(email, password);
      return {
        user: userCredential.user,
        token: await userCredential.user.getIdToken()
      };
    } catch (error) {
      console.error('Error signing up:', error);
      throw error;
    }
  },
  
  // Sign out
  signOut: async (auth) => {
    try {
      await auth.signOut();
      console.log('User signed out');
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  },
  
  // Get current user
  getCurrentUser: (auth) => {
    return new Promise((resolve, reject) => {
      const unsubscribe = auth.onAuthStateChanged(user => {
        unsubscribe();
        resolve(user);
      }, reject);
    });
  },
  
  // Get ID token
  getIdToken: async (user) => {
    if (!user) return null;
    try {
      return await user.getIdToken();
    } catch (error) {
      console.error('Error getting ID token:', error);
      return null;
    }
  }
};

// API helper functions
export const api = {
  // Base URL for API requests
  baseUrl: 'http://localhost:8000',
  
  // Make authenticated request to API
  fetchWithAuth: async (endpoint, options = {}, token) => {
    if (!token) {
      throw new Error('No authentication token available');
    }
    
    const url = `${api.baseUrl}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers
    };
    
    try {
      const response = await fetch(url, {
        ...options,
        headers
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `API error: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error(`Error fetching ${endpoint}:`, error);
      throw error;
    }
  },
  
  // Enhance prompt
  enhancePrompt: async (text, token) => {
    return api.fetchWithAuth('/api/enhance-prompt', {
      method: 'POST',
      body: JSON.stringify({ text })
    }, token);
  },
  
  // Get prompt templates
  getPromptTemplates: async (token) => {
    return api.fetchWithAuth('/api/prompt-templates', {
      method: 'GET'
    }, token);
  },
  
  // Create prompt template
  createPromptTemplate: async (template, token) => {
    return api.fetchWithAuth('/api/prompt-templates', {
      method: 'POST',
      body: JSON.stringify(template)
    }, token);
  }
};
