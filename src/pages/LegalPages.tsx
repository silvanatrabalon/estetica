import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

const BUSINESS_NAME = 'Estetica So Beauty'
const LAST_UPDATED = '20 de noviembre de 2026'

interface LegalLayoutProps {
  title: string
  children: ReactNode
}

function LegalLayout({ title, children }: LegalLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50 px-4 py-10">
      <article className="mx-auto max-w-2xl rounded-lg border border-gray-200 bg-white p-6 shadow-sm sm:p-10">
        <Link to="/" className="text-sm text-gray-500 hover:text-gray-800">
          ← Volver al inicio
        </Link>
        <h1 className="mt-4 text-2xl font-semibold text-gray-900">{title}</h1>
        <p className="mt-1 text-xs text-gray-400">Última actualización: {LAST_UPDATED}</p>
        <div className="mt-6 space-y-4 text-sm leading-relaxed text-gray-700">{children}</div>
      </article>
    </div>
  )
}

export function PrivacyPage() {
  return (
    <LegalLayout title="Política de privacidad">
      <p>
        En {BUSINESS_NAME} cuidamos tus datos. Esta página explica qué información recopilamos al
        usar el sistema de turnos y para qué la usamos.
      </p>
      <h2 className="font-semibold text-gray-900">Qué datos recopilamos</h2>
      <p>
        Al iniciar sesión con Google recibimos tu nombre, tu dirección de correo electrónico y tu
        foto de perfil. Si los completás, también guardamos tu teléfono y los datos de tus turnos
        (servicio, profesional, fecha y hora).
      </p>
      <h2 className="font-semibold text-gray-900">Para qué los usamos</h2>
      <p>
        Usamos tus datos únicamente para identificarte, gestionar tus turnos y comunicarnos con vos
        sobre ellos. No vendemos ni compartimos tu información con terceros para publicidad.
      </p>
      <h2 className="font-semibold text-gray-900">Dónde se almacenan</h2>
      <p>
        Los datos se guardan en servicios de infraestructura de terceros (Supabase para la base de
        datos y autenticación, y Vercel para el alojamiento del sitio).
      </p>
      <h2 className="font-semibold text-gray-900">Tus derechos</h2>
      <p>
        Podés pedir en cualquier momento que accedamos, corrijamos o eliminemos tus datos
        contactándote con el negocio por los medios que figuran en el sitio.
      </p>
    </LegalLayout>
  )
}

export function TermsPage() {
  return (
    <LegalLayout title="Condiciones del servicio">
      <p>
        Al usar el sistema de turnos de {BUSINESS_NAME} aceptás estas condiciones. Si no estás de
        acuerdo, no uses el servicio.
      </p>
      <h2 className="font-semibold text-gray-900">Uso del servicio</h2>
      <p>
        El sistema te permite reservar, reprogramar y cancelar turnos. Te comprometés a brindar
        información veraz y a usar el servicio de buena fe.
      </p>
      <h2 className="font-semibold text-gray-900">Turnos y cancelaciones</h2>
      <p>
        Los turnos están sujetos a la disponibilidad del negocio. Podés reprogramar o cancelar tu
        turno con la anticipación que el negocio indique. El negocio puede cancelar o reprogramar un
        turno por causas de fuerza mayor y te avisará.
      </p>
      <h2 className="font-semibold text-gray-900">Responsabilidad</h2>
      <p>
        Hacemos lo posible por mantener el servicio disponible, pero no garantizamos que funcione sin
        interrupciones ni errores.
      </p>
      <h2 className="font-semibold text-gray-900">Cambios</h2>
      <p>
        Podemos actualizar estas condiciones. La fecha de la última actualización figura al inicio de
        esta página.
      </p>
    </LegalLayout>
  )
}
