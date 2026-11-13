# Glosario — Scouts YP

Términos del dominio scout y de la aplicación.

## Roles

| Término | Descripción |
|---------|-------------|
| **BENEFICIARIO** | Scout/miembro. Puede ver su grupo/secciones y completar actividades. Rol más bajo. |
| **DIRIGENTE** | Líder/encargado. Crea y edita usuarios, grupos, secciones y actividades. |
| **ADMIN** | Administrador de un grupo. Todo lo del Dirigente + eliminar (soft delete), configuración del grupo y nombramiento de otros `ADMIN`. |
| **SUPER_ADMIN** | Administrador de plataforma. No pertenece a un grupo; opera sobre uno con el header `X-Group-Id` (validado y auditado). |

## Niveles (UserLevel)

| Término | Descripción |
|---------|-------------|
| **LOBATO** | Nivel más joven (rama lobatos). |
| **SCOUT** | Rama scouts. |
| **CAMINANTE** | Rama caminantes. |
| **ROVER** | Rama rovers. |
| **JEFE** | Dirigencia. |

## Entidades

| Término | Descripción |
|---------|-------------|
| **Group** | Grupo scout y **tenant** de la aplicación. Tiene `number` (String, ej. "001"), `city`, `slug` único e `isActive`. Todo query se scopea por su `id` (`groupId`). Se da de baja lógicamente. |
| **User** | Usuario (beneficiario o dirigente). Pertenece a un solo grupo (`groupId`), salvo `SUPER_ADMIN`. Soft delete vía `isActive=false`. |
| **Set** | Sección/unidad chica dentro de un grupo. Guarda su `level` (`LOBATO` \| `SCOUT` \| `CAMINANTE` \| `ROVER`); los dirigentes (`JEFE`) no tienen sección. |
| **Activity** | Actividad con `key` único por organización, nivel y puntos. |
| **ActivityCompletion** | Registro de actividad completada por un usuario (unique activity+user). |
| **Payment** | Pago/cuota de un beneficiario (monto Decimal, concepto, moneda). |
| **Progression** | Progresión de un beneficiario entre niveles, con aprobación de un dirigente. |
| **RefreshToken** | Token de refresco con rotación y revocación. |

## Unidades por nivel

La sección guarda la rama (`Set.level`); el nombre visible de la unidad chica se deriva
de una única constante. No existe un enum `SetType`.

| Nivel (`UserLevel`) | Unidad |
|---------------------|--------|
| **LOBATO** | Seisena |
| **SCOUT** | Patrulla |
| **CAMINANTE** | Equipo |
| **ROVER** | Clan |
| **JEFE** | — (los dirigentes no tienen sección) |

## Auth y seguridad

| Término | Descripción |
|---------|-------------|
| **Access token** | JWT de corta vida (15 min) en cookie httpOnly. |
| **Refresh token** | Token de larga vida (7 días) con rotación; cada uso emite uno nuevo. |
| **Multi-tenant** | Aislamiento por `groupId`; el middleware `requireGroup` lo extrae del JWT. `SUPER_ADMIN` lo indica con `X-Group-Id`. |
| **tokenVersion** | Contador en `User`; al cambiar rol, grupo o estado se incrementa y los JWT viejos dejan de valer. |

## Infraestructura

| Término | Descripción |
|---------|-------------|
| **Full-stack image** | Contenedor único (nginx + node) para Railway; un solo dominio. |
| **Docker Compose** | Stack local de 4 servicios (postgres, api, frontend, nginx). |
| **Prisma** | ORM; esquema en `server/prisma/schema.prisma`. |
