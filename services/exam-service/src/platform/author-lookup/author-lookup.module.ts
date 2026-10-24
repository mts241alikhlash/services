import { Global, Module } from '@nestjs/common'
import { IAuthorLookupPort } from './author-lookup.port.js'
import { HttpAuthorLookupAdapter } from './http-author-lookup.adapter.js'

@Global()
@Module({
  providers: [
    { provide: IAuthorLookupPort, useClass: HttpAuthorLookupAdapter },
  ],
  exports: [IAuthorLookupPort],
})
export class AuthorLookupModule {}
