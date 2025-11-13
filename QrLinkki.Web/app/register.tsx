import AuthRegister from './(auth)/register';

// Garantir que o cabeçalho da Stack não seja exibido para este passthrough top-level
export const options = { headerShown: false };

export default AuthRegister;
