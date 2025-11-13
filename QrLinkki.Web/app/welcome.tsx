import Welcome from './(auth)/welcome';

// passthrough para manter a rota web de top-level consistente e ocultar o cabeçalho padrão
export const options = { headerShown: false };

export default Welcome;
