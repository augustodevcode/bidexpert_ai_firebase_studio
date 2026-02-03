/**
 * @fileoverview Shim para fornecer export default compatível com react-dom/client em ambiente de testes.
 */

import type { ReactNode } from 'react';
import * as ReactDOM from 'react-dom';

const createRoot = (container: Element | DocumentFragment) => {
  return {
    render: (element: ReactNode) => {
      ReactDOM.render(element, container);
    },
    unmount: () => {
      ReactDOM.unmountComponentAtNode(container as Element);
    },
  };
};

const hydrateRoot = (container: Element | DocumentFragment, element: ReactNode) => {
  ReactDOM.hydrate(element, container);
  return createRoot(container);
};

const ReactDOMClient = { createRoot, hydrateRoot };

export default ReactDOMClient;
export { createRoot, hydrateRoot };
