import { Credentials } from "./Credentials.model";

export interface Registration extends Credentials {
  birthDate: string;
}