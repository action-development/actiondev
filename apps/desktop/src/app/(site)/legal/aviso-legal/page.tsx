import type { Metadata } from "next";
import Link from "next/link";
import { LegalDocHeader } from "@/components/legal/LegalDocHeader";
import { LegalEntityCard } from "@/components/legal/LegalEntityCard";
import {
  BUSINESS,
  LEGAL_ENTITY,
  OG_IMAGE,
  REGISTERED_ADDRESS_LINE,
  SITE_URL,
  absoluteUrl,
} from "@/lib/seo";

/**
 * Aviso legal (art. 10 Ley 34/2002 LSSI-CE).
 *
 * Documento raíz de titularidad: identifica a Alcasi Systems, S.L. como
 * persona jurídica detrás de la marca Action Development. Los otros tres
 * documentos legales enlazan aquí para los datos identificativos.
 */

export const metadata: Metadata = {
  title: "Aviso legal",
  description:
    "Aviso legal de actiondev.es. Action Development es una marca comercial de Alcasi Systems, S.L. (CIF B72910664), inscrita en el Registro Mercantil de Pontevedra.",
  alternates: { canonical: "/legal/aviso-legal" },
  openGraph: {
    type: "website",
    locale: "es_ES",
    url: absoluteUrl("/legal/aviso-legal"),
    siteName: BUSINESS.name,
    title: "Aviso legal — Action",
    description:
      "Datos identificativos del titular de actiondev.es: Alcasi Systems, S.L., CIF B72910664.",
    images: [{ url: OG_IMAGE.url, width: OG_IMAGE.width, height: OG_IMAGE.height }],
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebPage",
      "@id": absoluteUrl("/legal/aviso-legal"),
      url: absoluteUrl("/legal/aviso-legal"),
      name: "Aviso legal — Action",
      inLanguage: "es",
      isPartOf: { "@id": absoluteUrl("#website") },
      about: { "@id": absoluteUrl("#organization") },
    },
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Inicio", item: absoluteUrl("/") },
        {
          "@type": "ListItem",
          position: 2,
          name: "Aviso legal",
          item: absoluteUrl("/legal/aviso-legal"),
        },
      ],
    },
  ],
};

