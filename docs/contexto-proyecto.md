# Contexto Completo Del Proyecto

Este documento sirve como handoff para cualquier persona que clone el repositorio y necesite continuar el desarrollo de Turnero sin depender del historial del chat.

## Que Es Turnero

Turnero es un SaaS multi-tenant para gestion de turnos orientado a profesionales y negocios de servicios. La funcionalidad central del producto es la reserva de turnos y toda decision de producto o tecnica debe priorizar esa experiencia.

Casos de uso principales:

- Un super admin administra tenants y puede entrar a asistirlos.
- Cada tenant administra su agenda, servicios, prestadores, cobros y pagina publica.
- El cliente final reserva turnos desde la web publica del tenant y consulta su perfil.

## Reglas De Trabajo Del Proyecto

- Hacer commit por cada cambio importante.
- Usar mensajes de commit en espanol.
- Mantener titulos, textos visibles, labels y mensajes de error en espanol.
- Revisar siempre el estado actual del codigo antes de modificar.
- Mantener foco en la reserva de turnos como funcionalidad principal.
- Cuando se haga push, verificar que el commit quedo en GitHub.

## Stack Y Arquitectura

- Next.js App Router
- TypeScript
- Prisma
- PostgreSQL local
- multi-tenant por slug y por host personalizado
- roles:
  - `SUPER_ADMIN`
  - `TENANT_ADMIN`
  - `STAFF`
  - `CUSTOMER`

## Estado Funcional Implementado

### 1. Base SaaS

- proyecto Next inicializado
- estructura base de app
- documentacion inicial
- modelo de tenant y relaciones principales

### 2. Multi-tenant

- resolucion por slug
- resolucion por host personalizado
- soporte para ejemplos como:
  - `/dentista`
  - dominio propio tipo `dentista.com`

### 3. Auth Y Roles

- login por roles
- sesiones persistidas en base de datos
- rutas separadas para admin, tenant y cliente final
- helpers de sesion en `lib/auth/session.ts`
- helper `canManageTenant(tenantSlug)` para limitar mutaciones sensibles a `TENANT_ADMIN` o `SUPER_ADMIN`

### 4. Reservas

- generacion real de slots desde disponibilidad
- reserva real de appointments
- perfil del cliente final leyendo turnos reales
- endurecimiento del endpoint de reservas en `app/api/appointments/route.ts`:
  - valida sesion `CUSTOMER` dentro del tenant
  - valida fecha no invalida y no pasada
  - valida pertenencia y estado del servicio
  - bloquea reservas si el tenant esta `SUSPENDED`
  - recalcula slots validos del lado servidor
  - rechaza horarios no publicados
  - usa transaccion serializable con reintentos `P2034`
  - sanea `redirectTo`

### 5. Servicios

- alta y edicion real de servicios
- activacion o desactivacion
- precio y duracion
- hasta 3 imagenes por servicio
- carga por URL o archivo
- persistencia de imagenes en `public/uploads/tenants/...`

### 6. Cobros

- integracion inicial de Mercado Pago Argentina por tenant
- cada tenant guarda sus propias credenciales
- credenciales encriptadas en `lib/payments/mercadopago.ts`
- la reserva puede derivar a Checkout Pro
- sincronizacion del pago al volver al perfil del cliente
- webhook implementado en `app/api/payments/mercadopago/webhook/route.ts`

Limitacion conocida:

- el webhook end-to-end real necesita URL publica
- el retorno del usuario desde Mercado Pago si se puede probar en local

### 7. Dashboard Del Tenant

Se transformo el panel del tenant en un dashboard operativo con foco en turnos:

- sidebar con modulos
- portada centrada en agenda y turnos
- calendario de turnos
- vista semanal y diaria
- busqueda por nombre, mail o telefono
- filtros por estado, servicio, pago y prestador
- seleccion de turno
- modal con detalle completo
- confirmacion rapida
- marcado como completado
- cancelacion
- reprogramacion
- notas administrativas
- historial del turno
- recordatorios automaticos visibles
- carga manual de turnos desde el tenant

### 8. Agenda Y Bloqueos

- bloqueos manuales por pausas, feriados o ausencias
- bloqueos visibles en la agenda
- los bloqueos afectan la disponibilidad publica

