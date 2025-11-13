// Barramento leve de eventos de refresh dentro do app.
// Componentes podem se inscrever para serem notificados quando um "refresh"
// global for solicitado (por exemplo, quando o botão "Atualizar" no cabeçalho for pressionado).

type Unsub = () => void;

const listeners: Set<() => void> = new Set();

export function subscribeRefresh(cb: () => void): Unsub {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function triggerRefresh() {
  // chama os listeners de forma síncrona; os inscritos devem gerenciar seu próprio trabalho assíncrono
  listeners.forEach((cb) => {
    try {
      cb();
    } catch (e) {
      // ignorar erros de listeners individuais
      // console.warn('erro em listener de refresh', e);
    }
  });
}

export default { subscribeRefresh, triggerRefresh };
