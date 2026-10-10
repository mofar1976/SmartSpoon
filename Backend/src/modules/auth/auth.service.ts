import { ConflictException, Injectable, OnModuleInit, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { JwtService } from '@nestjs/jwt';
import { Model, Types } from 'mongoose';
import { randomBytes } from 'node:crypto';
import { RegisterDto } from './dto/register.dto';
import { CredentialsDto } from './dto/credentials.dto';
import { PasswordService } from './password.service';
import { User, UserDocument } from './schemas/user.schema';

@Injectable()
export class AuthService implements OnModuleInit {
  private dummyHash!: string;

  constructor(
    @InjectModel(User.name) private readonly users: Model<User>,
    private readonly passwords: PasswordService,
    private readonly jwt: JwtService,
  ) {}

  async onModuleInit(): Promise<void> {
    // Ensure the unique username index exists before accepting registrations.
    await this.users.init();
    this.dummyHash = await this.passwords.hash(randomBytes(32).toString('hex'));
  }

  async register(credentials: RegisterDto) {
    const passwordHash = await this.passwords.hash(credentials.password);
    let user: UserDocument;
    try {
      user = await this.users.create({ username: credentials.username, birthDate: credentials.birthDate, passwordHash });
    } catch (error: unknown) {
      if (typeof error === 'object' && error !== null && 'code' in error && error.code === 11000) {
        throw new ConflictException('Benutzername ist bereits vergeben.');
      }
      throw error;
    }
    return this.session(user);
  }

  async login(credentials: CredentialsDto) {
    if (typeof credentials.username !== 'string' || typeof credentials.password !== 'string')
      throw new UnauthorizedException('Benutzername oder Passwort ist falsch.');
    const user = await this.users.findOne({ username: { $eq: credentials.username } }).select('+passwordHash').exec();
    const valid = await this.passwords.verify(credentials.password, user?.passwordHash ?? this.dummyHash);
    if (!user || !valid) throw new UnauthorizedException('Benutzername oder Passwort ist falsch.');
    return this.session(user);
  }

  async findUser(id: string) {
    if (!Types.ObjectId.isValid(id)) throw new UnauthorizedException('Ungültiger Zugang.');
    const user = await this.users.findById(id).exec();
    if (!user) throw new UnauthorizedException('Ungültiger Zugang.');
    return this.publicUser(user);
  }

  private publicUser(user: UserDocument) {
    return { id: user.id as string, username: user.username, birthDate: user.birthDate ?? null };
  }

  private async session(user: UserDocument) {
    return {
      accessToken: await this.jwt.signAsync({ sub: user.id }),
      tokenType: 'Bearer',
      expiresIn: 360000000,
      user: this.publicUser(user),
    };
  }
}
