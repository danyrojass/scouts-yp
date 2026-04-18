# Scouts YP - Sistema de Gestion Scout

Aplicacion web para la gestion de beneficiarios, grupos y actividades scout.

## Caracteristicas

- **Autenticacion**: Registro y login con email/password
- **Gestion de Grupos**: CRUD completo de Grupos Scouts
- **Gestion de Secciones**: CRUD de secciones por grupo
- **Gestion de Actividades**: CRUD de actividades con puntos
- **Gestion de Usuarios**: CRUD con permisos diferenciados por rol
- **Dashboard Personalizado**: Segun tipo de usuario (Jefe/Dirigente/Beneficiario)
- **Sistema de Puntos**: Seguimiento de actividades completadas

## Permisos por Rol

| Funcion | Jefe | Dirigente | Beneficiario |
|---------|------|----------|-------------|
| Ver dashboard | ✅ | ✅ | ✅ |
| Ver todas las secciones | ✅ | Solo su nivel | Solo su grupo |
| Ver todas las actividades | ✅ | Solo su nivel | Solo su nivel |
| Crear/Editar/Eliminar | ✅ | ❌ | ❌ |
| Completar actividades | ✅ | ✅ | Solo grupo propio |

## Tech Stack

- **Framework**: Angular 20+ (standalone components)
- **Backend**: Firebase (Auth + Firestore)
- **Estado**: RxJS + Angular Signals
- **Estilos**: CSS custom

## Requisitos

- Node.js 18+
- npm 9+
- Cuenta de Firebase

## Instalacion

```bash
# Clonar el repositorio
git clone <repo-url>
cd scouts-yp

# Instalar dependencias
npm install

# Configurar Firebase
# 1. Crear proyecto en Firebase Console
# 2. Habilitar Authentication (email/password)
# 3. Crear Firestore Database
# 4. Copiar config en src/environments/environment.ts
```

## Configuracion de Firebase

```typescript
// src/environments/environment.ts
export const environment = {
  production: false,
  firebase: {
    apiKey: "TU_API_KEY",
    authDomain: "TU_PROJECT.firebaseapp.com",
    projectId: "TU_PROJECT_ID",
    storageBucket: "TU_PROJECT.appspot.com",
    messagingSenderId: "TU_SENDER_ID",
    appId: "TU_APP_ID"
  }
};
```

## Desarrollo

```bash
# Servidor de desarrollo
npm start

# Construir para produccion
npm run build
```

## Estructura del Proyecto

```
src/app/
├── auth/                    # Autenticacion
│   ├── components/          # Login, Register
│   ├── services/            # AuthService
│   └── auth.guard.ts        # Proteccion de rutas
├── dashboard/               # Dashboard principal
├── users/                   # Gestion de usuarios
│   ├── components/          # List, Detail, Form
│   ├── models/              # User, UserType, UserLevel
│   └── services/            # UserService
├── groups/                  # Gestion de grupos
├── sets/                    # Gestion de secciones
├── activities/             # Gestion de actividades
└── shared/                 # Componentes compartidos
    ├── components/          # Navbar, Footer, Alert
    ├── services/           # NavigationService
    └── utils/              # Firestore utilities
```

## Firestore Schema

```
users/
  - id: string
  - name: string
  - email: string
  - type: "Jefe" | "Beneficiario"
  - level: "Lobato" | "Scout" | "Caminante" | "Rover" | "Jefe"
  - groupId: string
  - setId: string | null
  - dateOfBirth: timestamp

groups/
  - id: string
  - name: string
  - number: number
  - city: string
  - createdAt: timestamp

sets/
  - id: string
  - name: string
  - type: "Lobato" | "Scout" | "Caminante" | "Rover"
  - groupId: string
  - createdAt: timestamp

activities/
  - id: string
  - name: string
  - description: string
  - level: "Lobato" | "Scout" | "Caminante" | "Rover" | "Dirigente"
  - points: number
  - createdAt: timestamp

activityCompletions/
  - id: string
  - activityId: string
  - userId: string
  - groupId: string
  - earnedPoints: number
  - completedAt: timestamp
```

## Comandos Disponibles

| Comando | Descripcion |
|--------|-------------|
| `npm start` | Iniciar servidor de desarrollo |
| `npm run build` | Construir para produccion |
| `npm run test` | Ejecutar pruebas |
| `npm run watch` |/watch mode para desarrollo |

## Contribucion

1. Fork del repositorio
2. Crear branch: `git checkout -b feature/nueva-caracteristica`
3. Commit: `git commit -m 'feat: descripcion'`
4. Push: `git push origin feature/nueva-caracteristica`
5. Crear Pull Request

## Licencia

ISC