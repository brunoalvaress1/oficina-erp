import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import { AppProviders } from './providers/AppProviders.tsx'
import './index.css'

// Depois de um novo deploy, os arquivos JS antigos (com hash no nome) somem
// do servidor — quem já estava com o site aberto e clica em algo que carrega
// um chunk sob demanda (import() dinâmico, ex: gerar PDF) recebe "Failed to
// fetch dynamically imported module". O Vite dispara esse evento nesse caso;
// recarregar a página busca o build atual e resolve. A trava por
// sessionStorage evita ficar recarregando em loop se o problema for outro
// (ex: sem internet).
window.addEventListener('vite:preloadError', () => {
  const jaTentou = sessionStorage.getItem('recarregou-apos-erro-de-modulo')
  if (jaTentou) return
  sessionStorage.setItem('recarregou-apos-erro-de-modulo', '1')
  window.location.reload()
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppProviders>
      <App />
    </AppProviders>
  </StrictMode>,
)

// Build atual carregou de boa — libera a trava, pra um erro de chunk num
// deploy futuro (nessa mesma aba, se ficar aberta por muito tempo) também
// poder disparar o recarregamento automático.
setTimeout(() => sessionStorage.removeItem('recarregou-apos-erro-de-modulo'), 5000)