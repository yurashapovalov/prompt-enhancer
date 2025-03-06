import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence
} from 'firebase/auth';
import { firebaseConfig } from '../../../shared/firebase-config';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Set persistence to LOCAL
setPersistence(auth, browserLocalPersistence)
  .catch((error: Error) => {
    console.error('Error setting auth persistence:', error);
  });

// Save token to chrome.storage.local
const saveToken = async (token: string): Promise<void> => {
  return new Promise((resolve) => {
    chrome.storage.local.set({ authToken: token }, resolve);
  });
};

// Get token from chrome.storage.local
const getToken = async (): Promise<string | null> => {
  return new Promise((resolve) => {
    chrome.storage.local.get(['authToken'], (result: { authToken?: string }) => {
      resolve(result.authToken || null);
    });
  });
};

// Remove token from chrome.storage.local
const removeToken = async (): Promise<void> => {
  return new Promise((resolve) => {
    chrome.storage.local.remove(['authToken'], resolve);
  });
};

// Sign in with email and password
export const signIn = async (email: string, password: string): Promise<string> => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const token = await userCredential.user.getIdToken();
    await saveToken(token);
    return token;
  } catch (error) {
    console.error('Error signing in:', error);
    throw error;
  }
};

// Sign up with email and password
export const signUp = async (email: string, password: string): Promise<string> => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const token = await userCredential.user.getIdToken();
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
    await signOut(auth);
    await removeToken();
  } catch (error) {
    console.error('Error signing out:', error);
    throw error;
  }
};

// Check if user is authenticated
export const isAuthenticated = async (): Promise<boolean> => {
  const token = await getToken();
  return !!token;
};

// Get current user's ID token
export const getCurrentUserToken = async (): Promise<string | null> => {
  return getToken();
};

// Open authentication page in a new tab
export const openAuthPage = (): void => {
  // Получаем ID расширения
  const extensionId = chrome.runtime.id;
  
  chrome.tabs.create({
    url: `http://localhost:5173/login?source=extension&extensionId=${extensionId}`
  });
};

// Listen for auth state changes
export const onAuthStateChange = (callback: (user: any) => void): (() => void) => {
  return onAuthStateChanged(auth, callback);
};

// Initialize auth service
export const initAuthService = (): void => {
  // Слушаем сообщения от веб-приложения
  chrome.runtime.onMessageExternal.addListener(
    async (message, sender, sendResponse) => {
      // Проверяем, что сообщение от нашего веб-приложения
      if (sender.url && sender.url.startsWith('http://localhost:5173')) {
        // Обрабатываем сообщение об успешной аутентификации
        if (message.action === 'auth_success' && message.token) {
          console.log('Received auth token from web app');
          
          // Сохраняем токен
          await saveToken(message.token);
          
          // Отправляем ответ
          sendResponse({ success: true });
          
          // Обновляем UI расширения, если необходимо
          chrome.runtime.sendMessage({ action: 'auth_updated' });
        }
      }
      
      return true; // Держим соединение открытым для асинхронного ответа
    }
  );
  
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
