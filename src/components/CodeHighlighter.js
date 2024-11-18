import React from 'react';
import Prism from 'prismjs';
import 'prismjs/components/prism-python';
import 'prismjs/themes/prism-tomorrow.css';

export function CodeHighlighter({ code }) {
  React.useEffect(() => {
    Prism.highlightAll();
  }, [code]);

  return (
    <pre className="rounded-lg overflow-x-auto">
      <code className="language-python">
        {code}
      </code>
    </pre>
  );
}
