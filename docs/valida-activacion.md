# TSDS Valida — activación controlada

Estado: implementación en rama feature/tsds-valida; **no publicar en producción todavía**.

## Entorno Vercel (solo variables de servidor)
Configurar en el proyecto tsds-soporte, preferentemente en Preview primero:

- VALIDA_SUPABASE_URL: URL del proyecto Supabase tsds-ttcc
- VALIDA_SUPABASE_ANON_KEY: clave pública (no secret)
- VALIDA_SUPABASE_SERVICE_ROLE_KEY: clave secreta, **nunca** NEXT_PUBLIC ni commit en Git

No pegar valores de claves en tickets ni chats. La ruta de autenticación devolverá 503 hasta que estén configuradas.

## Acceso al esquema privado
El esquema `valida` está fuera del API REST expuesto por defecto. Los endpoints actuales que usan `db.schema("valida")` requieren una estrategia segura de acceso antes de funcionar: una interfaz de servidor/RPC cuidadosamente revisada, o exponer el esquema con permisos y políticas verificadas. **No exponer el esquema ni conceder permisos anon/authenticated sin una revisión de seguridad.** Esta tarea sigue pendiente.

## Primer administrador
Crear un usuario mediante Supabase Auth usando una invitación segura; una vez obtenido su UUID, asignarlo a `valida.staff` con rol `admin` desde un canal administrativo protegido. Nunca almacenar contraseñas en tablas propias ni enviarlas por correo en texto plano.

## Antes de habilitar el flujo comercial
1. Comprobar que la sesión y permisos de zona se aplican en servidor a cada endpoint.
2. Añadir refresh seguro de sesión, protección CSRF/origin y limitación de intentos de inicio de sesión.
3. Añadir CRUD de usuarios y zonas con auditoría.
4. Añadir registro de prospectos, snapshot de oferta y validación de RUT.
5. Añadir token de confirmación de un solo uso con hash, expiración y registro de evidencia; configurar Resend.
6. Probar en Preview, verificar compilación, políticas y errores.
7. Validar con DIRECTV y asesoría legal si la aceptación digital puede reemplazar la auditoría telefónica.

El prototipo de `/valida` no es para uso con datos reales hasta completar estos pasos.
