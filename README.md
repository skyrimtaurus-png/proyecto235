# Invitacion nupcial temporal

Sitio estatico listo para publicar en Firebase Hosting.

## Archivos principales

- `index.html`: estructura de la invitacion
- `styles.css`: diseno, fondo, sobre y animaciones
- `script.js`: apertura del sobre, mariposas, petalos y melodia ambiental
- `firebase.json`: configuracion basica de hosting

## Publicar en Firebase Hosting

1. Instala Firebase CLI:

   ```bash
   npm install -g firebase-tools
   ```

2. Inicia sesion:

   ```bash
   firebase login
   ```

3. Crea un proyecto en Firebase Console o usa uno existente.

4. Vincula este directorio al proyecto:

   ```bash
   firebase use --add
   ```

5. Publica la pagina:

   ```bash
   firebase deploy --only hosting
   ```

Firebase devolvera un enlace gratuito tipo:

```text
https://tu-proyecto.web.app
```

## Personalizaciones rapidas

- Cambia el texto del lugar en `index.html` cuando lo definan.
- Si luego quieres musica real en vez de la melodia generada, agrega un archivo `.mp3` y reemplaza la logica de audio en `script.js`.