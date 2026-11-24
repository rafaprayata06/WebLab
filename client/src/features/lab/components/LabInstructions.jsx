
function LabInstructions({
  title = 'Latihan Praktik',
  description = '',
  instructions = [],
  requirements = [],
}) {
  const instructionItems = Array.isArray(instructions)
    ? instructions
    : [instructions];

  return (
    <aside className="flex h-full flex-col overflow-y-auto bg-white p-5">
      <div className="mb-5">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-teal-700">
          Instruksi Lab
        </p>

        <h2 className="text-lg font-bold text-slate-900">
          {title}
        </h2>

        {description && (
          <p className="mt-3 text-sm leading-6 text-slate-600">
            {description}
          </p>
        )}
      </div>

      <div className="mb-6">
        <h3 className="mb-3 text-sm font-semibold text-slate-800">
          Langkah pengerjaan
        </h3>

        <ol className="space-y-3">
          {instructionItems.filter(Boolean).map((item, index) => (
            <li key={index} className="flex gap-3 text-sm leading-6 text-slate-600">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-50 text-xs font-semibold text-blue-900">
                {index + 1}
              </span>
              <span>{item}</span>
            </li>
          ))}
        </ol>
      </div>

      {requirements.length > 0 && (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
          <h3 className="mb-3 text-sm font-semibold text-slate-800">
            Kriteria pengerjaan
          </h3>

          <ul className="space-y-2">
            {requirements.map((item, index) => (
              <li key={index} className="flex gap-2 text-sm text-slate-600">
                <span className="text-teal-700">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </aside>
  );
}

export default LabInstructions;
