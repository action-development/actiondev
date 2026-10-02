# Tareas SEO fuera de la web — Action Development

Lo que hay que hacer **fuera del código** para que la web se vea en Google, Bing y los buscadores de IA. Por orden de impacto. Contexto y datos en `docs/seo-auditoria-2026-10.md`; plantillas y textos en `docs/seo-kit-offpage.md`.

Datos que hay que copiar **siempre igual** en todos los sitios (§1 del kit):

```
Action Development · Rúa Colón, 20, 36201 Vigo, Pontevedra · +34 614 02 74 10 · https://actiondev.es
```

---

## Hoy (≈1 hora)

### 1. Google Search Console (20 min)

Es lo más importante: sin esto no sabemos qué tiene indexado Google ni por qué búsquedas aparecemos.

- [ ] Entrar en https://search.google.com/search-console, pulsar **Añadir propiedad → Dominio** y escribir `actiondev.es`.
- [ ] Copiar el registro TXT que da, añadirlo en el DNS (donde esté gestionado el dominio) y pulsar **Verificar**.
- [ ] En **Sitemaps**, enviar `sitemap.xml`.
- [ ] En **Inspección de URLs**, pegar una a una estas cuatro y pulsar **Solicitar indexación**:
  - `https://actiondev.es/`
  - `https://actiondev.es/desarrollo-de-aplicaciones-vigo`
  - `https://actiondev.es/desarrollo-de-aplicaciones-pontevedra`
  - `https://actiondev.es/servicios`

### 2. Bing Webmaster Tools (5 min)

Bing alimenta ChatGPT y Copilot.

- [ ] Entrar en https://www.bing.com/webmasters y elegir **Importar desde Google Search Console**. Así no hay que verificar nada más.

### 3. Ficha de Google (20 min)

En https://business.google.com:

- [ ] **Horario:** comprobarlo. En Mejores de Vigo aparece "solo jueves 10–14", y probablemente lo copian de aquí.
- [ ] **Categorías:** principal, "Empresa de software". Secundarias: la de desarrollo de aplicaciones y "Diseñador de sitios web".
- [ ] **Servicios:** pegar los textos de la tabla §2.2 de `docs/seo-kit-offpage.md`.
- [ ] **Fotos:** subir al menos 10 propias (oficina, portal, equipo, pantallas con proyectos).

### 4. Bing Places (5 min)

- [ ] En https://www.bing.com/forbusiness, importar la ficha desde Google.

### 5. Repo privado (1 min)

- [ ] En GitHub, `action-development/actiondev`: **Settings → Danger zone → Change visibility → Private**.

> Tiene que hacerlo un propietario de la organización `action-development`: la cuenta `rubendlt` solo tiene permiso de escritura y no puede cambiar la visibilidad.

---

## Esta semana

### 6. Reseñas

- [ ] Escribir a los últimos 5 clientes con el enlace directo `https://g.page/r/CeTTw-Rv4wz8EBM/review`. La última reseña visible es de hace unos 4 meses.
- Pedirles que mencionen qué les hicimos y dónde ("nos hicieron la app…", "en Vigo"). Hay plantillas en el §3 del kit.
- No ofrecer regalos ni pedir solo a los contentos: eso puede suspender la ficha.

### 7. Directorios

- [ ] **Mejores de Vigo:** entrar en https://mejoresdevigo.es/b/action-development/ y pulsar **Reclamar ahora** (es gratis). Cambiar la categoría a apps, software y desarrollo web, y corregir el horario y la descripción. Su lista de apps tiene una sola empresa, así que con 23 reseñas entraríamos arriba.
- [ ] **Páxinas Galegas:** pedir que nos añadan a la categoría "Diseño y desarrollo de software y aplicaciones" de Vigo (es la primera de Bing en dos búsquedas clave) y que cambien el enlace a `https://actiondev.es`, sin `www`.
- [ ] **Sortlist:** crear el perfil en https://www.sortlist.es/providers con 4-6 proyectos. Su página de apps en Vigo es la primera en Bing para 4 búsquedas de apps.
- [ ] **Apple Maps:** en https://business.apple.com, reclamar la ficha, que ya existe.

### 8. LinkedIn

- [ ] Poner como año de fundación 2020 (ahora pone 2023), la dirección de Rúa Colón y la misma descripción que en la ficha de Google.

---

## Este mes

### 9. Clientes con web (13)

- [ ] Pedirles un crédito en el pie, "Web: Action Development", enlazado a `https://actiondev.es`. Ahora mismo ninguno nos enlaza.
- Empezar por París de Noia, que ya nos menciona sin enlace, y por Musa.

### 10. Gestoría

- [ ] En los registros mercantiles (Empresite, eInforma), Alcasi Systems aparece como instaladora eléctrica (CNAE 4321). Revisar con la gestoría la actividad de programación.
- [ ] Después, reclamar la ficha en Empresite y eInforma y añadir la web y el nombre comercial.
