<!-- Do not edit this file. It is automatically generated by API Documenter. -->

[Home](./index.md) &gt; [daf-graphql](./daf-graphql.md) &gt; [baseTypeDef](./daf-graphql.basetypedef.md)

## baseTypeDef variable

<b>Signature:</b>

```typescript
baseTypeDef =
  '\ntype Query\ntype Mutation\n\ntype Key {\n  kid: String!\n  kms: String!\n  type: String!\n  publicKeyHex: String\n}\n\ntype Service {\n  id: String!\n  type: String!\n  serviceEndpoint: String!\n  description: String\n}\n\ntype Identity {\n  did: String!\n  provider: String\n  alias: String\n  keys: [Key]\n  services: [Service]\n}\n\nscalar Object\nscalar Date\nscalar VerifiablePresentation\nscalar VerifiableCredential\nscalar Presentation\nscalar Credential\n\ntype Message {\n  id: ID!\n  createdAt: Date\n  expiresAt: Date\n  threadId: String\n  type: String!\n  raw: String\n  data: Object\n  replyTo: [String]\n  replyUrl: String\n  from: String\n  to: String\n  metaData: [MetaData]\n  presentations: [VerifiablePresentation]\n  credentials: [VerifiableCredential]\n}\n\ntype MetaData {\n  type: String!\n  value: String\n}\n\n\n'
```