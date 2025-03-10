// delete-all-data.js
// Скрипт для удаления всех данных пользователя из Firestore (промпты, переменные, история)

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
  console.error('Usage: node delete-all-data.js <user_id>');
  process.exit(1);
}

// Функция для удаления данных из указанной коллекции
async function deleteCollection(collectionName, userId) {
  try {
    const db = admin.firestore();
    
    // Получаем все документы пользователя из коллекции
    const collectionRef = db.collection(collectionName).where('userId', '==', userId);
    const snapshot = await collectionRef.get();
    
    if (snapshot.empty) {
      console.log(`No ${collectionName} found for user ${userId}.`);
      return 0;
    }
    
    // Удаляем каждый документ
    const batch = db.batch();
    let count = 0;
    
    snapshot.forEach(doc => {
      batch.delete(doc.ref);
      count++;
    });
    
    // Выполняем batch delete
    await batch.commit();
    console.log(`Successfully deleted ${count} ${collectionName} for user ${userId}.`);
    return count;
  } catch (error) {
    console.error(`Error deleting ${collectionName}:`, error);
    return 0;
  }
}

// Функция для удаления всех данных пользователя
async function deleteAllData(userId) {
  try {
    console.log(`Deleting all data for user ${userId}...`);
    
    // Удаляем данные из всех коллекций
    const promptsCount = await deleteCollection('prompts', userId);
    const variablesCount = await deleteCollection('variables', userId);
    const historyCount = await deleteCollection('history', userId);
    
    // Выводим итоговую статистику
    console.log('\nSummary:');
    console.log(`- Prompts deleted: ${promptsCount}`);
    console.log(`- Variables deleted: ${variablesCount}`);
    console.log(`- History entries deleted: ${historyCount}`);
    console.log(`Total items deleted: ${promptsCount + variablesCount + historyCount}`);
    
    return promptsCount + variablesCount + historyCount;
  } catch (error) {
    console.error('Error deleting all data:', error);
    process.exit(1);
  }
}

// Запускаем функцию удаления
deleteAllData(userId)
  .then((totalCount) => {
    console.log(`\nOperation completed. Total ${totalCount} items deleted.`);
    process.exit(0);
  })
  .catch(error => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });
