// Скрипт для очистки локального хранилища

// Ключи для локального хранилища
const STORAGE_KEYS = [
  'local_prompts',
  'local_history',
  'sync_queue',
  'last_sync_timestamp',
  'cached_prompts',
  'cached_prompts_timestamp',
  'cached_history',
  'cached_history_timestamp'
];

// Проверяем, находимся ли мы в расширении Chrome
const isChromeExtension = typeof chrome !== 'undefined' && chrome.storage && chrome.runtime;

// Функция для очистки локального хранилища
function clearLocalStorage() {
  console.log('Очистка локального хранилища...');
  
  if (isChromeExtension) {
    // Chrome extension storage
    chrome.storage.local.remove(STORAGE_KEYS, () => {
      console.log('Chrome storage очищен успешно');
    });
  } else {
    // Browser localStorage
    STORAGE_KEYS.forEach(key => {
      localStorage.removeItem(key);
    });
    console.log('Local storage очищен успешно');
  }
}

// Очищаем локальное хранилище
clearLocalStorage();

// Выводим инструкции для пользователя
console.log('Локальное хранилище очищено. Пожалуйста, перезапустите приложение, чтобы загрузить свежие данные с сервера.');
