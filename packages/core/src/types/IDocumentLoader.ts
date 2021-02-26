import { IPluginMethodMap } from './IAgent'

/**
 * Input arguments for {@link IDocumentLoader.loadDocument | loadDocument}
 * @public
 */
export interface ILoadDocumentArgs {
  /**
   * DID URL
   *
   * @example
   * `https://w3id.org/did/v1`
   */
  url: string
}

/**
 * Response for {@link IDocumentLoader.loadDocument | loadDocument}
 * @public
 */
export interface IDocumentLoaderResponse {
  contextUrl: string | null
  documentUrl: string
  document: string
}

/**
 * DocumentLoader interface
 * @public
 */
export interface IDocumentLoader extends IPluginMethodMap {
  /**
   * Fetches a document from a URL
   *
   * @example
   * ```typescript
   * const doc = await agent.loadDocument({
   *   url: 'https://w3id.org/did/v1'
   * })
   *
   * expect(doc).toEqual({
   *
   * TBD
   *
   * })
   * ```
   *
   * @param args - Input arguments for fetching a document
   * @public
   */
  loadDocument(args: ILoadDocumentArgs): Promise<IDocumentLoaderResponse>
}
