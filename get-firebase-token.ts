import * as readline from 'readline';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';

// Configuração do Firebase (obtenha do Firebase Console → Project Settings → General → Your apps → Web app config)
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY || "AIzaSyD1drEtUAHquoJu4dxs29wy22IiC-laIIk",
  authDomain: process.env.FIREBASE_AUTH_DOMAIN || "tafeito-64352.firebaseapp.com",
  projectId: process.env.FIREBASE_PROJECT_ID || "tafeito-64352",
  // Adicione outros campos se necessário (storageBucket, messagingSenderId, appId)
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Função para obter o token
async function getToken(email: string, password: string): Promise<string> {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const idToken = await userCredential.user.getIdToken();
    return idToken;
  } catch (error) {
    console.error('Erro ao fazer login:', error);
    throw error;
  }
}

// Interface para entrada do usuário
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.question('Digite seu email: ', (email) => {
  rl.question('Digite sua senha: ', async (password) => {
    try {
      const token = await getToken(email, password);
      console.log('\nToken de ID do Firebase:');
      console.log(token);
      console.log('\nUse este token no cabeçalho Authorization: Bearer ' + token);
    } catch (error) {
      console.error('Falha ao obter token.');
    } finally {
      rl.close();
    }
  });
});