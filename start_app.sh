#!/bin/bash

# Скрипт для запуска всего приложения (бэкенд и фронтенд)

# Цвета для вывода
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Функция для очистки ресурсов при завершении
cleanup() {
    echo -e "\n${YELLOW}Завершение работы приложения...${NC}"
    
    # Завершаем все процессы в группе
    if [ -n "$BACKEND_PID" ]; then
        echo -e "${BLUE}Остановка бэкенда (PID: $BACKEND_PID)...${NC}"
        kill $BACKEND_PID 2>/dev/null
    fi
    
    if [ -n "$FRONTEND_PID" ]; then
        echo -e "${BLUE}Остановка фронтенда (PID: $FRONTEND_PID)...${NC}"
        kill $FRONTEND_PID 2>/dev/null
    fi
    
    echo -e "${GREEN}Приложение остановлено.${NC}"
    exit 0
}

# Регистрируем обработчик сигналов для корректного завершения
trap cleanup SIGINT SIGTERM

echo -e "${YELLOW}Запуск приложения Prompt Enhancer...${NC}"
echo -e "${BLUE}Дата и время: $(date)${NC}"
echo -e "${BLUE}Система: $(uname -a)${NC}"

# Проверка доступности портов
echo -e "${YELLOW}Проверка доступности портов...${NC}"
if lsof -i:8000 >/dev/null 2>&1; then
    echo -e "${RED}Порт 8000 (бэкенд) уже используется. Пожалуйста, остановите процесс, использующий этот порт.${NC}"
    exit 1
fi

if lsof -i:5173 >/dev/null 2>&1; then
    echo -e "${RED}Порт 5173 (фронтенд) уже используется. Пожалуйста, остановите процесс, использующий этот порт.${NC}"
    exit 1
fi

# Запуск бэкенда в фоновом режиме
echo -e "${YELLOW}Запуск бэкенда...${NC}"
cd backend && ./start_backend.sh &
BACKEND_PID=$!

# Ждем, пока бэкенд запустится
echo -e "${BLUE}Ожидание запуска бэкенда...${NC}"
sleep 3

# Проверяем, запустился ли бэкенд
if ! lsof -i:8000 >/dev/null 2>&1; then
    echo -e "${YELLOW}Бэкенд еще не запустился, ждем еще 5 секунд...${NC}"
    sleep 5
    if ! lsof -i:8000 >/dev/null 2>&1; then
        echo -e "${RED}Бэкенд не запустился. Проверьте логи.${NC}"
        cleanup
    fi
fi

echo -e "${GREEN}Бэкенд запущен успешно.${NC}"

# Запуск фронтенда в фоновом режиме
echo -e "${YELLOW}Запуск фронтенда...${NC}"
cd frontend/chrome-extension && ./start_frontend.sh &
FRONTEND_PID=$!

# Ждем, пока фронтенд запустится
echo -e "${BLUE}Ожидание запуска фронтенда...${NC}"
sleep 3

# Проверяем, запустился ли фронтенд
if ! lsof -i:5173 >/dev/null 2>&1; then
    echo -e "${YELLOW}Фронтенд еще не запустился, ждем еще 5 секунд...${NC}"
    sleep 5
    if ! lsof -i:5173 >/dev/null 2>&1; then
        echo -e "${RED}Фронтенд не запустился. Проверьте логи.${NC}"
        cleanup
    fi
fi

echo -e "${GREEN}Фронтенд запущен успешно.${NC}"
echo -e "${GREEN}Приложение запущено и готово к использованию!${NC}"
echo -e "${BLUE}Бэкенд доступен по адресу: http://localhost:8000${NC}"
echo -e "${BLUE}Фронтенд доступен по адресу: http://localhost:5173${NC}"
echo -e "${YELLOW}Нажмите Ctrl+C для завершения работы приложения.${NC}"

# Ожидаем завершения работы
wait
