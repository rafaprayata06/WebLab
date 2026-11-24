
import { useState } from 'react';

import CodeEditor from './CodeEditor.jsx';
import LabInstructions from './LabInstructions.jsx';
import LabResult from './LabResult.jsx';

function LabWorkspace({
  exercise,
  onSubmit,
  isSubmitting = false,
  submitResult = null,
}) {
  // Starter code dari database berbentuk TEXT/string.
  const initialCode =
    typeof exercise?.starter_code === 'string'
      ? exercise.starter_code
      : '<!DOCTYPE html>\n<html lang="id">\n<head>\n  <meta charset="UTF-8">\n  <title>Profil Mahasiswa</title>\n</head>\n<body>\n\n</body>\n</html>';

  const [code, setCode] = useState(initialCode);
  const [hasRun, setHasRun] = useState(false);

  // ==========================================
  // RESET CODE
  // ==========================================

  const handleReset = () => {
    setCode(initialCode);
    setHasRun(false);
  };

  // ==========================================
  // RUN CODE
  // ==========================================

  const handleRun = () => {
    setHasRun(true);
  };

  // ==========================================
  // SUBMIT CODE
  // ==========================================

  const handleSubmit = () => {
    if (!onSubmit || isSubmitting) return;

    onSubmit(code);
  };

  // ==========================================
  // REQUIREMENTS
  // ==========================================

  const requirements =
    exercise?.configuration?.validation?.requiredElements ?? [];

  // ==========================================
  // RESULT STATUS
  // ==========================================

  const resultStatus = submitResult
    ? submitResult.passed
      ? 'success'
      : 'error'
    : 'idle';

  const resultMessage = submitResult
    ? submitResult.message
    : hasRun
      ? 'Preview berhasil dijalankan. Kirim hasil latihan untuk memeriksa persyaratan HTML.'
      : 'Menunggu kode dijalankan.';

  const resultOutput = submitResult?.missing_elements?.length
    ? `Elemen yang belum ditemukan:\n${submitResult.missing_elements
        .map((element) => `- <${element}>`)
        .join('\n')}`
    : submitResult?.passed
      ? 'Semua elemen HTML yang diwajibkan berhasil ditemukan.'
      : '';

  return (
    <div className="grid min-h-[700px] grid-cols-1 overflow-hidden rounded-xl border border-slate-200 bg-white lg:grid-cols-[280px_minmax(0,1fr)_minmax(300px,0.9fr)]">

      {/* ================================== */}
      {/* PANEL INSTRUKSI */}
      {/* ================================== */}

      <div className="min-h-[350px] border-b border-slate-200 lg:border-b-0 lg:border-r">
        <LabInstructions
          title={exercise?.title ?? 'Latihan Interactive Lab'}
          description={exercise?.instructions ?? ''}
          requirements={requirements}
        />
      </div>

      {/* ================================== */}
      {/* PANEL EDITOR */}
      {/* ================================== */}

      <div className="flex min-h-[500px] min-w-0 flex-col border-b border-slate-200 lg:border-b-0 lg:border-r">

        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
          <span className="text-sm font-semibold text-slate-800">
            Code Editor
          </span>

          <button
            type="button"
            onClick={handleReset}
            className="text-xs font-medium text-slate-500 transition hover:text-red-600"
          >
            Reset kode
          </button>
        </div>

        {/* HTML TAB */}
        <div className="flex border-b border-slate-200 bg-slate-50">
          <div className="border-b-2 border-teal-700 bg-white px-4 py-3 text-sm font-medium text-teal-800">
            HTML
          </div>
        </div>

        {/* MONACO EDITOR */}
        <div className="min-h-[350px] flex-1">
          <CodeEditor
            value={code}
            language="html"
            onChange={setCode}
            height="100%"
          />
        </div>

        {/* EDITOR ACTIONS */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 p-4">
          <span className="text-xs text-slate-500">
            Perubahan kode tersimpan sementara
          </span>

          <button
            type="button"
            onClick={handleRun}
            className="rounded-lg bg-teal-700 px-5 py-2 text-sm font-semibold text-white transition hover:bg-teal-800"
          >
            Jalankan kode
          </button>
        </div>
      </div>

      {/* ================================== */}
      {/* PANEL PREVIEW DAN CONSOLE */}
      {/* ================================== */}

      <div className="flex min-h-[500px] min-w-0 flex-col">

        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
          <span className="text-sm font-semibold text-slate-800">
            Live Preview
          </span>

          <span className="text-xs text-slate-400">
            HTML Browser Preview
          </span>
        </div>

        {/* PREVIEW */}
        <div className="min-h-[300px] flex-1 bg-slate-100 p-3">
          {hasRun ? (
            <iframe
              title="WebLab HTML Preview"
              srcDoc={code}
              sandbox="allow-scripts"
              className="h-full min-h-[300px] w-full rounded-lg border border-slate-200 bg-white"
            />
          ) : (
            <div className="flex h-full min-h-[300px] items-center justify-center rounded-lg border border-dashed border-slate-300 bg-white p-6 text-center">
              <div>
                <p className="font-semibold text-slate-700">
                  Preview belum tersedia
                </p>

                <p className="mt-2 text-sm text-slate-500">
                  Klik Jalankan kode untuk melihat hasilnya.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* CONSOLE DAN HASIL VALIDASI */}
        <div className="min-h-36 border-t border-slate-200">
          <LabResult
            status={resultStatus}
            message={resultMessage}
            output={resultOutput}
          />
        </div>

        {/* SUBMIT */}
        <div className="border-t border-slate-200 p-4">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="w-full rounded-lg bg-blue-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-900 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? 'Memeriksa kode...' : 'Kirim hasil latihan'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default LabWorkspace;
