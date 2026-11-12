# Glosario — Scouts YP

Términos del dominio scout y de la aplicación.

## Roles

| Término | Descripción |
|---------|-------------|
| **BENEFICIARIO** | Scout/miembro. Puede ver su grupo/secciones y completar actividades. Rol más bajo. |
| **DIRIGENTE** | Líder/encargado. Crea y edita usuarios, grupos, secciones y actividades. |
| **ADMIN** | Administrador de la organización. Todo lo del Dirigente + eliminar (soft delete). |

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
| **Organization** | Organización multi-tenant. Cada registro crea una con slug único. Todo query se scopea por su `organizationId`. |
| **User** | Usuario (beneficiario o dirigente). Soft delete vía `isActive=false`. |
| **Group** | Grupo scout. `number` es String (ej. "001"). Se borra físicamente. |
| **Set** | Sección/subgrupo dentro de un grupo (type `SEISENA` \| `PATRULLA` \| `EQUIPO` \| `CLAN`). |
| **Activity** | Actividad con `key` único por organización, nivel y puntos. |
| **ActivityCompletion** | Registro de actividad completada por un usuario (unique activity+user). |
| **Payment** | Pago/cuota de un beneficiario (monto Decimal, concepto, moneda). |
| **Progression** | Progresión de un beneficiario entre niveles, con aprobación de un dirigente. |
| **RefreshToken** | Token de refresco con rotación y revocación. |

## Tipos de Set (SetType)

| Término | Descripción |
|---------|-------------|
| **SEISENA** | Subgrupo de lobatos. |
| **PATRULLA** | Subgrupo de scouts. |
| **EQUIPO** | Subgrupo de caminantes. |
| **CLAN** | Subgrupo de rovers. |

## Auth y seguridad

| Término | Descripción |
|---------|-------------|
| **Access token** | JWT de corta vida (15 min) en cookie httpOnly. |
| **Refresh token** | Token de larga vida (7 días) con rotación; cada uso emite uno nuevo. |
| **Multi-tenant** | Aislamiento por `organizationId`; el middleware `requireTenant` lo extrae del JWT. |

## Infraestructura

| Término | Descripción |
|---------|-------------|
| **Full-stack image** | Contenedor único (nginx + node) para Railway; un solo dominio. |
| **Docker Compose** | Stack local de 4 servicios (postgres, api, frontend, nginx). |
| **Prisma** | ORM; esquema en `server/prisma/schema.prisma`. |
