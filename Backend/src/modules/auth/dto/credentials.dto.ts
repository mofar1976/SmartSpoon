import { Transform } from 'class-transformer';
import { IsString, Length, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CredentialsDto {
  @ApiProperty({ example: 'student_01', minLength: 3, maxLength: 30 })
  @Transform(({ value }) => typeof value === 'string' ? value.trim().toLowerCase() : value)
  @IsString()
  @Length(3, 30)
  @Matches(/^[a-z0-9_-]+$/, { message: 'Benutzername darf nur Buchstaben a-z, Zahlen, _ und - enthalten.' })
  username!: string;

  @ApiProperty({ example: 'MeinPasswort123!', minLength: 8, maxLength: 128, format: 'password' })
  @IsString()
  @Length(8, 128)
  password!: string;
}
