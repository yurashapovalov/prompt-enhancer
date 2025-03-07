// Скрипт для заполнения Firestore тестовыми данными с аутентификацией
// Запустите этот скрипт с помощью Node.js: node seed-firestore-with-auth.js <email> <password> <user_id>

const { initializeApp } = require('firebase/app');
const { 
  getFirestore, 
  collection, 
  addDoc, 
  serverTimestamp 
} = require('firebase/firestore');
const {
  getAuth,
  signInWithEmailAndPassword
} = require('firebase/auth');

// Импортируем конфигурацию Firebase
const { firebaseConfig } = require('./firebase-config');

// Цвета для промптов и переменных
const COLORS = [
  "var(--color-prompt-tile-emerald)",
  "var(--color-prompt-tile-cobalt)",
  "var(--color-prompt-tile-violet)",
  "var(--color-prompt-tile-tangerine)",
  "var(--color-prompt-tile-crimson)",
  "var(--color-prompt-tile-slate)"
];

// Тестовые промпты
const SAMPLE_PROMPTS = [
  {
    promptName: "Объяснение концепции",
    promptDescription: "Простое объяснение сложной концепции",
    promptText: "Объясни [концепция] простыми словами, как будто я новичок. Включи примеры и аналогии.",
    color: COLORS[0]
  },
  {
    promptName: "Анализ кода",
    promptDescription: "Анализ кода на ошибки и улучшения",
    promptText: "Проанализируй этот код на наличие ошибок, проблем с производительностью и соответствие лучшим практикам:\n\n```\n[код]\n```",
    color: COLORS[1]
  },
  {
    promptName: "Генерация идей",
    promptDescription: "Генерация креативных идей для проекта",
    promptText: "Предложи 5 креативных идей для [проект/тема].",
    color: COLORS[2]
  },
  {
    promptName: "Написание статьи",
    promptDescription: "Создание структурированной статьи на заданную тему",
    promptText: "Напиши статью на тему [тема]. Включи введение, основные разделы и заключение.",
    color: COLORS[3]
  },
  {
    promptName: "Сравнение технологий",
    promptDescription: "Сравнение двух технологий или подходов",
    promptText: "Сравни [технология1] и [технология2]. Укажи преимущества, недостатки и случаи использования каждой.",
    color: COLORS[4]
  },
  {
    promptName: "Решение проблемы",
    promptDescription: "Пошаговое решение проблемы",
    promptText: "Помоги мне решить следующую проблему: [описание проблемы]. Предложи пошаговое решение.",
    color: COLORS[5]
  },
  {
    promptName: "Перевод текста",
    promptDescription: "Перевод текста с сохранением стиля",
    promptText: "Переведи следующий текст с [исходный язык] на [целевой язык], сохраняя стиль и нюансы оригинала:\n\n[текст]",
    color: COLORS[0]
  },
  {
    promptName: "Резюме текста",
    promptDescription: "Краткое резюме длинного текста",
    promptText: "Сделай краткое резюме следующего текста, выделяя ключевые моменты:\n\n[текст]",
    color: COLORS[1]
  },
  {
    promptName: "Создание плана",
    promptDescription: "Создание детального плана проекта",
    promptText: "Создай детальный план для [проект/задача]. Включи этапы, сроки и необходимые ресурсы.",
    color: COLORS[2]
  },
  {
    promptName: "Улучшение текста",
    promptDescription: "Улучшение стиля и ясности текста",
    promptText: "Улучши следующий текст, делая его более ясным, лаконичным и профессиональным:\n\n[текст]",
    color: COLORS[3]
  }
];

// Тестовые переменные
const SAMPLE_VARIABLES = [
  {
    variableName: "API_KEY",
    variableValue: "sk-1234567890abcdef1234567890abcdef",
    color: COLORS[4]
  },
  {
    variableName: "DATABASE_URL",
    variableValue: "https://example.com/api/v1",
    color: COLORS[5]
  },
  {
    variableName: "USERNAME",
    variableValue: "admin",
    color: COLORS[0]
  },
  {
    variableName: "PASSWORD",
    variableValue: "securePassword123!",
    color: COLORS[1]
  },
  {
    variableName: "PROJECT_NAME",
    variableValue: "Prompt Enhancer",
    color: COLORS[2]
  }
];

