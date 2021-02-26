import {
  IAgentContext,
  IAgentPlugin,
  IResolver,
  IDIDManager,
  IKeyManager,
  IPluginMethodMap,
  W3CCredential,
  W3CPresentation,
  VerifiableCredential,
  VerifiablePresentation,
  IDataStore,
  IDocumentLoader,
  IDocumentLoaderResponse,
  ILoadDocumentArgs,
  IIdentifier,
  IKey,
} from '@veramo/core'

import {
  createVerifiableCredentialJwt,
  createVerifiablePresentationJwt,
  normalizeCredential,
  normalizePresentation,
} from 'did-jwt-vc'

import { schema } from './'

import Debug from 'debug'
const debug = Debug('veramo:w3c:action-handler')

/**
 * The type of encoding to be used for the Verifiable Credential or Presentation to be generated.
 *
 * `jwt` and `ld-proof` is supported at the moment.
 *
 * @public
 */
export type ProofFormat = 'jwt' | 'lds'

// export enum ProofFormat {
//   JWT = 'jwt',
//   LDS = 'ld-proof'
// }

/**
 * Encapsulates the parameters required to create a
 * {@link https://www.w3.org/TR/vc-data-model/#presentations | W3C Verifiable Presentation}
 *
 * @public
 */
export interface ICreateVerifiablePresentationArgs {
  /**
   * The json payload of the Presentation according to the
   * {@link https://www.w3.org/TR/vc-data-model/#presentations | canonical model}.
   *
   * The signer of the Presentation is chosen based on the `holder` property
   * of the `presentation`
   *
   * '@context', 'type' and 'issuanceDate' will be added automatically if omitted
   */
  presentation: {
    id?: string
    holder: string
    issuanceDate?: string
    expirationDate?: string
    '@context'?: string[]
    type?: string[]
    verifier: string[]
    verifiableCredential: VerifiableCredential[]
    [x: string]: any
  }

  /**
   * If this parameter is true, the resulting VerifiablePresentation is sent to the
   * {@link @veramo/core#IDataStore | storage plugin} to be saved
   */
  save?: boolean

  /**
   * The desired format for the VerifiablePresentation to be created.
   */
  proofFormat: ProofFormat
}

/**
 * Encapsulates the parameters required to create a
 * {@link https://www.w3.org/TR/vc-data-model/#credentials | W3C Verifiable Credential}
 *
 * @public
 */
export interface ICreateVerifiableCredentialArgs {
  /**
   * The json payload of the Credential according to the
   * {@link https://www.w3.org/TR/vc-data-model/#credentials | canonical model}
   *
   * The signer of the Credential is chosen based on the `issuer.id` property
   * of the `credential`
   *
   * '@context', 'type' and 'issuanceDate' will be added automatically if omitted
   */
  credential: {
    '@context'?: string[]
    id?: string
    type?: string[]
    issuer: { id: string; [x: string]: any }
    issuanceDate?: string
    expirationDate?: string
    credentialSubject: {
      id?: string
      [x: string]: any
    }
    credentialStatus?: {
      id: string
      type: string
    }
    [x: string]: any
  }

  /**
   * If this parameter is true, the resulting VerifiablePresentation is sent to the
   * {@link @veramo/core#IDataStore | storage plugin} to be saved
   */
  save?: boolean

  /**
   * The desired format for the VerifiablePresentation to be created.
   */
  proofFormat: ProofFormat
}

/**
 * The interface definition for a plugin that can generate Verifiable Credentials and Presentations
 *
 * @remarks Please see {@link https://www.w3.org/TR/vc-data-model | W3C Verifiable Credentials data model}
 *
 * @public
 */
