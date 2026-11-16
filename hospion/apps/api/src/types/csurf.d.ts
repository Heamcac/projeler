declare module 'csurf' {
  import { RequestHandler } from 'express';

  interface CsurfOptions {
    cookie?: boolean | object;
    ignoreMethods?: string[];
  }

  function csurf(options?: CsurfOptions): RequestHandler;
  export = csurf;
}
