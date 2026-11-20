# Rango

App móvil para subir de rango en cada ejercicio (Bronce → Diamante). Registras tu mejor serie, ves tu rango y el objetivo para subir al siguiente nivel.

## Publicar en GitHub Pages
1. Sube **todos los archivos a la raíz** del repositorio (sin carpetas).
2. En el repo: Settings → Pages → *Deploy from a branch* → rama `main`, carpeta `/ (root)`.
3. Abre la URL que te da GitHub y, en el móvil, «Añadir a pantalla de inicio».

## Archivos
- `index.html` · estructura
- `style.css` · diseño
- `exercises.js` · ejercicios, rangos y animaciones de las figuras
- `app.js` · lógica (rangos, registro, progreso, ajustes)
- `sw.js` + `manifest.webmanifest` · instalable y funciona sin conexión
- `icon.svg`, `icon-192.png`, `icon-512.png`, `apple-touch-icon.png` · iconos

## Al actualizar
Si cambias algún archivo, sube el número de `VERSION` en `sw.js` (por ejemplo `rango-v2`) para que los móviles recojan la versión nueva.
