
function LabResult({
  status = 'idle',
  message = 'Jalankan kode untuk melihat hasilnya.',
  output = '',
}) {
  const statusStyles = {
    idle: 'bg-slate-100 text-slate-600',
    success: 'bg-teal-50 text-teal-700',
    error: 'bg-red-50 text-red-700',
  };

  const statusLabels = {
    idle: 'Menunggu',
    success: 'Berhasil',
    error: 'Belum memenuhi',
  };

  return (
    <section className="flex h-full min-h-36 flex-col overflow-hidden bg-white">

      {/* HEADER */}
      <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
        <h3 className="text-sm font-semibold text-slate-800">
          Console / Hasil Validasi
        </h3>

        <span
          className={`rounded-full px-3 py-1 text-xs font-medium ${
            statusStyles[status] ?? statusStyles.idle
          }`}
        >
          {statusLabels[status] ?? statusLabels.idle}
        </span>
      </div>

      {/* OUTPUT */}
      <div className="flex-1 overflow-auto bg-slate-950 p-4">
        <p className="mb-2 text-sm text-slate-300">
          {message}
        </p>

        {output && (
          <pre className="whitespace-pre-wrap break-words font-mono text-xs leading-5 text-green-300">
            {output}
          </pre>
        )}
      </div>
    </section>
  );
}

export default LabResult;
