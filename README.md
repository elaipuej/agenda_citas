# Agenda de contactos

Aplicación web estática para gestionar contactos desde GitHub Pages.

## Archivos

- `index.html` — estructura de la aplicación.
- `style.css` — diseño responsive.
- `script.js` — lógica, almacenamiento y gestión de contactos.

## Funciones

- Crear contactos.
- Editar contactos.
- Eliminar contactos.
- Marcar como "Realizada" o "Pendiente".
- Buscar contactos.
- Filtrar por estado.
- Contadores de total, pendientes y realizadas.
- Guardado automático mediante `localStorage`.
- Exportar contactos a JSON.
- Importar contactos desde JSON.

## Publicar en GitHub Pages

1. Crea un repositorio en GitHub.
2. Sube `index.html`, `style.css` y `script.js` a la raíz del repositorio.
3. En GitHub entra en **Settings → Pages**.
4. En **Build and deployment**, selecciona:
   - Source: `Deploy from a branch`
   - Branch: `main`
   - Folder: `/ (root)`
5. Guarda la configuración.
6. GitHub te mostrará la URL de tu página.

## Importante sobre los datos

Esta versión no utiliza una base de datos. Los contactos se guardan con `localStorage`, por lo que permanecen en el navegador/dispositivo donde se introducen.

Si borras los datos del navegador o cambias de dispositivo, esos contactos no aparecerán automáticamente. Utiliza **Exportar** para guardar una copia y **Importar** para recuperarla.

Si necesitas que varias personas puedan acceder y modificar los mismos contactos desde distintos dispositivos, habría que añadir un backend/base de datos y autenticación.
