// jest.setup.js
import '@testing-library/jest-dom';

// jest.setup.js
import '@testing-library/jest-dom';
import 'whatwg-fetch'; // Polyfill para fetch

// Polyfill para TextEncoder e TextDecoder, que são esperados pelo Next.js em alguns contextos no JSDOM
import { TextEncoder, TextDecoder } from 'util';

if (typeof global.TextEncoder === 'undefined') {
  global.TextEncoder = TextEncoder;
}
if (typeof global.TextDecoder === 'undefined') {
  global.TextDecoder = TextDecoder;
}

// Polyfills para Request e Response (básicos, podem precisar de mais detalhes se os testes falharem)
if (typeof global.Request === 'undefined') {
  global.Request = class Request {
    constructor(input: any, init?: any) {
      // Mock simples
      // @ts-ignore
      this.url = typeof input === 'string' ? input : input?.url;
      // @ts-ignore
      this.method = init?.method || 'GET';
      // Adicione outras propriedades conforme necessário
    }
    // Adicione métodos mockados conforme necessário
  } as any;
}

if (typeof global.Response === 'undefined') {
  global.Response = class Response {
    constructor(body?: any, init?: any) {
      // Mock simples
      // @ts-ignore
      this.status = init?.status || 200;
      // @ts-ignore
      this.ok = this.status >= 200 && this.status < 300;
      // Adicione outras propriedades conforme necessário
    }
    // Adicione métodos mockados conforme necessário
    json() {
      return Promise.resolve({});
    }
    text() {
      return Promise.resolve('');
    }
  } as any;
}


// Você pode adicionar outros polyfills globais ou configurações aqui, se necessário.
// Exemplo: mock para matchMedia
// global.matchMedia = global.matchMedia || function() {
//   return {
//       matches : false,
//       addListener : function() {},
//       removeListener: function() {}
//   }
// }
