// delete-prompts.js
// Скрипт для удаления всех промптов из Firestore для указанного пользователя

const admin = require('firebase-admin');
const path = require('path');

// Путь к файлу сервисного аккаунта
const serviceAccountPath = path.join(__dirname, '../../backend/prompt-enhancer-8f2c8-firebase-adminsdk-fbsvc-751d476968.json');

// Инициализация Firebase Admin SDK
try {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccountPath)
  });
  console.log('Firebase Admin SDK initialized successfully.');
} catch (error) {
  console.error('Error initializing Firebase Admin SDK:', error);
  process.exit(1);
}

// Получение ID пользователя из аргументов командной строки
const userId = process.argv[2];
if (!userId) {
  console.error('Please provide a user ID as a command line argument.');
  console.error('Usage: node delete-prompts.js <user_id>');
  process.exit(1);
}

// Функция для удаления всех промптов пользователя
async function deletePrompts(userId) {
  try {
    const db = admin.firestore();
    
    // Получаем все промпты пользователя
    const promptsRef = db.collection('prompts').where('userId', '==', userId);
    const snapshot = await promptsRef.get();
    
    if (snapshot.empty) {
      console.log(`No prompts found for user ${userId}.`);
      return;
    }
    
    // Удаляем каждый промпт
    const batch = db.batch();
    let count = 0;
    
    snapshot.forEach(doc => {
      batch.delete(doc.ref);
      count++;
    });
    
    // Выполняем batch delete
    await batch.commit();
    console.log(`Successfully deleted ${count} prompts for user ${userId}.`);
  } catch (error) {
    console.error('Error deleting prompts:', error);
    process.exit(1);
  }
}

// Запускаем функцию удаления
console.log(`Deleting prompts for user ${userId}...`);
deletePrompts(userId)
  .then(() => {
    console.log('Operation completed.');
    process.exit(0);
  })
  .catch(error => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });
