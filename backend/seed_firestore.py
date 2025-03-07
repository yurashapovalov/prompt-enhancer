#!/usr/bin/env python3
import firebase_admin
from firebase_admin import credentials, firestore
import datetime
import os
import sys

# Путь к файлу сервисного аккаунта
SERVICE_ACCOUNT_KEY_PATH = "../shared/prompt-enhancer-8f2c8-firebase-adminsdk-fbsvc-27add91439.json"

# Цвета для промптов и переменных
COLORS = [
    "var(--color-prompt-tile-emerald)",
    "var(--color-prompt-tile-cobalt)",
    "var(--color-prompt-tile-violet)",
    "var(--color-prompt-tile-tangerine)",
    "var(--color-prompt-tile-crimson)",
    "var(--color-prompt-tile-slate)"
]

# Тестовые промпты
SAMPLE_PROMPTS = [
    {
        "promptName": "Объяснение концепции",
        "promptDescription": "Простое объяснение сложной концепции",
        "promptText": "Объясни [концепция] простыми словами, как будто я новичок. Включи примеры и аналогии.",
        "color": COLORS[0]
    },
    {
        "promptName": "Анализ кода",
        "promptDescription": "Анализ кода на ошибки и улучшения",
        "promptText": "Проанализируй этот код на наличие ошибок, проблем с производительностью и соответствие лучшим практикам:\n\n```\n[код]\n```",
        "color": COLORS[1]
    },
    {
        "promptName": "Генерация идей",
        "promptDescription": "Генерация креативных идей для проекта",
        "promptText": "Предложи 5 креативных идей для [проект/тема].",
        "color": COLORS[2]
    },
    {
        "promptName": "Написание статьи",
        "promptDescription": "Создание структурированной статьи на заданную тему",
        "promptText": "Напиши статью на тему [тема]. Включи введение, основные разделы и заключение.",
        "color": COLORS[3]
    },
    {
        "promptName": "Сравнение технологий",
        "promptDescription": "Сравнение двух технологий или подходов",
        "promptText": "Сравни [технология1] и [технология2]. Укажи преимущества, недостатки и случаи использования каждой.",
        "color": COLORS[4]
    },
    {
        "promptName": "Решение проблемы",
        "promptDescription": "Пошаговое решение проблемы",
        "promptText": "Помоги мне решить следующую проблему: [описание проблемы]. Предложи пошаговое решение.",
        "color": COLORS[5]
    },
    {
        "promptName": "Перевод текста",
        "promptDescription": "Перевод текста с сохранением стиля",
        "promptText": "Переведи следующий текст с [исходный язык] на [целевой язык], сохраняя стиль и нюансы оригинала:\n\n[текст]",
        "color": COLORS[0]
    },
    {
        "promptName": "Резюме текста",
        "promptDescription": "Краткое резюме длинного текста",
        "promptText": "Сделай краткое резюме следующего текста, выделяя ключевые моменты:\n\n[текст]",
        "color": COLORS[1]
    },
    {
        "promptName": "Создание плана",
        "promptDescription": "Создание детального плана проекта",
        "promptText": "Создай детальный план для [проект/задача]. Включи этапы, сроки и необходимые ресурсы.",
        "color": COLORS[2]
    },
    {
        "promptName": "Улучшение текста",
        "promptDescription": "Улучшение стиля и ясности текста",
        "promptText": "Улучши следующий текст, делая его более ясным, лаконичным и профессиональным:\n\n[текст]",
        "color": COLORS[3]
    },
    {
        "promptName": "Создание API документации",
        "promptDescription": "Генерация документации для API",
        "promptText": "Создай документацию для следующего API эндпоинта:\n\nМетод: [GET/POST/PUT/DELETE]\nURL: [URL]\nПараметры: [параметры]\nОтвет: [формат ответа]",
        "color": COLORS[4]
    },
    {
        "promptName": "Генерация тестовых данных",
        "promptDescription": "Создание тестовых данных для разработки",
        "promptText": "Сгенерируй 10 примеров тестовых данных для [тип данных/сущность] в формате JSON.",
        "color": COLORS[5]
    },
    {
        "promptName": "Объяснение ошибки",
        "promptDescription": "Анализ и объяснение ошибки в коде",
        "promptText": "Объясни, что означает следующая ошибка и как её исправить:\n\n[текст ошибки]",
        "color": COLORS[0]
    },
    {
        "promptName": "Создание SQL запроса",
        "promptDescription": "Генерация SQL запроса по описанию",
        "promptText": "Напиши SQL запрос для [описание задачи]. Используй следующую структуру базы данных:\n\n[описание таблиц]",
        "color": COLORS[1]
    },
    {
        "promptName": "Рефакторинг кода",
        "promptDescription": "Улучшение существующего кода",
        "promptText": "Проведи рефакторинг следующего кода, улучшая его читаемость, производительность и соответствие лучшим практикам:\n\n```\n[код]\n```",
        "color": COLORS[2]
    }
]

