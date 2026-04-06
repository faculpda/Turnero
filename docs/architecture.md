# Arquitectura MVP

## Actores

### Super admin

- Gestiona tenants.
- Ve estado comercial y operativo.
- Puede ingresar al panel del tenant para asistirlo.

### Tenant

- Configura servicios, disponibilidad y agenda.
- Revisa reservas.
- Administra clientes finales.

### Cliente final

- Reserva turnos desde la web publica.
- Consulta sus proximos turnos desde su perfil.

## Resolucion multi-tenant

El tenant puede resolverse de dos formas:

- Por slug: `turnero.com.ar/dentista`
- Por dominio personalizado: `dentista.com`

La aplicacion debe detectar el contexto por `host` o por el slug de la ruta.

## Modulos del MVP

- Gestion de tenants.
- Dominio publico del tenant.
- Agenda y servicios.
- Reservas.
- Panel del tenant.
- Panel super admin.
- Perfil del cliente final.

## Entidades iniciales

- `Tenant`
- `TenantDomain`
- `User`
- `Membership`
- `CustomerProfile`
- `Service`
- `AvailabilityRule`
- `Appointment`

## Roadmap inmediato

1. Crear autenticacion por roles.
2. Persistir tenant context por host/slug.
3. Implementar CRUD de servicios.
4. Implementar disponibilidad y generacion de slots.
5. Implementar reserva publica.
6. Implementar consulta de turnos por cliente final.
