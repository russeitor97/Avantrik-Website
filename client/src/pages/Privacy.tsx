/**
 * Aviso de privacidad.
 *
 * El contenido describe lo que el sitio realmente hace (formulario de
 * contacto y de la calculadora vía EmailJS, portal interno con sesión en
 * localStorage, sin cookies de analítica). Si se agrega analítica, rastreo o
 * un nuevo formulario, hay que actualizar las secciones 2, 5 y 6.
 */
import { Layout } from "@/components/layout/Layout";
import { Seo } from "@/components/Seo";
import { TechBackdrop } from "@/components/ui/tech-backdrop";
import { useCopy } from "@/lib/i18n";

const COMPANY = "AVANTRIK S.A. de C.V.";
const CONTACT_EMAIL = "info@avantrik.com";
const UPDATED_ISO = "2026-07-28";

interface Section {
  heading: string;
  paragraphs?: string[];
  list?: string[];
}

interface Copy {
  title: string;
  description: string;
  h1: string;
  intro: string;
  updatedLabel: string;
  updated: string;
  sections: Section[];
}

const T: Record<"es" | "en", Copy> = {
  es: {
    title: "Aviso de Privacidad | Avantrik",
    description:
      "Aviso de privacidad de Avantrik: qué datos personales recabamos a través del sitio, para qué los usamos y cómo ejercer tus derechos ARCO.",
    h1: "Aviso de Privacidad",
    intro: `${COMPANY} ("Avantrik") es responsable del tratamiento de los datos personales que nos proporcionas a través de este sitio web. Este aviso explica qué datos recabamos, para qué los usamos y cómo puedes controlarlos.`,
    updatedLabel: "Última actualización:",
    updated: "28 de julio de 2026",
    sections: [
      {
        heading: "1. Quién es el responsable",
        paragraphs: [
          `${COMPANY}, con domicilio en Querétaro, Querétaro, México, es la responsable de recabar tus datos personales, del uso que se les dé y de su protección.`,
          `Para cualquier asunto relacionado con este aviso puedes escribirnos a ${CONTACT_EMAIL}.`,
        ],
      },
      {
        heading: "2. Qué datos recabamos",
        paragraphs: [
          "Únicamente recabamos los datos que tú nos proporcionas de forma voluntaria al llenar alguno de los formularios del sitio:",
        ],
        list: [
          "Formulario de contacto: nombre, empresa, correo electrónico, teléfono, servicio de interés y el mensaje que escribas.",
          "Calculadora de ahorro: nombre, empresa, correo electrónico, teléfono y ciudad, junto con los datos técnicos de tu instalación que hayas capturado (consumo eléctrico, capacidad de enfriamiento, horarios de operación y similares).",
        ],
      },
      {
        heading: "3. Para qué usamos tus datos",
        paragraphs: ["Usamos tus datos para las siguientes finalidades necesarias:"],
        list: [
          "Responder tu solicitud de información, cotización o diagnóstico.",
          "Elaborar y enviarte la estimación de ahorro o la propuesta técnica que solicitaste.",
          "Contactarte por correo o teléfono para dar seguimiento a esa solicitud.",
          "Llevar el registro interno de la relación comercial.",
        ],
      },
      {
        heading: "4. No recabamos datos sensibles",
        paragraphs: [
          "No solicitamos ni tratamos datos personales sensibles (aquellos que puedan revelar origen racial o étnico, estado de salud, creencias religiosas, opiniones políticas, preferencia sexual o similares). Tampoco recabamos datos financieros ni patrimoniales a través de este sitio: no procesamos pagos en línea.",
        ],
      },
      {
        heading: "5. Con quién se comparten",
        paragraphs: [
          "No vendemos, rentamos ni compartimos tus datos personales con terceros para fines comerciales o publicitarios.",
          "Para operar el sitio nos apoyamos en proveedores de servicio que actúan como encargados y únicamente procesan los datos por nuestra instrucción:",
        ],
        list: [
          "EmailJS: entrega a nuestro correo los mensajes enviados desde los formularios. Sus servidores están fuera de México.",
          "Netlify: alojamiento del sitio web. Sus servidores están fuera de México.",
        ],
      },
      {
        heading: "6. Cookies y tecnologías de rastreo",
        paragraphs: [
          "Este sitio no utiliza cookies publicitarias, de analítica ni de rastreo. No usamos Google Analytics ni píxeles de redes sociales, y no elaboramos perfiles de navegación.",
          "El portal interno de Avantrik, de acceso exclusivo para nuestro personal mediante contraseña, guarda la sesión iniciada en el almacenamiento local del navegador del propio equipo. Esto no aplica a los visitantes del sitio público.",
        ],
      },
      {
        heading: "7. Tus derechos ARCO",
        paragraphs: [
          "Tienes derecho a conocer qué datos personales tenemos sobre ti y para qué los usamos (Acceso), a pedir que se corrijan si son inexactos (Rectificación), a solicitar que los eliminemos de nuestros registros (Cancelación) y a oponerte a que los usemos para fines específicos (Oposición).",
          `Para ejercer cualquiera de estos derechos envía un correo a ${CONTACT_EMAIL} indicando tu nombre, un medio para contactarte, la descripción clara de lo que solicitas y los documentos que acrediten tu identidad. Te responderemos al mismo correo desde el que nos escribas.`,
        ],
      },
      {
        heading: "8. Revocación del consentimiento",
        paragraphs: [
          `Puedes retirar en cualquier momento el consentimiento que nos otorgaste para tratar tus datos, escribiendo a ${CONTACT_EMAIL}. Ten en cuenta que en algunos casos no podremos atender la solicitud de inmediato si existe una obligación legal de conservar cierta información.`,
        ],
      },
      {
        heading: "9. Cambios a este aviso",
        paragraphs: [
          "Podemos actualizar este aviso de privacidad cuando cambien nuestros servicios, nuestras prácticas de tratamiento o la normativa aplicable. Cualquier modificación se publicará en esta misma página, indicando la fecha de la última actualización.",
        ],
      },
    ],
  },
  en: {
    title: "Privacy Notice | Avantrik",
    description:
      "Avantrik's privacy notice: what personal data we collect through the website, what we use it for, and how to exercise your data rights.",
    h1: "Privacy Notice",
    intro: `${COMPANY} ("Avantrik") is responsible for the personal data you provide through this website. This notice explains what data we collect, what we use it for, and how you can control it.`,
    updatedLabel: "Last updated:",
    updated: "July 28, 2026",
    sections: [
      {
        heading: "1. Who is responsible",
        paragraphs: [
          `${COMPANY}, located in Querétaro, Querétaro, Mexico, is responsible for collecting your personal data, for how it is used, and for its protection.`,
          `For anything related to this notice you can write to us at ${CONTACT_EMAIL}.`,
        ],
      },
      {
        heading: "2. What data we collect",
        paragraphs: [
          "We only collect the data you voluntarily provide when you fill out one of the forms on this site:",
        ],
        list: [
          "Contact form: name, company, email address, phone number, service of interest and the message you write.",
          "Savings calculator: name, company, email address, phone number and city, along with the technical data about your facility that you entered (electricity consumption, cooling capacity, operating hours and similar).",
        ],
      },
      {
        heading: "3. What we use your data for",
        paragraphs: ["We use your data for the following necessary purposes:"],
        list: [
          "Responding to your request for information, a quote or an assessment.",
          "Preparing and sending you the savings estimate or technical proposal you requested.",
          "Contacting you by email or phone to follow up on that request.",
          "Keeping an internal record of the business relationship.",
        ],
      },
      {
        heading: "4. We do not collect sensitive data",
        paragraphs: [
          "We do not request or process sensitive personal data (data that could reveal racial or ethnic origin, health status, religious beliefs, political opinions, sexual preference or similar). We also do not collect financial or asset data through this site: we do not process online payments.",
        ],
      },
      {
        heading: "5. Who we share it with",
        paragraphs: [
          "We do not sell, rent or share your personal data with third parties for commercial or advertising purposes.",
          "To operate the site we rely on service providers that act as processors and handle the data solely on our instruction:",
        ],
        list: [
          "EmailJS: delivers messages sent from the forms to our inbox. Its servers are located outside Mexico.",
          "Netlify: website hosting. Its servers are located outside Mexico.",
        ],
      },
      {
        heading: "6. Cookies and tracking technologies",
        paragraphs: [
          "This site does not use advertising, analytics or tracking cookies. We do not use Google Analytics or social media pixels, and we do not build browsing profiles.",
          "Avantrik's internal portal, accessible only to our staff with a password, stores the signed-in session in the local storage of that device's browser. This does not apply to visitors of the public website.",
        ],
      },
      {
        heading: "7. Your data rights",
        paragraphs: [
          "You have the right to know what personal data we hold about you and what we use it for (Access), to request corrections if it is inaccurate (Rectification), to ask us to delete it from our records (Cancellation), and to object to its use for specific purposes (Opposition) — the rights known in Mexico as ARCO.",
          `To exercise any of these rights, send an email to ${CONTACT_EMAIL} stating your name, a way to contact you, a clear description of your request, and documents proving your identity. We will reply to the same address you write from.`,
        ],
      },
      {
        heading: "8. Withdrawing your consent",
        paragraphs: [
          `You may withdraw the consent you gave us to process your data at any time by writing to ${CONTACT_EMAIL}. Please note that in some cases we may not be able to act on the request immediately if a legal obligation requires us to retain certain information.`,
        ],
      },
      {
        heading: "9. Changes to this notice",
        paragraphs: [
          "We may update this privacy notice when our services, our processing practices or the applicable regulations change. Any modification will be published on this same page, stating the date it was last updated.",
        ],
      },
    ],
  },
};

