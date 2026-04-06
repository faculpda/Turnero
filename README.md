# Turnero

SaaS multi-tenant para gestion de turnos, pensado para profesionales y negocios como dentistas, abogados, medicos y centros de servicios.

## MVP objetivo

- Super admin para gestionar clientes SaaS.
- Tenant con panel propio para administrar agenda, servicios y reservas.
- Sitio publico del tenant accesible por slug (`turnero.com.ar/dentista`) o dominio propio (`dentista.com`).
- Cliente final con posibilidad de reservar y consultar sus turnos.

## Stack propuesto

- Next.js 15
- React 19
- TypeScript
- Prisma
- PostgreSQL

## Estructura inicial

- `app/`: rutas del App Router.
- `components/`: componentes de interfaz reutilizables.
- `lib/`: helpers de dominio, configuracion y datos mock.
- `prisma/`: esquema inicial de base de datos.
- `docs/`: arquitectura y decisiones del MVP.

## Primeros pasos

1. Instalar Node.js 20 o superior.
2. Ejecutar `npm install`.
3. Configurar `.env` a partir de `.env.example`.
4. Ejecutar `npx prisma generate`.
5. Ejecutar `npx prisma migrate dev`.
6. Levantar el proyecto con `npm run dev`.
