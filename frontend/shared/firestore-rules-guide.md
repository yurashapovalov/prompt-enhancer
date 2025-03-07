# Руководство по изменению правил безопасности Firestore

Правила безопасности Firestore определяют, кто имеет доступ к вашей базе данных и какие операции они могут выполнять. Вот пошаговое руководство по изменению этих правил:

## Шаг 1: Войдите в Firebase Console

1. Откройте [Firebase Console](https://console.firebase.google.com/)
2. Выберите ваш проект "prompt-enhancer-8f2c8"

## Шаг 2: Перейдите к Firestore Database

1. В левом меню выберите "Firestore Database"
2. Если вы еще не создали базу данных, вам будет предложено создать ее. Выберите "Create Database" и следуйте инструкциям.

## Шаг 3: Перейдите к правилам безопасности

1. В верхней части страницы Firestore Database найдите вкладку "Rules"
2. Вы увидите текущие правила безопасности в редакторе

## Шаг 4: Измените правила безопасности

По умолчанию, правила безопасности Firestore выглядят примерно так:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

Эти правила запрещают все операции чтения и записи. Для разработки и тестирования вы можете изменить их, чтобы разрешить все операции:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

**ВАЖНО**: Эти правила разрешают любому пользователю читать и записывать данные в вашу базу данных. Это подходит только для разработки и тестирования. Не используйте такие правила в продакшене!

## Шаг 5: Опубликуйте новые правила

1. Нажмите кнопку "Publish" (или "Опубликовать")
2. Подождите несколько секунд, пока новые правила будут применены

## Более безопасные правила для продакшена

Для продакшена рекомендуется использовать более строгие правила, например:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Правила для коллекции prompts
    match /prompts/{promptId} {
      // Разрешить чтение и запись только аутентифицированным пользователям
      // и только для их собственных документов
      allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
      
      // Разрешить создание новых документов аутентифицированным пользователям
      allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
    }
    
    // Аналогичные правила для других коллекций
    match /variables/{variableId} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
    }
    
    match /history/{historyId} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
    }
  }
}
```

Эти правила разрешают пользователям читать и изменять только свои собственные данные.

## Дополнительная информация

- [Документация по правилам безопасности Firestore](https://firebase.google.com/docs/firestore/security/get-started)
- [Примеры правил безопасности](https://firebase.google.com/docs/firestore/security/rules-structure)
- [Тестирование правил безопасности](https://firebase.google.com/docs/firestore/security/test-rules)
