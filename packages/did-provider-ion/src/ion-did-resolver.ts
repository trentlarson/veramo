
import * as ION from '@decentralized-identity/ion-tools'
import { DIDResolutionOptions, DIDResolutionResult, DIDResolver, ParsedDID, Resolvable } from 'did-resolver'

const resolve: DIDResolver = async (
  didUrl: string,
  _parsed: ParsedDID,
  _resolver: Resolvable,
  options: DIDResolutionOptions,
): Promise<DIDResolutionResult> => {
  try {
    const didResolution = (await ION.resolve(didUrl, options)) as DIDResolutionResult
    return didResolution
  } catch (err) {
    return {
      didDocumentMetadata: {},
      didResolutionMetadata: { error: 'invalidDid', message: err.toString() },
      didDocument: null,
    }
  }
}

export function getDidIonResolver() {
  return { ion: resolve }
}
