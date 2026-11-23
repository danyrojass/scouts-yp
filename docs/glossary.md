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
| **User** | Identidad de una persona (nombre, email, cumpleaños, `groupId`). El rol, el nivel y la sección varian por año y viven en `Membership`. |
| **Membership** | Pertenencia anual de una persona a un grupo: `{user_id, group_id, year, type, level, set_id, active}`. Un registro por persona y año lectivo. |
| **Set** | Sección/unidad chica dentro de un grupo. Guarda su `level` (`LOBATO` \| `SCOUT` \| `CAMINANTE` \| `ROVER`); los dirigentes (`JEFE`) no tienen sección. Tiene `active` para dar de baja una patrulla/seisena sin borrar su histórico. |
| **Activity** | Actividad con `key` único por organización, nivel, puntos y `year`. |
| **ActivityCompletion** | Registro de actividad completada por un usuario (o por una sección), con `year` para que los puntos no se mezclen entre años. |
| **Payment** | Pago/cuota de un beneficiario (monto Decimal, concepto, moneda). |
| **Progression** | Progresión de un beneficiario entre niveles, con aprobación de un dirigente. |
| **RefreshToken** | Token de refresco con rotación y revocación. |

## Año lectivo e histórico

El **año lectivo** es la unidad temporal de la temporada scout. El grupo guarda
`active_year` (el año que muestra el dashboard) y `years` (los años con datos).
Todo lo que cambia por temporada se etiqueta con `year`: actividades,
completaciones y pertenencias (`memberships`). Las secciones son estables en el
tiempo y sólo se marcan `active: false` cuando se dan de baja.

Los documentos históricos que no tenían `year` se interpretan como `2026`
(`DEFAULT_YEAR` en `year.util.ts`), así que no hizo falta migrarlos para que el
dashboard siga mostrando la temporada actual. El botón **Abrir año** del dashboard
copia las pertenencias activas al año siguiente y cambia el año activo del grupo;
las actividades y los puntos del nuevo año arrancan vacíos.

La pantalla `/historial` recorre los años del grupo y muestra, por temporada,
actividades, puntos, secciones destacadas y dirigentes/jefes de ese año. Es de
sólo lectura: usa los mismos cálculos que el dashboard pero con el año de cada
bloque.

## Actividades completadas

Una **sección completó una actividad** cuando todos sus integrantes tienen una
completación registrada, o cuando existe una completación histórica cargada por un
dirigente para esa sección (registro que no pertenece a ningún integrante). Las
secciones sin integrantes no cuentan salvo que tengan ese registro histórico.

El contador del dashboard es de **actividades distintas**, no de registros de
completación: una actividad completada por 3 patrullas cuenta 1, no 3. El contador
por sección se mide sobre las actividades de su nivel. Cada patrulla aporta **sus
propios puntos**: en "Actividad Reciente" la actividad es el encabezado y debajo se
lista una fila por sección con su fecha y sus puntos, sin sumarlos entre secciones.

Los datos históricos de Firestore guardan la rama en `type` (`Seisena`, `Patrulla`,
`Equipo`, `Clan`) y una sola completación por patrulla y actividad atribuida al
dirigente. `firestoreToSet` mapea ese `type` a `Set.level` para que el frontend pueda
relacionar secciones y actividades.

## Unidades por nivel

La sección guarda la rama (`Set.level`) con los valores históricos del enum. En la UI
la rama se muestra con la terminología del grupo (`branchNameForLevel`) y la unidad
chica se deriva de una única constante (`unitNameForLevel`). No existe un enum
`SetType`.

| Nivel (`UserLevel`) | Rama visible | Unidad chica |
|---------------------|--------------|--------------|
| **LOBATO** | Manada | Seisena |
| **SCOUT** | Tropa | Patrulla |
| **CAMINANTE** | Comunidad | Equipo |
| **ROVER** | Clan | Clan |
| **JEFE** | Jefe | — (los dirigentes no tienen sección) |

## Auth y seguridad

| Término | Descripción |
|---------|-------------|
| **Access token** | JWT de corta vida (15 min) en cookie httpOnly. |
| **Refresh token** | Token de larga vida (7 días) con rotación; cada uso emite uno nuevo. |
| **Multi-tenant** | Aislamiento por `groupId`; el middleware `requireGroup` lo extrae del JWT. `SUPER_ADMIN` lo indica con `X-Group-Id`. |
| **Modo grupo único** | Configuración del deploy de Vercel: los datos conservan `group_id`, pero la UI no permite crear grupos ni registrarse y todo alta hereda el `groupId` del dirigente autenticado. |
| **tokenVersion** | Contador en `User`; al cambiar rol, grupo o estado se incrementa y los JWT viejos dejan de valer. |

## Infraestructura

| Término | Descripción |
|---------|-------------|
| **Full-stack image** | Contenedor único (nginx + node) para Railway; un solo dominio. |
| **Docker Compose** | Stack local de 4 servicios (postgres, api, frontend, nginx). |
| **Prisma** | ORM; esquema en `server/prisma/schema.prisma`. |
