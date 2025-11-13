import React from 'react';

// Este arquivo costumava ser um helper vazio dentro de `app/` que fazia com que
// o expo-router o tratasse como uma rota e emitisse um warning em tempo de
// execução: "missing the required default export". Não é uma página.
//
// Exportamos um componente no-op para que o router não registre esse erro
// durante a descoberta de rotas. Se preferir manter helpers, mova-os para
// `lib/` (fora de `app/`) ou prefixe o arquivo/diretório com parênteses
// para torná-lo um grupo (ex.: `(lib)`).

export default function _NotARoute() {
	return null;
}
