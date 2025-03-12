#!/bin/bash

# Цвета для вывода
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Директория скрипта
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# Порт для бэкенда
PORT=8000

# Функция для остановки процессов, использующих порт
kill_port_processes() {
    local port=$1
    echo -e "${YELLOW}Проверка процессов, использующих порт $port...${NC}"
    
    # Получаем PID процессов, использующих порт
    local pids=$(lsof -ti :$port)
    
    if [ -n "$pids" ]; then
        echo -e "${YELLOW}Найдены процессы, использующие порт $port: $pids${NC}"
        echo -e "${YELLOW}Останавливаем процессы...${NC}"
        
        # Останавливаем процессы
        kill -9 $pids 2>/dev/null
        
        # Проверяем, что порт освободился
        sleep 1
        if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null ; then
            echo -e "${RED}Не удалось освободить порт $port. Пожалуйста, закройте приложение, использующее этот порт.${NC}"
            return 1
        else
            echo -e "${GREEN}Порт $port успешно освобожден.${NC}"
        fi
    else
        echo -e "${GREEN}Порт $port свободен.${NC}"
    fi
    
    return 0
}

# Остановка процессов, использующих порт
kill_port_processes $PORT || exit 1

# Создание виртуального окружения, если оно не существует
if [ ! -d "venv" ]; then
    echo -e "${YELLOW}Создание виртуального окружения Python...${NC}"
    python3 -m venv venv
fi

# Активация виртуального окружения
source venv/bin/activate

# Проверка изменений в requirements.txt
REQUIREMENTS_HASH_FILE=".requirements_hash"
CURRENT_HASH=$(md5sum requirements.txt | awk '{ print $1 }')
SAVED_HASH=""

if [ -f "$REQUIREMENTS_HASH_FILE" ]; then
    SAVED_HASH=$(cat "$REQUIREMENTS_HASH_FILE")
fi

# Установка зависимостей, если они изменились
if [ "$CURRENT_HASH" != "$SAVED_HASH" ]; then
    echo -e "${YELLOW}Обнаружены изменения в requirements.txt. Установка зависимостей...${NC}"
    pip install -r requirements.txt
    echo "$CURRENT_HASH" > "$REQUIREMENTS_HASH_FILE"
else
    echo -e "${GREEN}Зависимости не изменились. Пропуск установки.${NC}"
fi

# Очистка кэша Python
echo -e "${YELLOW}Очистка кэша Python...${NC}"
find . -name "__pycache__" -type d -exec rm -rf {} +

# Запуск бэкенда
echo -e "${GREEN}Запуск бэкенда...${NC}"
python run.py &

# Сохранение PID процесса
echo $! > backend_pid.txt

echo -e "${GREEN}Бэкенд запущен на http://localhost:$PORT${NC}"
echo -e "${GREEN}Документация API доступна на http://localhost:$PORT/docs${NC}"
echo -e "${YELLOW}Для остановки бэкенда выполните: kill $(cat backend_pid.txt)${NC}"
