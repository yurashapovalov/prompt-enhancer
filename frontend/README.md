# Работа с SVG-иконками

В проекте настроена поддержка SVG-иконок с возможностью изменения цвета через CSS-переменные.

## Добавление иконок

1. Поместите SVG-файлы в папку `src/assets/icons/` соответствующего проекта (web-app или chrome-extension).
2. Убедитесь, что в SVG-файлах для элементов, цвет которых нужно менять, установлен атрибут `fill="currentColor"`.

## Использование иконок

### Вариант 1: Импорт как React-компонент

```tsx
import { ReactComponent as IconName } from '@assets/icons/icon-name.svg';

function MyComponent() {
  return (
    <IconName 
      className="my-icon" 
      // Цвет будет наследоваться от родительского элемента
      // или можно задать явно:
      style={{ fill: 'var(--color-primary)' }} 
    />
  );
}
```

### Вариант 2: Импорт как строка (для более сложных случаев)

```tsx
import iconSrc from '@assets/icons/icon-name.svg';

function MyComponent() {
  return (
    <div 
      className="icon-container"
      dangerouslySetInnerHTML={{ __html: iconSrc }}
    />
  );
}
```

## Стилизация иконок через CSS

```css
/* Для варианта 1 */
.my-icon {
  fill: var(--color-primary);
  width: 24px;
  height: 24px;
}

/* Для варианта 2 */
.icon-container svg {
  fill: var(--color-primary);
  width: 24px;
  height: 24px;
}

/* Изменение цвета при наведении */
.my-icon:hover,
.icon-container:hover svg {
  fill: var(--color-primary-dark);
}
```

## Пример SVG с currentColor

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/>
</svg>
```

## Примечания

- Атрибут `fill="currentColor"` позволяет иконке наследовать цвет текста от родительского элемента.
- Для изменения цвета можно использовать CSS-переменные из `tokens.css`.
- Если нужно менять цвет отдельных частей SVG, убедитесь, что эти части имеют отдельные элементы с атрибутом `fill="currentColor"`.