export interface ICredentialIssuer extends IPluginMethodMap {
  /**
   * Creates a Verifiable Presentation.
   * The payload, signer and format are chosen based on the `args` parameter.
   *
   * @param args - Arguments necessary to create the Presentation.
   * @param context - This reserved param is automatically added and handled by the framework, *do not override*
   *
   * @returns - a promise that resolves to the {@link @veramo/core#VerifiablePresentation} that was requested or rejects with an error
   * if there was a problem with the input or while getting the key to sign
   *
   * @remarks Please see {@link https://www.w3.org/TR/vc-data-model/#presentations | Verifiable Presentation data model }
   */
  createVerifiablePresentation(
    args: ICreateVerifiablePresentationArgs,
    context: IContext,
  ): Promise<VerifiablePresentation>

  /**
   * Creates a Verifiable Credential.
   * The payload, signer and proof type are chosen based on the `args` parameter.
   *
   * @param args - Arguments necessary to create the Presentation.
   * @param context - This reserved param is automatically added and handled by the framework, *do not override*
   *
   * @returns - a promise that resolves to the {@link @veramo/core#VerifiableCredential} that was requested or rejects with an error
   * if there was a problem with the input or while getting the key to sign
   *
   * @remarks Please see {@link https://www.w3.org/TR/vc-data-model/#credentials | Verifiable Credential data model}
   */
  createVerifiableCredential(
    args: ICreateVerifiableCredentialArgs,
    context: IContext,
  ): Promise<VerifiableCredential>
}

/**
 * Represents the requirements that this plugin has.
 * The agent that is using this plugin is expected to provide these methods.
 *
 * This interface can be used for static type checks, to make sure your application is properly initialized.
 */
export type IContext = IAgentContext<
  IResolver &
    Pick<IDIDManager, 'didManagerGet'> &
    Pick<IDataStore, 'dataStoreSaveVerifiablePresentation' | 'dataStoreSaveVerifiableCredential'> &
    Pick<IKeyManager, 'keyManagerSignJWT'>
>

export class DocumentLoader implements IAgentPlugin {
  readonly methods: IDocumentLoader

  constructor() {
    this.methods = {
      loadDocument: this.loadDocument,
    }
  }

  /** {@inheritdoc IDocumentLoader.loadDocument} */
  async loadDocument(args: ILoadDocumentArgs): Promise<IDocumentLoaderResponse> {
    return Promise.reject(new Error('error'))
  }
}

/**
 * A Veramo plugin that implements the {@link ICredentialIssuer} methods.
 *
 * @public
 */
export class CredentialIssuer implements IAgentPlugin {
  readonly methods: ICredentialIssuer
  readonly schema = schema.ICredentialIssuer

  constructor() {
    this.methods = {
      createVerifiablePresentation: this.createVerifiablePresentation,
      createVerifiableCredential: this.createVerifiableCredential,
    }
  }

  /** {@inheritdoc ICredentialIssuer.createVerifiablePresentation} */
  async createVerifiablePresentation(
    args: ICreateVerifiablePresentationArgs,
    context: IContext,
  ): Promise<VerifiablePresentation> {
    try {
      const presentation: W3CPresentation = {
        ...args.presentation,
        '@context': args.presentation['@context'] || ['https://www.w3.org/2018/credentials/v1'],
        //FIXME: make sure 'VerifiablePresentation' is the first element in this array:
        type: args.presentation.type || ['VerifiablePresentation'],
        issuanceDate: args.presentation.issuanceDate || new Date().toISOString(),
      }

      //FIXME: if the identifier is not found, the error message should reflect that.
      const identifier = await context.agent.didManagerGet({ did: presentation.holder })
      //FIXME: `args` should allow picking a key or key type
      const key = identifier.keys.find((k) => k.type === 'Secp256k1' || k.type === 'Ed25519')
      if (!key) throw Error('No signing key for ' + identifier.did)
      //FIXME: Throw an `unsupported_format` error if the `args.proofFormat` is not `jwt`
      const signer = (data: string) => context.agent.keyManagerSignJWT({ kid: key.kid, data })
      debug('Signing VP with', identifier.did)
      const jwt = await createVerifiablePresentationJwt(presentation, { did: identifier.did, signer })
      //FIXME: flagging this as a potential privacy leak.
      debug(jwt)
      const verifiablePresentation = normalizePresentation(jwt)
      if (args.save) {
        await context.agent.dataStoreSaveVerifiablePresentation({ verifiablePresentation })
      }
      return verifiablePresentation
    } catch (error) {
      debug(error)
      return Promise.reject(error)
    }
  }

