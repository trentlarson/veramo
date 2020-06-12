import { IKey, EcdsaSignature, TKeyType } from '../types'

export abstract class AbstractKeyManagementSystem {
  abstract createKey(args: { type: TKeyType; meta?: any }): Promise<Omit<IKey, 'kms'>>
  abstract deleteKey(args: { kid: string }): Promise<boolean>
  abstract encryptJWE(args: { key: IKey; to: IKey; data: string }): Promise<string>
  abstract decryptJWE(args: { key: IKey; data: string }): Promise<string>
  abstract signJWT(args: { key: IKey; data: string }): Promise<EcdsaSignature | string>
  abstract signEthTX(args: { key: IKey; transaction: object }): Promise<string>
}