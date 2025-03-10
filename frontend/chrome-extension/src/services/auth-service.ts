import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { firebaseConfig } from '../../../shared/firebase-config';
import { promptsService, historyService } from './services';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// Set persistence to LOCAL
setPersistence(auth, browserLocalPersistence)
  .catch((error: Error) => {
    console.error('Error setting auth persistence:', error);
  });

// Check if we're in a Chrome extension environment
const isChromeExtension = typeof chrome !== 'undefined' && chrome.storage && chrome.runtime;

// Save token to chrome.storage.local
const saveToken = async (token: string): Promise<void> => {
  console.log('Saving token...');
  if (!isChromeExtension) {
    console.log('Not in Chrome extension environment, saving token to localStorage');
    // For testing in browser, save token to localStorage
    localStorage.setItem('authToken', token);
    return Promise.resolve();
  }
  
  return new Promise((resolve) => {
    chrome.storage.local.set({ authToken: token }, () => {
      console.log('Token saved to chrome.storage.local');
      resolve();
    });
  });
};

// Get token from chrome.storage.local
const getToken = async (): Promise<string | null> => {
  console.log('Getting token...');
  if (!isChromeExtension) {
    console.log('Not in Chrome extension environment, getting token from localStorage');
    // For testing in browser, get token from localStorage
    const token = localStorage.getItem('authToken');
    console.log('Token from localStorage:', token ? 'found' : 'not found');
    return Promise.resolve(token);
  }
  
  return new Promise((resolve) => {
    chrome.storage.local.get(['authToken'], (result: { authToken?: string }) => {
      console.log('Token from chrome.storage.local:', result.authToken ? 'found' : 'not found');
      resolve(result.authToken || null);
    });
  });
};

// Remove token from chrome.storage.local
const removeToken = async (): Promise<void> => {
  console.log('Removing token...');
  if (!isChromeExtension) {
    console.log('Not in Chrome extension environment, removing token from localStorage');
    localStorage.removeItem('authToken');
    return Promise.resolve();
  }
  
  return new Promise((resolve) => {
    chrome.storage.local.remove(['authToken'], () => {
      console.log('Token removed from chrome.storage.local');
      resolve();
    });
  });
};

// Sign in with email and password
export const signIn = async (email: string, password: string): Promise<string> => {
  try {
    console.log(`Signing in with email: ${email}...`);
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    console.log('Sign in successful, getting token...');
    const token = await userCredential.user.getIdToken();
    console.log('Token received, saving...');
    await saveToken(token);
    return token;
  } catch (error) {
    console.error('Error signing in:', error);
    throw error;
  }
};

// Sign in with Google
export const signInWithGoogle = async (): Promise<string> => {
  try {
    console.log('Signing in with Google...');
    const userCredential = await signInWithPopup(auth, googleProvider);
    console.log('Google sign in successful, getting token...');
    const token = await userCredential.user.getIdToken();
    console.log('Token received, saving...');
    await saveToken(token);
    return token;
  } catch (error) {
    console.error('Error signing in with Google:', error);
    throw error;
  }
};

// Sign up with email and password
export const signUp = async (email: string, password: string): Promise<string> => {
  try {
    console.log(`Signing up with email: ${email}...`);
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    console.log('Sign up successful, getting token...');
    const token = await userCredential.user.getIdToken();
    console.log('Token received, saving...');
    await saveToken(token);
    return token;
  } catch (error) {
    console.error('Error signing up:', error);
    throw error;
  }
};

// Sign out
export const signOutUser = async (): Promise<void> => {
  try {
    console.log('Signing out...');
    await signOut(auth);
    console.log('Sign out successful, removing token...');
    await removeToken();
  } catch (error) {
    console.error('Error signing out:', error);
    throw error;
  }
};

// Check if user is authenticated
export const isAuthenticated = async (): Promise<boolean> => {
  console.log('Checking authentication...');
  const token = await getToken();
  console.log('Authentication check result:', !!token);
  return !!token;
};

// Get current user's ID token
export const getCurrentUserToken = async (): Promise<string | null> => {
  console.log('Getting current user token...');
  const token = await getToken();
  if (token) {
    console.log('Current user token received:', token.substring(0, 10) + '...');
  } else {
    console.log('Current user token not found');
  }
  return token;
};

// Open authentication page in a new tab
export const openAuthPage = (): void => {
  if (!isChromeExtension) {
    console.log('Not in Chrome extension environment, cannot open auth page');
    // In browser, just log a message
    console.log('Would open auth page in extension environment');
    return;
  }
  
  // Make sure chrome.runtime and chrome.tabs are available
  if (typeof chrome === 'undefined' || !chrome.runtime || !chrome.tabs || typeof chrome.tabs.create !== 'function') {
    console.error('Chrome extension APIs not available');
    return;
  }
  
  try {
    // Get the extension ID for communication
    const extensionId = chrome.runtime.id;
    
    chrome.tabs.create({
      url: `http://localhost:5173/login?source=extension&extensionId=${extensionId}`
    });
  } catch (error) {
    console.error('Error opening auth page:', error);
  }
};

// Listen for auth state changes
export const onAuthStateChange = (callback: (user: any) => void): (() => void) => {
  return onAuthStateChanged(auth, callback);
};

// Initialize auth service
export const initAuthService = (): void => {
  if (!isChromeExtension) {
    console.log('Not in Chrome extension environment, auth service not initialized');
    return;
  }
  
  // Make sure chrome.runtime is available
  if (typeof chrome === 'undefined' || !chrome.runtime) {
    console.error('Chrome runtime API not available');
    return;
  }
  
  console.log('Initializing auth service in Chrome extension environment');
  
  try {
    // Check if onMessageExternal is available
    if (chrome.runtime.onMessageExternal && typeof chrome.runtime.onMessageExternal.addListener === 'function') {
      // Listen for messages from the web application
      chrome.runtime.onMessageExternal.addListener(
        async (message, sender, sendResponse) => {
          console.log('Received external message:', message);
          console.log('Sender:', sender);
          
          // Verify that the message is from our web application
          if (sender.url && sender.url.startsWith('http://localhost:5173')) {
            console.log('Message is from our web application');
            
            // Handle successful authentication message
            if (message.action === 'auth_success' && message.token) {
              console.log('Received auth token from web app:', message.token.substring(0, 10) + '...');
              
              // Save the authentication token
              await saveToken(message.token);
              
              // Send response back to the web app
              sendResponse({ success: true });
              console.log('Sent response back to web app');
              
              // Update extension UI if necessary
              if (chrome.runtime && chrome.runtime.sendMessage && typeof chrome.runtime.sendMessage === 'function') {
                chrome.runtime.sendMessage({ action: 'auth_updated' });
                console.log('Sent auth_updated message to extension');
                
                // Явно загружаем данные с сервера после авторизации
                console.log('Explicitly loading data from server after authentication...');
                promptsService.loadFromServer();
                historyService.loadFromServer();
              }
            }
          } else {
            console.log('Message is not from our web application');
          }
          
          return true; // Keep the message channel open for async response
        }
      );
    } else {
      console.log('chrome.runtime.onMessageExternal not available');
    }
  } catch (error) {
    console.error('Error setting up message listener:', error);
  }
  
  // Listen for auth state changes
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      // User is signed in
      const token = await user.getIdToken();
      await saveToken(token);
      console.log('User is signed in');
    } else {
      // User is signed out
      await removeToken();
      console.log('User is signed out');
    }
  });
};