  private async generateVerfiableCredentialLd(
    credential: W3CCredential,
    issuer: IIdentifier,
    issuerKey: IKey,
    context: IContext,
  ): Promise<VerifiableCredential> {
    const documentLoader = (url: string) => new DocumentLoader().loadDocument({ url: url })

    //context.agent.resolveDid(url)

    throw Error('not implemented yet!')
  }

  private async generateVerfiableCredentialJwt(
    credential: W3CCredential,
    issuer: IIdentifier,
    issuerKey: IKey,
    context: IContext,
  ): Promise<VerifiableCredential> {
    const signer = (data: string) => context.agent.keyManagerSignJWT({ kid: issuerKey.kid, data })

    let alg = 'ES256K'
    if (issuerKey.type === 'Ed25519') {
      alg = 'EdDSA'
    }

    const jwt = await createVerifiableCredentialJwt(credential, { did: issuer.did, signer, alg })
    //FIXME: flagging this as a potential privacy leak.
    debug(jwt)
    return normalizeCredential(jwt)
  }

  private async findIssuer(credential: W3CCredential, context: IContext): Promise<IIdentifier> {
    return context.agent.didManagerGet({ did: credential.issuer.id })
  }

  private async findIssuerKey(issuerIdentifier: IIdentifier, context: IContext): Promise<IKey> {
    const key = issuerIdentifier.keys.find((k) => k.type === 'Secp256k1' || k.type === 'Ed25519')
    if (!key) throw Error('No signing key for ' + issuerIdentifier.did)
    return key
  }

  /** {@inheritdoc ICredentialIssuer.createVerifiableCredential} */
  async createVerifiableCredential(
    args: ICreateVerifiableCredentialArgs,
    context: IContext,
  ): Promise<VerifiableCredential> {
    try {
      // FIXME: TODO: we shouldn't do auto-adding the context
      const credential: W3CCredential = {
        ...args.credential,
        '@context': args.credential['@context'] || ['https://www.w3.org/2018/credentials/v1'],
        //FIXME: make sure 'VerifiableCredential' is the first element in this array:
        type: args.credential.type || ['VerifiableCredential'],
        issuanceDate: args.credential.issuanceDate || new Date().toISOString(),
      }

      // FIXME: TODO: validate @context / json-ld validation: required for both, jwt and ld-proofs

      // FIXME: TODO: we will need to add the key handle to the args
      // this will then be used for JWT as the kid, for LD-Proofs it
      // is the verificationMethod in the proof property
      // we should then also define a default value, just take any key that makes most sense

      //FIXME: if the identifier is not found, the error message should reflect that.
      const issuer = await this.findIssuer(credential, context)
      debug('Generating VC with with issuer DID: ', issuer.did)

      // FIXME: TODO: find issuance key
      const issuerKey = await this.findIssuerKey(issuer, context)

      let verifiableCredential = null
      if (args.proofFormat === 'jwt') {
        verifiableCredential = await this.generateVerfiableCredentialJwt(
          credential,
          issuer,
          issuerKey,
          context,
        )
      } /* 'lds' */ else {
        verifiableCredential = await this.generateVerfiableCredentialLd(
          credential,
          issuer,
          issuerKey,
          context,
        )
      }

      if (args.save) {
        await context.agent.dataStoreSaveVerifiableCredential({ verifiableCredential })
      }

      return verifiableCredential
    } catch (error) {
      debug(error)
      return Promise.reject(error)
    }
  }
}