export default function Privacy() {
  const t = useCopy(T);

  return (
    <Layout>
      <Seo page="privacy" title={t.title} description={t.description} />

      <div className="relative flex min-h-[32vh] items-center overflow-hidden bg-ink-gradient py-16">
        <TechBackdrop />
        <div className="container relative z-10 mx-auto px-4 pt-24">
          <h1 className="mb-4 text-4xl font-heading font-bold text-white md:text-5xl">
            {t.h1}
          </h1>
          <p className="max-w-3xl text-lg text-gray-300">{t.intro}</p>
        </div>
      </div>

      <section className="container mx-auto px-4 py-16">
        <div className="mx-auto max-w-3xl">
          <p className="mb-10 text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">{t.updatedLabel}</span>{" "}
            <time dateTime={UPDATED_ISO}>{t.updated}</time>
          </p>

          <div className="space-y-10">
            {t.sections.map((section) => (
              <div key={section.heading}>
                <h2 className="mb-3 font-heading text-xl font-bold text-foreground">
                  {section.heading}
                </h2>

                {section.paragraphs?.map((p) => (
                  <p key={p.slice(0, 40)} className="mb-3 leading-relaxed text-muted-foreground">
                    {p}
                  </p>
                ))}

                {section.list && (
                  <ul className="mt-3 space-y-2">
                    {section.list.map((item) => (
                      <li
                        key={item.slice(0, 40)}
                        className="border-l-2 border-accent/40 pl-4 leading-relaxed text-muted-foreground"
                      >
                        {item}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>
    </Layout>
  );
}