# Тестовые переменные
SAMPLE_VARIABLES = [
    {
        "variableName": "API_KEY",
        "variableValue": "sk-1234567890abcdef1234567890abcdef",
        "color": COLORS[4]
    },
    {
        "variableName": "DATABASE_URL",
        "variableValue": "https://example.com/api/v1",
        "color": COLORS[5]
    },
    {
        "variableName": "USERNAME",
        "variableValue": "admin",
        "color": COLORS[0]
    },
    {
        "variableName": "PASSWORD",
        "variableValue": "securePassword123!",
        "color": COLORS[1]
    },
    {
        "variableName": "PROJECT_NAME",
        "variableValue": "Prompt Enhancer",
        "color": COLORS[2]
    },
    {
        "variableName": "COMPANY_NAME",
        "variableValue": "Acme Corporation",
        "color": COLORS[3]
    },
    {
        "variableName": "EMAIL",
        "variableValue": "contact@example.com",
        "color": COLORS[4]
    },
    {
        "variableName": "PHONE",
        "variableValue": "+1 (555) 123-4567",
        "color": COLORS[5]
    }
]

# Тестовые записи истории
SAMPLE_HISTORY = [
    {
        "originalPrompt": "Объясни квантовые вычисления",
        "enhancedPrompt": "Объясни квантовые вычисления простыми словами, как будто я новичок. Включи примеры и аналогии. Сделай ответ ясным и лаконичным."
    },
    {
        "originalPrompt": "Напиши функцию сортировки на Python",
        "enhancedPrompt": "Напиши функцию сортировки на Python. Приведи конкретные примеры использования. Сделай ответ ясным и лаконичным."
    },
    {
        "originalPrompt": "Сравни React и Angular",
        "enhancedPrompt": "Сравни React и Angular. Укажи преимущества, недостатки и случаи использования каждого фреймворка. Приведи конкретные примеры. Сделай ответ ясным и лаконичным."
    },
    {
        "originalPrompt": "Как работает блокчейн",
        "enhancedPrompt": "Объясни, как работает блокчейн простыми словами, как будто я новичок. Включи примеры и аналогии. Сделай ответ ясным и лаконичным."
    },
    {
        "originalPrompt": "Напиши план проекта для мобильного приложения",
        "enhancedPrompt": "Напиши детальный план проекта для разработки мобильного приложения. Включи этапы, сроки и необходимые ресурсы. Приведи конкретные примеры. Сделай ответ ясным и лаконичным."
    }
]

def seed_firestore(user_id):
    """
    Заполняет Firestore тестовыми данными для указанного пользователя.
    
    Args:
        user_id: ID пользователя, для которого добавляются данные.
    """
    # Инициализация Firebase
    try:
        cred = credentials.Certificate(SERVICE_ACCOUNT_KEY_PATH)
        app = firebase_admin.initialize_app(cred)
        db = firestore.client()
        print("Firebase initialized successfully.")
    except Exception as e:
        print(f"Error initializing Firebase: {str(e)}")
        sys.exit(1)
    
    # Добавление только первых 3 промптов для быстрого тестирования
    print("\nAdding prompts (first 3 only for quick testing)...")
    for i, prompt in enumerate(SAMPLE_PROMPTS[:3]):
        try:
            prompt_data = prompt.copy()
            prompt_data["userId"] = user_id
            prompt_data["createdAt"] = firestore.SERVER_TIMESTAMP
            prompt_data["updatedAt"] = firestore.SERVER_TIMESTAMP
            
            # Добавление в Firestore
            db.collection("prompts").document().set(prompt_data)
            print(f"  Added prompt {i+1}/3: {prompt_data['promptName']}")
        except Exception as e:
            print(f"  Error adding prompt {i+1}: {str(e)}")
    
    # Добавление только первых 2 переменных для быстрого тестирования
    print("\nAdding variables (first 2 only for quick testing)...")
    for i, variable in enumerate(SAMPLE_VARIABLES[:2]):
        try:
            variable_data = variable.copy()
            variable_data["userId"] = user_id
            variable_data["createdAt"] = firestore.SERVER_TIMESTAMP
            variable_data["updatedAt"] = firestore.SERVER_TIMESTAMP
            
            # Добавление в Firestore
            db.collection("variables").document().set(variable_data)
            print(f"  Added variable {i+1}/2: {variable_data['variableName']}")
        except Exception as e:
            print(f"  Error adding variable {i+1}: {str(e)}")
    
    # Добавление только первой записи истории для быстрого тестирования
    print("\nAdding history entry (first 1 only for quick testing)...")
    try:
        history_data = SAMPLE_HISTORY[0].copy()
        history_data["userId"] = user_id
        history_data["timestamp"] = firestore.SERVER_TIMESTAMP
        
        # Добавление в Firestore
        db.collection("history").document().set(history_data)
        print(f"  Added history entry 1/1")
    except Exception as e:
        print(f"  Error adding history entry: {str(e)}")
    
    print(f"\nTest completed. Added 3 prompts, 2 variables, and 1 history entry for user {user_id}.")
    print("If this test was successful, you can edit the script to add more data.")

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python seed_firestore.py <user_id>")
        sys.exit(1)
    
    user_id = sys.argv[1]
    seed_firestore(user_id)
