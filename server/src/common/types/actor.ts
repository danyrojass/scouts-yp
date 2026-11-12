import { Role } from '@prisma/client';

/** Identidad mínima del usuario autenticado que ejecuta una acción. */
export interface Actor {
  id: string;
  role: Role;
}
