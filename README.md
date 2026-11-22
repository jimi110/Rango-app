# Rango

Tu entrenador de bolsillo: te dice qué entrenar cada día, te guía serie a serie y te sube de rango (Bronce → Diamante) en cada ejercicio.

## Publicar en GitHub Pages
1. Sube **todos los archivos a la raíz** del repositorio (sin carpetas).
2. Settings → Pages → *Deploy from a branch* → rama `main`, carpeta `/ (root)`.
3. Abre la URL y, en el móvil, «Añadir a pantalla de inicio».

## Archivos
- `index.html` · estructura
- `style.css` · diseño
- `exercises.js` · catálogo de 34 ejercicios, rangos, sesiones, programas y escenas
- `guide.js` · técnica de cada ejercicio, tutorial de bienvenida y preguntas frecuentes
- `rig.js` · motor de las animaciones de los ejercicios
- `sounds.js` · sonidos (generados por código, sin archivos de audio)
- `core.js` · estado, rangos, logros, rachas y utilidades
- `workout.js` · planificador de sesiones y modo entrenamiento
- `app.js` · pantallas, ajustes, herramientas y navegación
- `sw.js` + `manifest.webmanifest` · instalable y funciona sin conexión
- `icon.svg`, `icon-192.png`, `icon-512.png`, `apple-touch-icon.png` · iconos

## Al actualizar
Si cambias algún archivo, sube el número de `VERSION` en `sw.js` (por ejemplo `rango-v4`) para que los móviles recojan la versión nueva.
