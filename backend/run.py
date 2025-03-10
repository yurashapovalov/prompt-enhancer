import sys
import os
import multiprocessing

# Добавляем родительскую директорию в sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

import uvicorn
import logging

# Настройка логирования
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("server_log.txt"),  # Исправлен путь к файлу логов
        logging.StreamHandler()
    ]
)
logger = logging.getLogger("run")

if __name__ == "__main__":
    # Определяем оптимальное количество рабочих процессов
    # Используем количество ядер CPU или 4, в зависимости от того, что меньше
    workers = min(multiprocessing.cpu_count(), 4)
    logger.info(f"Starting server with {workers} workers")
    
    # Запускаем uvicorn с оптимизированными настройками
    uvicorn.run(
        "backend.main:app", 
        host="0.0.0.0", 
        port=8000, 
        reload=True,  # Для разработки
        workers=workers,  # Несколько рабочих процессов
        log_level="info",
        access_log=False,  # Отключаем логи доступа для повышения производительности
        limit_concurrency=100,  # Ограничиваем количество одновременных соединений
        timeout_keep_alive=5,  # Уменьшаем время keep-alive
        proxy_headers=True  # Поддержка заголовков прокси
    )