### 9. Prestadores Multiples Por Tenant

- soporte para varios prestadores por tenant
- modulo lateral `Prestadores`
- alta de prestadores
- turnos con prestador asignado
- filtro por prestador en el calendario
- asignacion de prestador al crear o editar turnos

Nota:

- el siguiente paso grande recomendado es disponibilidad por prestador, para que varios profesionales atiendan en paralelo sin compartir una sola agenda global.

### 10. Lenguaje Visible

- se esta migrando la interfaz desde la palabra `paciente` hacia `cliente`
- revisar nuevos cambios para sostener ese criterio

### 11. Diseño

Lineamientos actuales:

- interfaz clara y profesional
- sin gradients
- tipografias combinadas:
  - `Manrope` para lectura e interfaz
  - `Sora` para titulos y datos importantes
  - `Montserrat` para labels y acentos
- dashboard mas rico visualmente que al inicio, pero manteniendo limpieza
- responsive mejorado para celulares

## Estado Actual Del Dashboard Del Tenant

Modulos visibles desde la barra lateral:

- `Turnos`
- `Agenda`
- `Prestadores`
- `Servicios`
- `Cobros`
- `Personalizar pagina`

Comportamiento actual:

- en escritorio funciona como dashboard completo
- en movil la navegacion se vuelve compacta y el calendario se apila en una sola columna
- el branding lateral usa el logo configurado desde `Personalizar pagina`
- el encabezado principal del dashboard muestra solo el nombre del negocio

## Credenciales Demo

- super admin: `admin@turnero.com` / `Admin1234!`
- tenant admin demo: `admin@dentista.com` / `Dentista1234!`
- cliente demo: `maria@example.com` / `Paciente1234!`
- prestador demo: `martin@dentista.com` / `Prestador1234!`

## Entorno Local Usado En El Proyecto

### Node

Node esta instalado en:

`C:\Program Files\nodejs`

En PowerShell, en este entorno hubo que anteponer manualmente el `PATH`:

```powershell
$env:Path='C:\Program Files\nodejs;' + $env:Path
```

### PostgreSQL

- `psql.exe` localizado en:
  `C:\Program Files\PostgreSQL\18\bin\psql.exe`
- base local: `turnero`
- usuario: `postgres`
- contrasena usada en este entorno: `admin`
- puerto: `5432`

### Variables De Entorno

