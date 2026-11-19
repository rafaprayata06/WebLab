
function CodeEditorPreview() {
  const codeLines = [
    { number: 1, content: <span className="text-gray-400">{'<!-- Langkah kecil, hasil nyata -->'}</span> },
    { number: 2, content: <span className="text-blue-300">{'<section class="belajar">'}</span> },
    {
      number: 3,
      content: (
        <>
          <span className="text-blue-300">{"  <h1>"}</span>
          <span className="text-green-300">Halo, dunia!</span>
          <span className="text-blue-300">{"</h1>"}</span>
        </>
      ),
    },
    {
      number: 4,
      content: (
        <>
          <span className="text-blue-300">{"  <p>"}</span>
          <span className="text-green-300">Aku mulai belajar web.</span>
          <span className="text-blue-300">{"</p>"}</span>
        </>
      ),
    },
    { number: 5, content: <span className="text-blue-300">{'</section>'}</span> },
    { number: 6, content: null },
    { number: 7, content: <span className="text-purple-300">.belajar {'{'}</span> },
    { number: 8, content: <span className="text-gray-200">{'  display: flex;'}</span> },
    { number: 9, content: <span className="text-gray-200">{'  gap: 16px;'}</span> },
    { number: 10, content: <span className="text-purple-300">{'}'}</span> },
  ];

  return (
    <div className="auth-code-editor overflow-hidden rounded-2xl border border-white/20 bg-[#111827] shadow-2xl">

      {/* Header editor */}
      <div className="flex items-center justify-between border-b border-white/20 px-5 py-3">
        <span className="text-sm font-medium text-gray-200">
          halaman-pertamaku.html
        </span>

        <span className="text-xs text-gray-400">
          UTF-8
        </span>
      </div>

      {/* Isi editor */}
      <div className="auth-code-lines space-y-1 px-5 py-3 font-mono text-sm">
        {codeLines.map((line) => (
          <div key={line.number} className="flex gap-5">
            <span className="w-5 shrink-0 text-right text-gray-500">
              {line.number}
            </span>

            <span>{line.content}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default CodeEditorPreview;
