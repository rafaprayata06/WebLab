
import { Editor } from '@monaco-editor/react';

function defineWebLabTheme(monaco) {
  monaco.editor.defineTheme('weblab-light', {
    base: 'vs',
    inherit: true,
    rules: [
      { token: 'comment', foreground: '94A3B8', fontStyle: 'italic' },
      { token: 'tag', foreground: '172554' },
      { token: 'delimiter', foreground: '334155' },
      { token: 'attribute.name', foreground: '475569' },
      { token: 'attribute.value', foreground: '0F766E' },
      { token: 'string', foreground: '0F766E' },
      { token: 'keyword', foreground: '7C3AED' },
      { token: 'number', foreground: 'B45309' },
    ],
    colors: {
      'editor.background': '#FFFFFF',
      'editor.foreground': '#111827',
      'editorLineNumber.foreground': '#94A3B8',
      'editorLineNumber.activeForeground': '#172554',
      'editor.lineHighlightBackground': '#F8FAFC',
      'editor.lineHighlightBorder': '#00000000',
      'editorCursor.foreground': '#0F766E',
      'editor.selectionBackground': '#CCFBF1',
      'editor.inactiveSelectionBackground': '#E2E8F0',
      'editorIndentGuide.background1': '#E2E8F0',
      'editorIndentGuide.activeBackground1': '#CBD5E1',
      'editorWhitespace.foreground': '#E2E8F0',
      'editorWidget.background': '#FFFFFF',
      'editorWidget.border': '#E2E8F0',
      'editorGutter.background': '#FFFFFF',
      'scrollbarSlider.background': '#CBD5E180',
      'scrollbarSlider.hoverBackground': '#94A3B880',
      'scrollbarSlider.activeBackground': '#64748B80',
    },
  });
}

function CodeEditor({
  value = '',
  language = 'html',
  onChange,
  height = '100%',
  readOnly = false,
}) {
  return (
    <div className="h-full min-h-[300px] overflow-hidden rounded-lg border border-slate-200 bg-white transition-colors duration-200 focus-within:border-[#0F766E] focus-within:ring-2 focus-within:ring-[#0F766E]/10">
      <Editor
        height={height}
        language={language}
        value={value}
        onChange={(nextValue) => onChange?.(nextValue ?? '')}
        theme="weblab-light"
        beforeMount={defineWebLabTheme}
        loading={
          <div className="flex h-full items-center justify-center gap-2 text-sm text-slate-500">
            <span className="loading loading-spinner loading-sm text-[#0F766E]" />
            Menyiapkan code editor...
          </div>
        }
        options={{
          automaticLayout: true,
          minimap: {
            enabled: false,
          },
          fontSize: 14,
          fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, monospace",
          fontLigatures: true,
          lineNumbers: 'on',
          lineNumbersMinChars: 3,
          roundedSelection: true,
          scrollBeyondLastLine: false,
          smoothScrolling: true,
          cursorBlinking: 'smooth',
          cursorSmoothCaretAnimation: 'on',
          renderLineHighlight: 'all',
          renderWhitespace: 'selection',
          tabSize: 2,
          insertSpaces: true,
          wordWrap: 'on',
          readOnly,
          padding: {
            top: 18,
            bottom: 18,
          },
          bracketPairColorization: {
            enabled: true,
          },
          guides: {
            indentation: true,
            bracketPairs: true,
          },
          scrollbar: {
            vertical: 'auto',
            horizontal: 'auto',
            verticalScrollbarSize: 8,
            horizontalScrollbarSize: 8,
          },
          overviewRulerBorder: false,
          overviewRulerLanes: 0,
          folding: true,
          lineDecorationsWidth: 8,
          contextmenu: true,
        }}
      />
    </div>
  );
}

export default CodeEditor;