// Тестовые записи истории
const SAMPLE_HISTORY = [
  {
    originalPrompt: "Объясни квантовые вычисления",
    enhancedPrompt: "Объясни квантовые вычисления простыми словами, как будто я новичок. Включи примеры и аналогии. Сделай ответ ясным и лаконичным."
  },
  {
    originalPrompt: "Напиши функцию сортировки на Python",
    enhancedPrompt: "Напиши функцию сортировки на Python. Приведи конкретные примеры использования. Сделай ответ ясным и лаконичным."
  },
  {
    originalPrompt: "Сравни React и Angular",
    enhancedPrompt: "Сравни React и Angular. Укажи преимущества, недостатки и случаи использования каждого фреймворка. Приведи конкретные примеры. Сделай ответ ясным и лаконичным."
  }
];

async function seedFirestore(email, password, userId) {
  try {
    // Инициализация Firebase
    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    console.log("Firebase initialized successfully.");

    // Аутентификация пользователя
    console.log(`Attempting to sign in as ${email}...`);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log(`Successfully signed in as ${userCredential.user.email} (${userCredential.user.uid})`);
    } catch (error) {
      console.error(`Authentication error: ${error.message}`);
      process.exit(1);
    }

    // Инициализация Firestore
    const db = getFirestore(app);

    // Добавление промптов
    console.log("\nAdding prompts...");
    for (let i = 0; i < SAMPLE_PROMPTS.length; i++) {
      try {
        const promptData = {
          ...SAMPLE_PROMPTS[i],
          userId: userId,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        };

        const docRef = await addDoc(collection(db, "prompts"), promptData);
        console.log(`  Added prompt ${i+1}/${SAMPLE_PROMPTS.length}: ${promptData.promptName} (ID: ${docRef.id})`);
      } catch (error) {
        console.error(`  Error adding prompt ${i+1}: ${error.message}`);
      }
    }

    // Добавление переменных
    console.log("\nAdding variables...");
    for (let i = 0; i < SAMPLE_VARIABLES.length; i++) {
      try {
        const variableData = {
          ...SAMPLE_VARIABLES[i],
          userId: userId,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        };

        const docRef = await addDoc(collection(db, "variables"), variableData);
        console.log(`  Added variable ${i+1}/${SAMPLE_VARIABLES.length}: ${variableData.variableName} (ID: ${docRef.id})`);
      } catch (error) {
        console.error(`  Error adding variable ${i+1}: ${error.message}`);
      }
    }

    // Добавление истории
    console.log("\nAdding history entries...");
    for (let i = 0; i < SAMPLE_HISTORY.length; i++) {
      try {
        const historyData = {
          ...SAMPLE_HISTORY[i],
          userId: userId,
          timestamp: serverTimestamp()
        };

        const docRef = await addDoc(collection(db, "history"), historyData);
        console.log(`  Added history entry ${i+1}/${SAMPLE_HISTORY.length} (ID: ${docRef.id})`);
      } catch (error) {
        console.error(`  Error adding history entry ${i+1}: ${error.message}`);
      }
    }

    console.log(`\nSuccessfully added ${SAMPLE_PROMPTS.length} prompts, ${SAMPLE_VARIABLES.length} variables, and ${SAMPLE_HISTORY.length} history entries for user ${userId}.`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
  }
}

// Получение аргументов командной строки
const email = process.argv[2];
const password = process.argv[3];
const userId = process.argv[4];

if (!email || !password || !userId) {
  console.error("Please provide email, password, and user ID as command line arguments.");
  console.error("Usage: node seed-firestore-with-auth.js <email> <password> <user_id>");
  process.exit(1);
}

// Запуск функции заполнения Firestore
seedFirestore(email, password, userId);
