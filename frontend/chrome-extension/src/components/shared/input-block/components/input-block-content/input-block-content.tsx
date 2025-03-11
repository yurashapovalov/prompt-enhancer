import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import './input-block-content.css';

// Функция для дебаунсинга
function debounce<T extends (...args: any[]) => any>(func: T, wait: number): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  
  return function(...args: Parameters<T>) {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}


interface InputBlockContentProps {
  value?: string;
  onChange?: (value: string) => void;
  className?: string;
  placeholder?: string;
  children?: React.ReactNode;
  onVariablesChange?: (variables: string[]) => void; // Callback function to notify parent component about detected variables
}

export const InputBlockContent: React.FC<InputBlockContentProps> = ({ 
  value = '',
  onChange,
  className = '',
  placeholder = 'Enter text...',
  children,
  onVariablesChange,
}) => {
  // Use children as initial value if provided, otherwise use the value prop
  const initialValue = children ? (typeof children === 'string' ? children : String(children)) : value;
  const [text, setText] = useState(initialValue);
  const [htmlContent, setHtmlContent] = useState('');
  const contentRef = useRef<HTMLDivElement>(null);
  const selectionRef = useRef<{ start: number; end: number }>({ start: 0, end: 0 });
  
  // Function to highlight variables in the text with special styling
  const highlightVariables = useCallback((content: string): string => {
    if (!content) return '';
    
    // Replace {{variable}} with <span class="variable">{{variable}}</span> for visual highlighting
    // Using the same regex pattern as in extractVariables function for consistency
    return content.replace(/\{\{(.*?)\}\}/g, '<span class="variable">{{$1}}</span>');
  }, []);
  
  // Function to extract variable names from text content
  const extractVariables = useCallback((content: string): string[] => {
    if (!content) return [];
    
    const variables: string[] = [];
    // Use regex to find text within double curly braces {{variable}}
    // Note: Using .*? (non-greedy match) instead of [^{}]+ to support spaces and other characters
    const regex = /\{\{(.*?)\}\}/g;
    let match;
    
    while ((match = regex.exec(content)) !== null) {
      // Add variable name to the array, trimming any extra whitespace
      const variableName = match[1].trim();
      if (variableName) {
        variables.push(variableName);
      }
    }
    
    // Remove duplicate variable names using Set
    return [...new Set(variables)];
  }, []);
  
  // Memoize the variables list to avoid unnecessary recalculations
  const currentVariables = useMemo(() => extractVariables(text), [text, extractVariables]);
  
  // Save cursor position before modifying content
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
  
  // Restore cursor position after content has been modified
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
  
  // Process text to convert single braces to double braces for variables
  const processText = useCallback((text: string): string => {
    if (!text) return '';
    
    // Process single braces in real-time
    // Find patterns like {variable} and convert them to {{variable}}
    // But only if they're not already part of an existing {{variable}}
    return text.replace(/\{([^{}]*?)\}/g, (match, p1) => {
      // Check if this match is already part of double braces
      // We do this by checking if there's a '{' character before the match
      // or a '}' character after the match in the original text
      const index = text.indexOf(match);
      if (index > 0 && text[index - 1] === '{') {
        return match; // This is already part of {{variable}}, leave it as is
      }
      if (index + match.length < text.length && text[index + match.length] === '}') {
        return match; // This is already part of {{variable}}, leave it as is
      }
      return `{{${p1}}}`; // Convert {variable} to {{variable}}
    });
  }, []);
  
  // Функция для вызова onChange
  const handleOnChange = useCallback((text: string) => {
    if (onChange) {
      onChange(text);
    }
  }, [onChange]);
  
  // Handle input changes in the editable content
  const handleInput = () => {
    if (contentRef.current) {
      // Save cursor position before making changes
      saveSelection();
      
      // Get raw text without HTML markup
      const rawText = contentRef.current.innerText || '';
      
      // Process text to convert single braces to double braces
      const processedText = processText(rawText);
      
      // Update text state with processed content
      setText(processedText);
      
      // Вызываем функцию для onChange
      handleOnChange(processedText);
      
      // HTML-содержимое обновится автоматически через useEffect
    }
  };
  
  // Handle keyboard events in the editable content
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      // Prevent default Enter behavior (which would create a new paragraph)
      e.preventDefault();
      
      // Use execCommand to insert a line break instead
      document.execCommand('insertLineBreak');
      
      // Update text and HTML content after inserting the line break
      handleInput();
    }
  };
  
  // Update text state when value or children props change externally
  useEffect(() => {
    if (children && typeof children === 'string' && children !== text) {
      setText(children);
    } else if (value !== text && !children) {
      setText(value);
    }
  }, [value, children, text]);
  
  // Update HTML content whenever text changes to apply variable highlighting
  useEffect(() => {
    setHtmlContent(highlightVariables(text));
  }, [text, highlightVariables]);
  
  // Restore cursor position after HTML content has been updated
  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.innerHTML = htmlContent;
      restoreSelection();
    }
  }, [htmlContent]);
  
  // Store previous variables list for comparison to detect changes
  const prevVariablesRef = useRef<string[]>([]);
  
  // Создаем дебаунсированную функцию для обработки изменений переменных
  const debouncedVariablesChange = useCallback(
    debounce((variables: string[]) => {
      if (onVariablesChange) {
        onVariablesChange(variables);
      }
    }, 200), // 200ms задержка
    [onVariablesChange]
  );
  
  // Track changes in variables and only call onVariablesChange when actual changes occur
  useEffect(() => {
    if (onVariablesChange) {
      // Check if variables have changed by comparing length or content
      const prevVars = prevVariablesRef.current;
      const varsChanged = 
        prevVars.length !== currentVariables.length || 
        currentVariables.some(v => !prevVars.includes(v));
      
      // Only call onVariablesChange callback if variables have actually changed
      if (varsChanged) {
        prevVariablesRef.current = [...currentVariables];
        debouncedVariablesChange(currentVariables);
      }
    }
  }, [currentVariables, debouncedVariablesChange]);
  
  // Handle blur event - show placeholder if content is empty
  const handleBlur = () => {
    if (contentRef.current) {
      if (!contentRef.current.textContent?.trim()) {
        contentRef.current.classList.add('empty');
      }
      
      // Remove focused class from parent input-block element
      const inputBlock = contentRef.current.closest('.input-block');
      if (inputBlock) {
        inputBlock.classList.remove('input-block--focused');
      }
    }
  };
  
  const handleFocus = () => {
    if (contentRef.current) {
      contentRef.current.classList.remove('empty');
      
      // Add focused class to parent input-block element
      const inputBlock = contentRef.current.closest('.input-block');
      if (inputBlock) {
        inputBlock.classList.add('input-block--focused');
      }
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