El `.env.example` trae una base minima:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/turnero?schema=public"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
AUTH_SECRET="change-this-secret-in-production"
```

Importante:

- En esta maquina local la contrasena real de PostgreSQL usada durante el desarrollo fue `admin`, no `postgres`.
- Verificar y ajustar `DATABASE_URL` segun la PC donde se clone el repo.
- Para Mercado Pago puede hacer falta definir credenciales o secretos adicionales segun el flujo que se quiera probar.

## Comandos Recomendados Para Levantar El Proyecto

```powershell
$env:Path='C:\Program Files\nodejs;' + $env:Path
npm install
npx prisma generate
npx prisma migrate dev
npm run prisma:seed
npm run dev
```

Build de validacion:

```powershell
$env:Path='C:\Program Files\nodejs;' + $env:Path
npm run build
```

## Nota Importante Sobre Prisma En Windows

Si `prisma generate` falla por bloqueo de `query_engine-windows.dll.node`:

1. cortar el servidor de Next o procesos Node del proyecto
2. correr `npx prisma generate`
3. volver a levantar `npm run dev`

Esto ya ocurrio durante la sesion y fue necesario reiniciar el servidor para recuperar el login.

## Migraciones Existentes

- `20260406203903_init`
- `20260406212226_agregar_constructor_sitio`
- `20260406235000_agregar_mercado_pago_por_tenant`
- `20260407003500_agregar_imagenes_y_edicion_servicios`
- `20260407020000_agregar_bloqueos_historial_y_recordatorios`
- `20260407032000_agregar_prestadores_por_tenant`

## Archivos Y Modulos Clave

### Paginas y shell principal

- `app/app/page.tsx`
- `components/tenant/tenant-dashboard-shell.tsx`

### Turnos y agenda

- `components/tenant/appointments-focus-panel.tsx`
- `components/tenant/tenant-agenda-panel.tsx`
- `app/api/appointments/route.ts`
- `app/api/appointments/manual/route.ts`
- `app/api/blocked-time-slots/route.ts`
- `lib/availability.ts`
- `lib/appointments.ts`

### Servicios y pagina publica

- `app/api/services/route.ts`
- `app/api/services/assets/route.ts`
- `components/tenant/service-editor-card.tsx`
- `components/tenant/public-home.tsx`
- `components/tenant/booking-page.tsx`
- `components/tenant/site-builder-form.tsx`

### Cobros

- `app/api/tenants/payment-settings/route.ts`
- `app/api/payments/mercadopago/webhook/route.ts`
- `components/tenant/payment-settings-form.tsx`
- `lib/payments/mercadopago.ts`

### Multi-tenant y datos

- `lib/auth/session.ts`
- `lib/data/tenants.ts`
- `lib/types.ts`
- `lib/mock-data.ts`

### Prisma

- `prisma/schema.prisma`
- `prisma/seed.ts`

## Modelado Importante Agregado

### Tenant

Campos relevantes agregados:

- `mercadoPagoEnabled`
- `mercadoPagoPublicKey`
- `mercadoPagoAccessToken`
- `mercadoPagoWebhookSecret`

### Appointment

Campos relevantes agregados:

- `paymentProvider`
- `paymentStatus`
- `paymentAmountCents`
- `paymentPreferenceId`
- `paymentExternalReference`
- `paymentProviderPaymentId`
- `paymentApprovedAt`
- `paymentExpiresAt`
- `providerId`

### Modelos Nuevos

- `ServiceImage`
- `BlockedTimeSlot`
- `AppointmentEvent`
- `AppointmentReminder`
- `ServiceProvider`

### Enums Relevantes

- `PaymentProvider`
- `PaymentStatus`
- `AppointmentEventType`
- `ReminderChannel`
- `ReminderStatus`

## Validaciones Recientes Conocidas

- `npm run build` viene pasando despues de los cambios recientes
- warnings conocidos actuales:
  - varios componentes siguen usando `<img>` en lugar de `next/image`

Eso hoy afecta al menos a:

- `components/tenant/booking-page.tsx`
- `components/tenant/public-home.tsx`
- `components/tenant/service-editor-card.tsx`
- `components/tenant/site-builder-form.tsx`
- `components/tenant/tenant-agenda-panel.tsx`
- `components/tenant/tenant-dashboard-shell.tsx`

## Ultimos Cambios Importantes Ya Integrados

Entre los ultimos bloques fuertes ya implementados estan:

- mejora visual del panel del tenant
- jerarquizacion de turnos como foco principal
- vista calendario con detalle de turnos
- gestion de estados desde modal
- reprogramacion y notas administrativas
- navegacion por sidebar
- historial y bloqueos
- turnos manuales
- prestadores multiples
- simplificacion del encabezado del panel
- mejoras responsive para dispositivos moviles

## Como Seguir Trabajando Sin Romper El Proyecto

Recomendaciones practicas:

1. Antes de empezar, correr:

```powershell
git checkout main
git pull origin main
```

2. Revisar si el entorno local esta levantando correctamente:

- `npm run dev`
- login tenant
- agenda del tenant
- reserva publica

3. Si se toca Prisma:

- detener el dev server
- correr `npx prisma generate`
- correr migracion si corresponde
- volver a levantar el proyecto

4. Validar siempre con:

```powershell
npm run build
```

5. Hacer commit por bloque importante y push frecuente.

## Proximos Pasos Recomendados

Orden sugerido de continuidad:

1. Disponibilidad por prestador.
2. Reemplazar `<img>` por `next/image` donde tenga sentido.
3. Mejorar aun mas la UX movil del dashboard con navegacion tipo tabs.
4. Modulo de `Clientes` como historial central por persona.
5. Recordatorios reales por proveedor externo:
   - mail
   - WhatsApp
6. Mas iconografia y refinamiento visual del sidebar.
7. Reportes operativos del tenant.

## Convencion De Continuidad

Si otra persona retoma el proyecto, lo ideal es que:

- lea primero `README.md`
- lea despues este archivo
- revise `docs/architecture.md`
- haga `git log --oneline -15`
- levante el proyecto localmente
- recien ahi empiece a cambiar codigo

