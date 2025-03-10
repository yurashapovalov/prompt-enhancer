#!/bin/bash

# Скрипт для автоматического запуска фронтенда

# Цвета для вывода
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Запуск фронтенда Prompt Enhancer...${NC}"

# Проверка, нужно ли устанавливать зависимости
PACKAGE_HASH_FILE=".package_hash"
CURRENT_HASH=$(md5sum package.json | awk '{ print $1 }')
INSTALL_DEPS=true

if [ -d "node_modules" ] && [ -f "$PACKAGE_HASH_FILE" ]; then
    SAVED_HASH=$(cat "$PACKAGE_HASH_FILE")
    if [ "$CURRENT_HASH" == "$SAVED_HASH" ]; then
        echo -e "${GREEN}Зависимости уже установлены и актуальны.${NC}"
        INSTALL_DEPS=false
    fi
fi

# Установка зависимостей, если нужно
if [ "$INSTALL_DEPS" = true ]; then
    echo -e "${YELLOW}Установка зависимостей...${NC}"
    # Используем npm ci вместо npm install для более быстрой и надежной установки
    npm ci
    if [ $? -ne 0 ]; then
        echo -e "${RED}Ошибка при установке зависимостей через npm ci. Пробую npm install...${NC}"
        npm install
        if [ $? -ne 0 ]; then
            echo -e "${RED}Ошибка при установке зависимостей.${NC}"
            exit 1
        fi
    fi
    # Сохраняем хэш package.json
    echo "$CURRENT_HASH" > "$PACKAGE_HASH_FILE"
    echo -e "${GREEN}Зависимости установлены успешно.${NC}"
fi

# Очистка кэша Vite перед запуском
echo -e "${YELLOW}Очистка кэша Vite...${NC}"
rm -rf node_modules/.vite 2>/dev/null || true

# Запуск фронтенда с оптимизированными настройками
echo -e "${YELLOW}Запуск фронтенда...${NC}"
# Устанавливаем переменные окружения для оптимизации
export NODE_ENV=development
export VITE_FAST_REFRESH=true

# Запускаем с оптимизированными настройками
npm run dev -- --force
