// __mocks__/lucideMock.js

// Mock simples para todos os ícones do lucide-react
// Retorna um componente React funcional simples que simula um ícone SVG.
// Isso evita problemas com a transpilação de ESM do lucide-react no Jest.

const React = require('react');

const createIconMock = (iconName) => {
  return React.forwardRef((props, ref) => {
    // Remove a prop 'name' se ela existir, pois não é uma prop SVG válida.
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { name, ...restOfProps } = props;
    return React.createElement('svg', {
      ...restOfProps,
      ref,
      'data-lucide': iconName,
      'data-testid': `lucide-icon-${iconName.toLowerCase()}`, // Adiciona um data-testid para o mock
    });
  });
};

const lucideMock = new Proxy({}, {
  get: function(target, prop) {
    if (typeof prop === 'string') {
      // Retorna um componente mock para qualquer ícone solicitado
      return createIconMock(prop);
    }
    return Reflect.get(target, prop);
  }
});

module.exports = lucideMock;
