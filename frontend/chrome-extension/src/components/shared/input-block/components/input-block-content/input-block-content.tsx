import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import './input-block-content.css';

interface InputBlockContentProps {
  value?: string;
  onChange?: (value: string) => void;
  className?: string;
  placeholder?: string;
  children?: React.ReactNode;
  onVariablesChange?: (variables: string[]) => void; // Callback для уведомления о переменных
}

export const InputBlockContent: React.FC<InputBlockContentProps> = ({ 
  value = '',
  onChange,
  className = '',
  placeholder = 'Введите текст...',
  children,
  onVariablesChange,
}) => {
  // Используем children как начальное значение, если оно предоставлено
  const initialValue = children ? (typeof children === 'string' ? children : String(children)) : value;
  const [text, setText] = useState(initialValue);
  const [htmlContent, setHtmlContent] = useState('');
  const contentRef = useRef<HTMLDivElement>(null);
  const selectionRef = useRef<{ start: number; end: number }>({ start: 0, end: 0 });
  
  // Функция для подсветки переменных
  const highlightVariables = useCallback((content: string): string => {
    if (!content) return '';
    
    // Заменяем {{variable}} на <span class="variable">{{variable}}</span>
    // Используем то же регулярное выражение, что и в extractVariables
    return content.replace(/\{\{(.*?)\}\}/g, '<span class="variable">{{$1}}</span>');
  }, []);
  
  // Функция для извлечения переменных из текста
  const extractVariables = useCallback((content: string): string[] => {
    if (!content) return [];
    
    const variables: string[] = [];
    // Используем регулярное выражение, которое ищет текст в двойных фигурных скобках
    // Обратите внимание, что мы используем .*? вместо [^{}]+ для поддержки пробелов и других символов
    const regex = /\{\{(.*?)\}\}/g;
    let match;
    
    while ((match = regex.exec(content)) !== null) {
      // Добавляем переменную, удаляя лишние пробелы
      const variableName = match[1].trim();
      if (variableName) {
        variables.push(variableName);
      }
    }
    
    // Удаляем дубликаты
    return [...new Set(variables)];
  }, []);
  
  // Мемоизируем список переменных, чтобы избежать лишних вычислений
  const currentVariables = useMemo(() => extractVariables(text), [text, extractVariables]);
  
  // Сохраняем позицию курсора
  const saveSelection = () => {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0 && contentRef.current) {
      const range = selection.getRangeAt(0);
      const preSelectionRange = range.cloneRange();
      preSelectionRange.selectNodeContents(contentRef.current);
      preSelectionRange.setEnd(range.startContainer, range.startOffset);
      const start = preSelectionRange.toString().length;
      
      selectionRef.current = {
        start,
        end: start + range.toString().length
      };
    }
  };
  
  // Восстанавливаем позицию курсора
  const restoreSelection = () => {
    if (contentRef.current) {
      const selection = window.getSelection();
      if (selection) {
        const range = document.createRange();
        
        let charIndex = 0;
        let foundStart = false;
        let foundEnd = false;
        
        const traverseNodes = (node: Node) => {
          if (foundStart && foundEnd) return;
          
          if (node.nodeType === Node.TEXT_NODE) {
            const nextCharIndex = charIndex + node.textContent!.length;
            
            if (!foundStart && selectionRef.current.start >= charIndex && selectionRef.current.start <= nextCharIndex) {
              range.setStart(node, selectionRef.current.start - charIndex);
              foundStart = true;
            }
            
            if (!foundEnd && selectionRef.current.end >= charIndex && selectionRef.current.end <= nextCharIndex) {
              range.setEnd(node, selectionRef.current.end - charIndex);
              foundEnd = true;
            }
            
            charIndex = nextCharIndex;
          } else {
            const childNodes = node.childNodes;
            for (let i = 0; i < childNodes.length; i++) {
              traverseNodes(childNodes[i]);
            }
          }
        };
        
        traverseNodes(contentRef.current);
        
        selection.removeAllRanges();
        selection.addRange(range);
      }
    }
  };
  
  // Обработка переменных в тексте
  const processText = useCallback((text: string): string => {
    if (!text) return '';
    
    // Обрабатываем одинарные скобки в реальном времени
    // Ищем паттерны {variable} и заменяем на {{variable}}
    // Но только если это не часть уже существующего {{variable}}
    return text.replace(/\{([^{}]*?)\}/g, (match, p1) => {
      // Проверяем, не является ли это уже частью двойных скобок
      // Для этого проверяем, есть ли в исходном тексте '{{' перед найденным совпадением
      // или '}}' после найденного совпадения
      const index = text.indexOf(match);
      if (index > 0 && text[index - 1] === '{') {
        return match; // Это уже часть {{variable}}, оставляем как есть
      }
      if (index + match.length < text.length && text[index + match.length] === '}') {
        return match; // Это уже часть {{variable}}, оставляем как есть
      }
      return `{{${p1}}}`; // Заменяем {variable} на {{variable}}
    });
  }, []);
  
  // Обработчик изменения текста
  const handleInput = () => {
    if (contentRef.current) {
      // Сохраняем позицию курсора
      saveSelection();
      
      // Получаем текст без HTML-разметки
      const rawText = contentRef.current.innerText || '';
      
      // Обрабатываем текст (заменяем одинарные скобки на двойные)
      const processedText = processText(rawText);
      
      // Обновляем состояние текста
      setText(processedText);
      
      // Вызываем onChange, если он предоставлен
      if (onChange) {
        onChange(processedText);
      }
      
      // Подсвечиваем переменные
      const highlighted = highlightVariables(processedText);
      
      // Обновляем HTML-содержимое только если оно изменилось
      if (highlighted !== contentRef.current.innerHTML) {
        setHtmlContent(highlighted);
      }
    }
  };
  
  // Обработчик нажатия клавиш
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      // Предотвращаем стандартное поведение Enter
      e.preventDefault();
      
      // Используем execCommand для вставки переноса строки
      document.execCommand('insertLineBreak');
      
      // Обновляем текст и HTML после вставки переноса строки
      handleInput();
    }
  };
  
  // Обновляем HTML-содержимое при изменении текста
  useEffect(() => {
    setHtmlContent(highlightVariables(text));
  }, [text, highlightVariables]);
  
  // Обновляем текст при изменении value или children извне
  useEffect(() => {
    if (children && typeof children === 'string' && children !== text) {
      setText(children);
    } else if (value !== text && !children) {
      setText(value);
    }
  }, [value, children, text]);
  
  // Восстанавливаем позицию курсора после обновления HTML
  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.innerHTML = htmlContent;
      restoreSelection();
    }
  }, [htmlContent]);
  
  // Храним предыдущие переменные для сравнения
  const prevVariablesRef = useRef<string[]>([]);
  
  // Отслеживаем изменения переменных в тексте и вызываем onVariablesChange только при реальных изменениях
  useEffect(() => {
    if (onVariablesChange) {
      // Проверяем, изменились ли переменные
      const prevVars = prevVariablesRef.current;
      const varsChanged = 
        prevVars.length !== currentVariables.length || 
        currentVariables.some(v => !prevVars.includes(v));
      
      // Вызываем onVariablesChange только если переменные изменились
      if (varsChanged) {
        onVariablesChange(currentVariables);
        prevVariablesRef.current = [...currentVariables];
      }
    }
  }, [currentVariables, onVariablesChange]);
  
  // Обработчик для пустого содержимого (показываем плейсхолдер)
  const handleBlur = () => {
    if (contentRef.current && !contentRef.current.textContent?.trim()) {
      contentRef.current.classList.add('empty');
    }
  };
  
  const handleFocus = () => {
    if (contentRef.current) {
      contentRef.current.classList.remove('empty');
    }
  };
  
  return (
    <div className={`input-block-content-wrapper ${className}`}>
      <div
        ref={contentRef}
        className={`input-block-content-editable ${!text ? 'empty' : ''}`}
        contentEditable
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        onFocus={handleFocus}
        data-placeholder={placeholder}
        spellCheck={false}
      />
    </div>
  );
};
