# Aníbal — Portafolio

Sitio estático de portafolio: diseño publicitario, ecommerce, desarrollo web y SEO/SEM.
Sin build step ni dependencias — HTML, CSS y JS puros. Listo para GitHub + Vercel.

## Estructura

```
anibal-portfolio/
├── index.html          Markup de todas las secciones
├── css/styles.css      Estilos (paleta, layout, animaciones)
├── js/main.js          Motor de scroll (parallax, showcase, galería, tilt)
├── assets/             Tus imágenes / artes reales
├── vercel.json         Config opcional de Vercel (caché, headers, clean URLs)
├── README.md
└── .gitignore
```

## Correr en local (VS Code)

No necesitas servidor de build. La forma más simple:

1. Instala la extensión **Live Server** (Ritwick Dey) en VS Code.
2. Clic derecho sobre `index.html` → **Open with Live Server**.
3. Se abre en `http://127.0.0.1:5500` con recarga automática al guardar.

> Abrir el `index.html` con doble clic (protocolo `file://`) también funciona,
> pero Live Server evita problemas con rutas y da hot-reload.

## Reemplazar los placeholders por tus artes reales

Las creatividades del showcase y de la galería son placeholders hechos con CSS
(`.art1`…`.art5`). Para poner tu trabajo real:

1. Copia tus imágenes a `assets/` (ej. `assets/pieza-01.jpg`).
2. En `index.html`, dentro de `#sc-stage`, cambia el bloque de placeholder:

   ```html
   <!-- ANTES -->
   <div class="art art1"><span class="kick">Nueva colección</span><span class="big">Ritual<br>de piel</span></div>

   <!-- DESPUÉS -->
   <img src="assets/pieza-01.jpg" alt="Campaña skincare"
        style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover">
   ```

3. Mantén el `<figure class="piece" data-cap="...">` que lo envuelve: el
   `data-cap` es el texto que aparece abajo cuando la pieza está activa.
4. Lo mismo aplica para las `.hcard` de la galería horizontal.

Recomendado: imágenes verticales ~3:4 (showcase) y ~4:5 (galería), optimizadas
(WebP/JPG < 300 KB) para que el scroll siga fluido.

## Pendientes por completar (busca y reemplaza)

- **⚠️ Métricas de Paid Media:** los números de la sección "Paid Media" y de los
  modales (ROAS, inversión, CTR, etc.) son **de ejemplo**. Reemplázalos por tus
  cifras reales antes de mostrar el sitio — están marcados con `⚠️` en `index.html`.
- **Carrusel "Marcas & sitios":** cada mini-home es un placeholder CSS. Cambia
  `.site-preview` por un `<img>` con un screenshot real, y ajusta el `href` y el
  texto de `.url` a cada dominio.
- `hola@tudominio.com` → tu email real (aparece 2 veces).
- Enlaces `href="#"` de **LinkedIn** y **CV / Resume** en la sección de contacto.
- Apellido en el logo (`<a class="brand">Aníbal…`) si quieres nombre completo.

## Desplegar en Vercel

1. Sube el repo a GitHub.
2. En Vercel: **New Project** → importa el repo.
3. Framework Preset: **Other** (es estático, sin build).
   - Build Command: *(vacío)*
   - Output Directory: *(vacío / raíz)*
4. Deploy. Cada push a `main` redepliega solo.
5. Dominio propio: **Settings → Domains** (igual que hiciste con ZØLAN).

> **`vercel.json` es opcional.** El sitio despliega sin él. Se incluye solo para
> mejorar la caché de `assets/`, `css/` y `js/`, agregar headers de seguridad y
> activar clean URLs. Si no lo quieres, puedes borrarlo sin afectar el deploy.

## Accesibilidad y rendimiento

- Respeta `prefers-reduced-motion`: sin animaciones, todo se ve como grilla estática.
- Sin JS también funciona (contenido visible, layout en grilla).
- Transforms GPU-friendly + `requestAnimationFrame` para scroll fluido.
