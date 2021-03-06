import 'cross-fetch/polyfill'
import {
  IAgentContext,
  IResolver,
  IMessage,
  IDIDManager,
  IKeyManager,
  IMessageHandler,
  IPluginMethodMap,
  IAgentPlugin,
} from '@veramo/core'
import { schema } from './'
import { v4 as uuidv4 } from 'uuid'
import Debug from 'debug'

const debug = Debug('veramo:did-comm:action-handler')

/**
 * Input arguments for {@link IDIDComm.sendMessageDIDCommAlpha1}
 * @beta
 */
export interface ISendMessageDIDCommAlpha1Args {
  url?: string
  save?: boolean
  data: {
    id?: string
    from: string
    to: string
    type: string
    body: object | string
  }
  headers?: Record<string, string>
}

/**
 * DID Comm plugin interface for {@link @veramo/core#Agent}
 * @beta
 */
export interface IDIDComm extends IPluginMethodMap {
  /**
   * This is used to create a message according to the initial {@link https://github.com/decentralized-identifier/DIDComm-js | DIDComm-js} implementation.
   *
   * @remarks Be advised that this spec is still not final and that this protocol may need to change.
   *
   * @param args - Arguments necessary for sending a DIDComm message
   * @param context - This reserved param is automatically added and handled by the framework, *do not override*
   */
  sendMessageDIDCommAlpha1(
    args: ISendMessageDIDCommAlpha1Args,
    context: IAgentContext<IDIDManager & IKeyManager & IResolver & IMessageHandler>,
  ): Promise<IMessage>
}

/**
 * DID Comm plugin for {@link @veramo/core#Agent}
 *
 * This plugin provides a method of creating an encrypted message according to the initial {@link https://github.com/decentralized-identifier/DIDComm-js | DIDComm-js} implementation.
 *
 * @remarks Be advised that this spec is still not final and that this protocol may need to change.
 *
 * @beta
 */
export class DIDComm implements IAgentPlugin {
  /** Plugin methods */
  readonly methods: IDIDComm
  readonly schema = schema.IDIDComm

  constructor() {
    this.methods = {
      sendMessageDIDCommAlpha1: this.sendMessageDIDCommAlpha1,
    }
  }

  /** {@inheritdoc IDIDComm.sendMessageDIDCommAlpha1} */
  async sendMessageDIDCommAlpha1(
    args: ISendMessageDIDCommAlpha1Args,
    context: IAgentContext<IDIDManager & IKeyManager & IResolver & IMessageHandler>,
  ): Promise<IMessage> {
    const { data, url, headers, save = true } = args

    debug('Resolving didDoc')
    const didDoc = (await context.agent.resolveDid({ didUrl: data.to })).didDocument
    let serviceEndpoint
    if (url) {
      serviceEndpoint = url
    } else {
      const service = didDoc && didDoc.service && didDoc.service.find((item) => item.type == 'Messaging')
      serviceEndpoint = service?.serviceEndpoint
    }

    if (serviceEndpoint) {
      try {
        data.id = data.id || uuidv4()
        let postPayload = JSON.stringify(data)
        try {
          const identifier = await context.agent.didManagerGet({ did: data.from })
          const key = identifier.keys.find((k) => k.type === 'Ed25519')
          if (!key) throw Error('No encryption key')
          const publicKey = didDoc?.publicKey?.find((item) => item.type == 'Ed25519VerificationKey2018')
          if (!publicKey?.publicKeyHex) throw Error('Recipient does not have encryption publicKey')

          postPayload = await context.agent.keyManagerEncryptJWE({
            kid: key.kid,
            to: {
              type: 'Ed25519',
              publicKeyHex: publicKey?.publicKeyHex,
              kid: publicKey?.publicKeyHex,
            },
            data: postPayload,
          })

          debug('Encrypted:', postPayload)
        } catch (e) {}

        debug('Sending to %s', serviceEndpoint)
        const res = await fetch(serviceEndpoint, {
          method: 'POST',
          body: postPayload,
          headers,
        })
        debug('Status', res.status, res.statusText)

        if (res.status == 200) {
          return await context.agent.handleMessage({
            raw: JSON.stringify(data),
            metaData: [{ type: 'DIDComm-sent' }],
            save,
          })
        }

        return Promise.reject(new Error('Message not sent'))
      } catch (e) {
        return Promise.reject(e)
      }
    } else {
      debug('No Messaging service in didDoc')
      return Promise.reject(new Error('No service endpoint'))
    }
  }
}
