import { IsOptional, IsString } from 'class-validator';

export class ApproveProgressionDto {
  /**
   * Sección de la nueva rama. `null` desasigna la sección.
   * Si se omite, se conserva la actual cuando coincide con el nuevo nivel;
   * si no coincide, la progresión no se puede aprobar.
   */
  @IsOptional()
  @IsString()
  setId?: string | null;
}
