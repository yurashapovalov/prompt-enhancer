# Скрипты для управления данными в Firebase

В этой директории находятся скрипты для управления данными в Firebase Firestore. Они позволяют добавлять тестовые данные, удалять данные и выполнять другие операции с базой данных.

## Требования

Для работы скриптов необходимо:

1. Node.js (версия 14 или выше)
2. Файл сервисного аккаунта Firebase (`prompt-enhancer-8f2c8-firebase-adminsdk-fbsvc-751d476968.json`) в директории `backend/`

## Доступные скрипты

### Добавление тестовых данных

- `seed-firestore.js` - добавляет тестовые промпты, переменные и записи истории для указанного пользователя

```bash
node seed-firestore.js <user_id>
```

### Удаление данных

- `delete-variables.js` - удаляет все переменные указанного пользователя

```bash
node delete-variables.js <user_id>
```

- `delete-prompts.js` - удаляет все промпты указанного пользователя

```bash
node delete-prompts.js <user_id>
```

- `delete-history.js` - удаляет все записи истории указанного пользователя

```bash
node delete-history.js <user_id>
```

- `delete-all-data.js` - удаляет все данные указанного пользователя (промпты, переменные, история)

```bash
node delete-all-data.js <user_id>
```

## Примеры использования

### Добавление тестовых данных

```bash
cd frontend/shared
node seed-firestore.js 9wfpc7SokLe1QPw1RoLiJdZPgY93
```

### Удаление всех данных пользователя

```bash
cd frontend/shared
node delete-all-data.js 9wfpc7SokLe1QPw1RoLiJdZPgY93
```

### Удаление только переменных

```bash
cd frontend/shared
node delete-variables.js 9wfpc7SokLe1QPw1RoLiJdZPgY93
```

## Примечания

- Все скрипты требуют ID пользователя в качестве аргумента командной строки
- Скрипты используют Firebase Admin SDK для доступа к Firestore
- Операции удаления необратимы, поэтому используйте их с осторожностью
- Для больших коллекций операции могут занять некоторое время
