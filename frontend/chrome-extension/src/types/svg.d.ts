declare module '*.svg' {
  import * as React from 'react';

  // Для импорта как React-компонент
  export const ReactComponent: React.FunctionComponent<React.SVGProps<SVGSVGElement>>;

  // Для импорта как строка (raw)
  const src: string;
  export default src;
}
