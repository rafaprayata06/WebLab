
import CodeEditorPreview from './CodeEditorPreview.jsx';

function AuthBranding() {
  return (
    <section className="auth-branding flex h-full min-h-dvh flex-col justify-between bg-[#172554] px-6 py-5 text-white sm:px-8 md:px-10 xl:px-14">

      {/* Konten utama */}
      <div className="auth-branding-content my-auto w-full">

        {/* Logo */}
        <div className="auth-branding-logo mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/15">
            <span className="text-xl font-bold">&lt;/&gt;</span>
          </div>

          <span className="text-2xl font-semibold tracking-tight">
            WebLab
          </span>
        </div>

        {/* Headline */}
        <div className="auth-branding-heading mb-5">

          <span className="inline-flex rounded-full bg-white px-3 py-1 text-xs font-semibold text-[#172554]">
            DARI NOL, JADI BISA
          </span>

          <h1 className="auth-branding-title mt-4 max-w-xl text-2xl leading-tight font-bold tracking-tight xl:text-4xl">
            Belajar Pemrograman Web Secara Interaktif, Langkah demi Langkah
          </h1>

          <p className="auth-branding-description mt-3 max-w-lg text-sm leading-relaxed text-blue-100 xl:text-base">
            Baca konsepnya, coba kodenya, pahami hasilnya.
            Semua dalam satu tempat yang ramah untuk pemula.
          </p>
        </div>

        {/* Code editor */}
        <div className="mx-auto w-full max-w-xl">
          <CodeEditorPreview />

          {/* Notification */}
          <div className="relative -mt-1 flex items-center gap-3 rounded-b-xl bg-white px-4 py-3 text-sm font-medium text-slate-600 shadow-lg sm:max-w-xs">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-teal-600 text-teal-600">
              ✓
            </span>

            Kode pertamamu dimulai di sini.
          </div>
        </div>
      </div>

      {/* Feature information */}
      <div className="auth-branding-features flex shrink-0 flex-wrap gap-x-7 gap-y-2 py-3 text-xs text-blue-100">
        <span>✓ 6 modul terstruktur</span>
        <span>✓ Latihan interaktif</span>
      </div>
    </section>
  );
}

export default AuthBranding;
