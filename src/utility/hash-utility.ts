import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt';

export class HashUtility {
  private static readonly saltOrRounds: number = 10;

  static generateRandomHash(value: number = 32): string {
    return crypto.randomBytes(value).toString('hex');
  }

  static generateSecureNumber(length: number = 6) {
    const min = Math.pow(10, length - 1);
    const max = Math.pow(10, length) - 1;
    return crypto
      .randomInt(min, max + 1)
      .toString()
      .padStart(length, '0');
  }

  static async compareHash(data: string, hash: string): Promise<boolean> {
    return await bcrypt.compare(data, hash);
  }

  static async generateHashValue(data: string): Promise<string> {
    return await bcrypt.hash(data, this.saltOrRounds);
  }
}
