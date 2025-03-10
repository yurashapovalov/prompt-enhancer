// delete-variables.js
// Скрипт для удаления всех переменных из Firestore для указанного пользователя

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
  console.error('Usage: node delete-variables.js <user_id>');
  process.exit(1);
}

// Функция для удаления всех переменных пользователя
async function deleteVariables(userId) {
  try {
    const db = admin.firestore();
    
    // Получаем все переменные пользователя
    const variablesRef = db.collection('variables').where('userId', '==', userId);
    const snapshot = await variablesRef.get();
    
    if (snapshot.empty) {
      console.log(`No variables found for user ${userId}.`);
      return;
    }
    
    // Удаляем каждую переменную
    const batch = db.batch();
    let count = 0;
    
    snapshot.forEach(doc => {
      batch.delete(doc.ref);
      count++;
    });
    
    // Выполняем batch delete
    await batch.commit();
    console.log(`Successfully deleted ${count} variables for user ${userId}.`);
  } catch (error) {
    console.error('Error deleting variables:', error);
    process.exit(1);
  }
}

// Запускаем функцию удаления
console.log(`Deleting variables for user ${userId}...`);
deleteVariables(userId)
  .then(() => {
    console.log('Operation completed.');
    process.exit(0);
  })
  .catch(error => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });
