import Link from "next/link";
import { signIn } from "./actions";

export default async function LoginPage({ searchParams }: { searchParams: Promise<Record<string,string|undefined>> }) {
  const params = await searchParams;
  const error = params.error;
  const messages: Record<string,string> = {
    missing: "Introduce tu correo y contraseña.",
    credentials: "No se pudo iniciar sesión. Comprueba tus credenciales.",
    invalid: "Usa un correo válido y una contraseña de al menos 10 caracteres.",
    signup: "No se pudo crear la cuenta. Comprueba la configuración de Auth.",
  };
  return (
    <main className="min-h-screen grid lg:grid-cols-2 bg-[#090b10]">
      <section className="hidden lg:flex flex-col justify-between p-12 studio-grid border-r border-[#252a36]">
        <Link href="/" className="font-bold tracking-widest text-sm">MICRODRAMA <span className="text-[#d6ff63]">/ STUDIO</span></Link>
        <div className="max-w-lg"><div className="text-[10px] tracking-[.3em] text-[#d6ff63] mb-4">YOUR STORY FACTORY</div><h1 className="text-5xl font-semibold leading-tight tracking-[-.04em]">Las historias que enganchan empiezan aquí.</h1><p className="text-[#858b9a] mt-5 leading-relaxed">Tu espacio privado para desarrollar, producir y controlar cada estreno.</p></div>
        <div className="text-xs text-[#687080]">PRIVATE PRODUCTION WORKSPACE · OWNER ACCESS</div>
      </section>
      <section className="flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="lg:hidden font-bold tracking-widest text-sm mb-12">MICRODRAMA <span className="text-[#d6ff63]">/ STUDIO</span></div>
          <div className="text-[10px] tracking-[.25em] text-[#d6ff63] mb-3">OWNER ACCESS</div>
          <h2 className="text-3xl font-semibold tracking-tight">Entrar al estudio</h2>
          <p className="text-sm text-[#858b9a] mt-2">Acceso privado para el equipo de producción.</p>
          {params.sent && <div className="mt-5 rounded-xl border border-[#d6ff63]/30 bg-[#d6ff63]/[.07] p-3 text-xs text-[#d6ff63]">Cuenta creada. Si la confirmación por correo está activada, revisa tu bandeja de entrada.</div>}
          {error && <div role="alert" className="mt-5 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300">{messages[error] ?? "Ha ocurrido un error."}</div>}
          <form action={signIn} className="mt-8 space-y-4">
            <label className="block text-xs text-[#aeb4c0]">Correo electrónico<input name="email" type="email" required autoComplete="email" className="mt-2 w-full rounded-xl bg-[#11141c] border border-[#303644] px-4 py-3 text-sm outline-none focus:border-[#d6ff63]" placeholder="tu@correo.com"/></label>
            <label className="block text-xs text-[#aeb4c0]">Contraseña<input name="password" type="password" required autoComplete="current-password" className="mt-2 w-full rounded-xl bg-[#11141c] border border-[#303644] px-4 py-3 text-sm outline-none focus:border-[#d6ff63]" placeholder="••••••••••"/></label>
            <button className="w-full rounded-xl bg-[#d6ff63] text-[#11150a] font-bold py-3 text-sm">Iniciar sesión</button>
          </form>
          <p className="text-[10px] text-[#687080] mt-8">El acceso se habilita desde la consola privada de Supabase. No existe registro público en este estudio.</p>
        </div>
      </section>
    </main>
  );
}
