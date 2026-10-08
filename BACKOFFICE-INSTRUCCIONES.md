# Activar Backoffice en tsds.cl

Este paquete agrega /backoffice al proyecto existente. No está publicado todavía.

## 1. Copiar los archivos

Descomprime el ZIP y copia su contenido dentro de la carpeta local `tsds-soporte` que ya usas con GitHub (donde está package.json). Combina las carpetas `app` y `lib`; no elimines las que ya existen.

## 2. Crear la tabla

En el proyecto Supabase que utiliza tsds.cl:

1. Abre **SQL Editor** y elige **New query**.
2. Copia todo el contenido de `supabase/backoffice.sql`.
3. Pulsa **Run**.

La tabla mantiene los registros compartidos entre todos los equipos. No permite consultar ni modificar los datos con la clave pública de Supabase.

## 3. Configurar Vercel

En el proyecto de tsds.cl abre **Settings → Environment Variables**. Agrega:

- `BACKOFFICE_CODIGO`: el código compartido acordado. Configúralo únicamente en Vercel.
- `BACKOFFICE_SESSION_SECRET`: una cadena aleatoria de al menos 32 caracteres. Puedes generarla en PowerShell con:

```powershell
$bytesBackoffice = New-Object byte[] 32
$rngBackoffice = [System.Security.Cryptography.RandomNumberGenerator]::Create()
$rngBackoffice.GetBytes($bytesBackoffice)
[Convert]::ToBase64String($bytesBackoffice)
$rngBackoffice.Dispose()
```

Copia el resultado en el valor de BACKOFFICE_SESSION_SECRET. No lo pegues en código ni en GitHub.

Verifica que ya existan `NEXT_PUBLIC_SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` del mismo proyecto Supabase. La segunda es una clave privada del servidor; no debe llevar el prefijo NEXT_PUBLIC ni compartirse con el navegador. Puedes encontrarla en la configuración de claves API de tu proyecto Supabase.

Configura las variables para Production (y Preview si deseas probar allí). Es necesario un nuevo despliegue después de guardarlas.

## 4. Subir los cambios

En PowerShell, desde la carpeta de tu repositorio:

```powershell
git add package-lock.json app/backoffice app/api/backoffice lib/backoffice-auth.ts lib/backoffice-vendedores.ts supabase/backoffice.sql BACKOFFICE-INSTRUCCIONES.md
git commit -m "Agregar modulo Backoffice"
git push origin main
```

Vercel publicará los cambios si el repositorio está conectado como actualmente. Cuando termine, abre https://tsds.cl/backoffice.

## 5. Comprobar

- Código incorrecto: no permite acceder.
- Código acordado: permite acceder.
- Escribir un vendedor y seleccionar una coincidencia: completa su zona.
- Guardar un cliente: aparece en el día actual de Chile y en otro equipo al actualizar.
- Editar: conserva la fecha original.
- Eliminar: pide confirmación.
- Consultar otra fecha: muestra sus registros.
- Cerrar sesión: bloquea el acceso al módulo y a sus datos.

La sesión dura 12 horas. La fecha de cada nuevo registro la asigna el servidor al guardar, en America/Santiago. El listado se actualiza cada 30 segundos. El nombre de backoffice se conserva en el formulario entre ingresos durante esa sesión de pantalla.

No se importan los registros históricos de la planilla ni se añade un enlace público en la portada.

El paquete incluye package-lock.json sincronizado: el ZIP original declaraba @vercel/analytics pero no lo incluía en el archivo de bloqueo.

## Validación realizada

Compilación de producción y revisión TypeScript completas con valores ficticios de Supabase; ESLint del módulo sin errores. Comprobados acceso incorrecto/correcto, cookie protegida, rechazo de origen externo, bloqueo sin sesión, fecha inválida, vendedor desconocido y cierre de sesión. El guardado, edición y eliminación contra la base real se deben comprobar tras ejecutar el SQL y configurar las variables.