export default function AvisoLegalPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <LegalDocHeader
        eyebrow="Legal · LSSI-CE"
        title="Aviso legal"
        lede={`${BUSINESS.alternateName} es una marca comercial titularidad de ${LEGAL_ENTITY.name}. Aquí están los datos identificativos completos, verificables contra el Registro Mercantil de Pontevedra.`}
      />

      <div className="legal-prose">
        <h2>1. Titular del sitio web</h2>
        <p>
          En cumplimiento del artículo 10 de la Ley 34/2002, de 11 de julio, de
          Servicios de la Sociedad de la Información y de Comercio Electrónico
          (LSSI-CE), se ponen a disposición del usuario los siguientes datos
          identificativos del titular de {SITE_URL}:
        </p>
      </div>

      <LegalEntityCard />

      <div className="legal-prose">
        <h2>2. Marca comercial y persona jurídica</h2>
        <p>
          <strong>
            «Action», «Action Development» y actiondev.es son nombres
            comerciales y signos distintivos bajo los que opera{" "}
            {LEGAL_ENTITY.name}.
          </strong>{" "}
          No constituyen una persona jurídica independiente. Toda relación
          contractual, oferta, factura, garantía y responsabilidad derivada de
          los servicios prestados a través de este sitio web corresponde a{" "}
          {LEGAL_ENTITY.name}, con CIF {LEGAL_ENTITY.taxId} y domicilio social
          en {REGISTERED_ADDRESS_LINE}.
        </p>
        <p>
          Cualquier documento contractual, propuesta económica, contrato o
          factura emitido bajo la marca {BUSINESS.alternateName} se emite a
          nombre de {LEGAL_ENTITY.name} y con su CIF.
        </p>

        <h2>3. Domicilio social y oficina</h2>
        <p>
          El <strong>domicilio social</strong> inscrito en el Registro Mercantil
          es {REGISTERED_ADDRESS_LINE}. Es la dirección válida a efectos de
          notificaciones fehacientes, requerimientos y comunicaciones
          administrativas.
        </p>
        <p>
          La <strong>oficina y centro de trabajo</strong> desde el que se presta
          el servicio está en {BUSINESS.address.street},{" "}
          {BUSINESS.address.postalCode} {BUSINESS.address.locality} (
          {BUSINESS.address.region}). Es la dirección que figura en la ficha de
          Google Business Profile y la dirección de visita habitual.
        </p>
        <p>
          Ambas direcciones pertenecen a la misma persona jurídica. La
          discrepancia entre domicilio social y centro de trabajo es habitual y
          no implica la existencia de dos entidades distintas.
        </p>

        <h2>4. Objeto y condiciones de uso</h2>
        <p>
          Este sitio web tiene por objeto informar sobre los servicios de
          desarrollo de software, desarrollo web, diseño de interfaces y
          experiencias digitales prestados por {LEGAL_ENTITY.name} bajo la marca{" "}
          {BUSINESS.alternateName}, y facilitar el contacto comercial.
        </p>
        <p>
          El acceso al sitio es gratuito y no requiere registro. El usuario se
          compromete a hacer un uso lícito del sitio y a no emplearlo para fines
          ilícitos, lesivos de derechos de terceros o que puedan dañar,
          inutilizar o sobrecargar el sitio o impedir su normal utilización.
        </p>

        <h2>5. Propiedad intelectual e industrial</h2>
        <p>
          Los contenidos de este sitio (textos, código fuente, diseño gráfico,
          modelos tridimensionales, animaciones, imágenes, logotipos y signos
          distintivos) son titularidad de {LEGAL_ENTITY.name} o se utilizan bajo
          licencia, y están protegidos por la normativa de propiedad intelectual
          e industrial.
        </p>
        <p>
          Los proyectos de clientes mostrados en la sección de trabajos se
          publican con su autorización. Las marcas y logotipos de terceros que
          aparezcan pertenecen a sus respectivos titulares.
        </p>
        <p>
          Queda prohibida la reproducción, distribución, comunicación pública o
          transformación de los contenidos sin autorización expresa y por
          escrito del titular.
        </p>

        <h2>6. Exclusión de responsabilidad</h2>
        <p>
          {LEGAL_ENTITY.name} no se responsabiliza de los daños derivados de
          interrupciones, virus o fallos ajenos a su control, ni del contenido
          de sitios de terceros enlazados desde este sitio. Los enlaces externos
          se ofrecen únicamente a título informativo.
        </p>
        <p>
          La información publicada sobre servicios y proyectos tiene carácter
          orientativo y no constituye oferta contractual vinculante. Las
          condiciones concretas de cada encargo se fijan en la propuesta
          económica y el contrato correspondiente.
        </p>

        <h2>7. Legislación aplicable y jurisdicción</h2>
        <p>
          Las presentes condiciones se rigen por la legislación española. Para
          la resolución de cualquier controversia, las partes se someten a los
          Juzgados y Tribunales de Pontevedra, salvo que la normativa aplicable
          en materia de consumidores o de contratación con el sector público
          establezca un fuero distinto de carácter imperativo.
        </p>

        <h2>8. Documentos relacionados</h2>
        <ul>
          <li>
            <Link href="/legal/privacy">Política de privacidad</Link> — qué
            datos personales tratamos y con qué base legal.
          </li>
          <li>
            <Link href="/legal/terms">Términos y condiciones</Link> — condiciones
            de contratación de servicios.
          </li>
          <li>
            <Link href="/legal/cookies">Política de cookies</Link> — qué cookies
            usa este sitio.
          </li>
        </ul>
      </div>
    </>
  );
}
