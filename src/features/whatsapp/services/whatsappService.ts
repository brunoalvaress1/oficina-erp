import { supabase } from '@/lib/supabase'

function traduzirErro(mensagem: string): string {
  if (mensagem.includes('WHATSAPP_NAO_CONFIGURADO')) return 'Integração de WhatsApp inativa — ative em Configurações → WhatsApp.'
  if (mensagem.includes('WHATSAPP_SEM_INSTANCIA')) return 'Configure o nome da instância em Configurações → WhatsApp.'
  if (mensagem.includes('CLIENTE_SEM_TELEFONE')) return 'Cliente sem telefone cadastrado — mensagem não enviada.'
  return mensagem
}

async function extrairMensagemErro(error: unknown): Promise<string> {
  const contexto = (error as any)?.context
  if (contexto && typeof contexto.json === 'function') {
    try {
      const corpo = await contexto.json()
      if (corpo?.error) return corpo.error
    } catch {
      // corpo não era JSON, cai no fallback abaixo
    }
  }
  return error instanceof Error ? error.message : String(error)
}

// Dispara a mensagem automática de "OS pronta" — chamada logo após finalizar
// a OS. Falha aqui não deve travar o fluxo de finalização (a OS já foi
// enviada ao Caixa de qualquer forma), por isso o chamador trata o erro à
// parte, normalmente com um toast silencioso/secundário.
export async function enviarWhatsappOsPronta(ordemServicoId: string): Promise<void> {
  const { error } = await supabase.functions.invoke('enviar-whatsapp-os-pronta', { body: { ordemServicoId } })
  if (error) throw new Error(traduzirErro(await extrairMensagemErro(error)))
}
