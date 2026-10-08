import { ApiProperty } from '@nestjs/swagger';
import { IsString, ValidateBy } from 'class-validator';
import { CredentialsDto } from './credentials.dto';

export function isValidBirthDate(value: unknown, now = new Date()): boolean {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value) || value.startsWith('0000-')) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== value) return false;
  const parts = new Intl.DateTimeFormat('en', {
    timeZone: 'Europe/Berlin', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(now);
  const part = (type: string) => parts.find(p => p.type === type)!.value;
  const today = `${part('year')}-${part('month')}-${part('day')}`;
  return value <= today;
}

export class RegisterDto extends CredentialsDto {
  @ApiProperty({ example: '2000-05-15', type: String, format: 'date', description: 'Geburtsdatum als YYYY-MM-DD; darf nicht in der Zukunft liegen.' })
  @IsString()
  @ValidateBy({
    name: 'birthDate',
    validator: {
      validate: (value: unknown) => isValidBirthDate(value),
      defaultMessage: () => 'birthDate muss ein gültiges Geburtsdatum im Format YYYY-MM-DD sein und darf nicht in der Zukunft liegen.',
    },
  })
  birthDate!: string;
}
