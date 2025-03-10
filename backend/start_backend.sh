#!/bin/bash

# Скрипт для автоматического запуска бэкенда

# Цвета для вывода
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Запуск бэкенда Prompt Enhancer...${NC}"

# Проверка наличия виртуального окружения
if [ ! -d "venv" ]; then
    echo -e "${YELLOW}Виртуальное окружение не найдено. Создаю...${NC}"
    python -m venv venv
    if [ $? -ne 0 ]; then
        echo -e "${RED}Ошибка при создании виртуального окружения.${NC}"
        exit 1
    fi
    echo -e "${GREEN}Виртуальное окружение создано успешно.${NC}"
fi

# Активация виртуального окружения
echo -e "${YELLOW}Активация виртуального окружения...${NC}"
source venv/bin/activate

# Проверка, нужно ли устанавливать зависимости
REQUIREMENTS_HASH_FILE=".requirements_hash"
CURRENT_HASH=$(md5sum requirements.txt | awk '{ print $1 }')
INSTALL_DEPS=true

if [ -f "$REQUIREMENTS_HASH_FILE" ]; then
    SAVED_HASH=$(cat "$REQUIREMENTS_HASH_FILE")
    if [ "$CURRENT_HASH" == "$SAVED_HASH" ]; then
        echo -e "${GREEN}Зависимости уже установлены и актуальны.${NC}"
        INSTALL_DEPS=false
    fi
fi

# Установка зависимостей, если нужно
if [ "$INSTALL_DEPS" = true ]; then
    echo -e "${YELLOW}Установка зависимостей...${NC}"
    pip install -r requirements.txt
    if [ $? -ne 0 ]; then
        echo -e "${RED}Ошибка при установке зависимостей из requirements.txt.${NC}"
        echo -e "${YELLOW}Пробую установить firebase-admin напрямую...${NC}"
        pip install firebase-admin
        if [ $? -ne 0 ]; then
            echo -e "${RED}Ошибка при установке firebase-admin.${NC}"
            exit 1
        fi
    fi
    # Сохраняем хэш requirements.txt
    echo "$CURRENT_HASH" > "$REQUIREMENTS_HASH_FILE"
    echo -e "${GREEN}Зависимости установлены успешно.${NC}"
fi

# Очистка кэша Python перед запуском
echo -e "${YELLOW}Очистка кэша Python...${NC}"
find . -name "__pycache__" -type d -exec rm -rf {} +
find . -name "*.pyc" -delete

# Запуск бэкенда с оптимизированными настройками
echo -e "${YELLOW}Запуск бэкенда...${NC}"
# Устанавливаем переменные окружения для оптимизации Python
export PYTHONOPTIMIZE=1
export PYTHONUNBUFFERED=1
export PYTHONHASHSEED=0

# Запускаем с увеличенным лимитом на количество открытых файлов
ulimit -n 4096 2>/dev/null || true

# Запускаем с оптимизированными настройками uvicorn
python run.py

# Деактивация виртуального окружения при выходе
deactivate
