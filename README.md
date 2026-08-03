# Módulo Veículos — oficina-erp

## O que tem aqui

Este zip contém **apenas o módulo de Veículos completo**, novo, seguindo
o mesmo padrão do módulo de Clientes que vocês já construíram no projeto real.

Nada aqui foi extraído do seu projeto — é reconstrução baseada no que
conversamos. Por isso, antes de copiar qualquer coisa por cima do seu
projeto real, leia esta lista com atenção.

## Estrutura

```
sql/
  001_create_veiculos.sql        → rodar no SQL Editor do Supabase

src/features/veiculos/
  types/veiculo.ts
  schemas/veiculoSchema.ts
  services/veiculoService.ts     → inclui buscarVeiculoPorPlaca()
                                     (traz o dono junto, pra usar na tela de OS depois)
  hooks/useVeiculos.ts
  hooks/useVeiculoMutations.ts
  hooks/useVeiculoPorPlaca.ts
  components/VeiculoForm.tsx
  components/VeiculoModal.tsx
  pages/VeiculosList.tsx

REFERENCIA/
  adicionar-em-format.ts.txt         → função formatPlaca()
  useClientesParaSelect.ts.sugestao  → resolve o erro do useClientes()
```

## ⚠️ Antes de copiar pro seu projeto

1. **Copie a pasta `src/features/veiculos/` inteira** para o seu projeto —
   ela é nova, não existe conflito.

2. **NÃO copie nada da pasta `REFERENCIA/`** diretamente por cima de
   arquivos existentes. São arquivos de referência/sugestão:

   - `adicionar-em-format.ts.txt` → abra seu `src/utils/format.ts` real
     e cole só a função `formatPlaca` dentro dele, junto das outras
     (`formatCpfCnpj`, `formatPhone`, `formatCep`, `formatDate`).

   - `useClientesParaSelect.ts.sugestao` → resolve o erro
     `Expected 1 arguments, but got 0` que apareceu no `VeiculoForm`.
     Duas opções documentadas dentro do arquivo — a recomendada é criar
     um hook novo (`useClientesParaSelect.ts`) em vez de mexer no seu
     `useClientes.ts` que já está em uso na listagem de Clientes com
     paginação.

     Se for pela opção recomendada, ajuste esta linha em
     `VeiculoForm.tsx`:

     ```ts
     import { useClientes } from '@/features/clientes/hooks/useClientes'
     ```
     para:
     ```ts
     import { useClientesParaSelect } from '@/features/clientes/hooks/useClientesParaSelect'
     ```
     e troque a chamada `useClientes()` por `useClientesParaSelect()`
     dentro do componente.

3. **Rode o SQL** (`sql/001_create_veiculos.sql`) no Supabase antes de
   testar a tela.

4. **Plugue a rota** em `AppRoutes.tsx`:

   ```tsx
   import { VeiculosList } from '@/features/veiculos/pages/VeiculosList'
   ```
   e troque:
   ```tsx
   <Route path="/veiculos" element={<VeiculosList />} />
   ```

## Decisões de modelagem (por que a tabela ficou assim)

- **Sem `km_anterior`**: isso é histórico de atendimento (cada Ordem de
  Serviço grava o KM daquele momento). `km_atual` na tabela de veículos
  é só um cache, atualizado a cada nova OS — não duplica a fonte da
  verdade.
- **Sem `ordens_geradas`**: é dado derivado (`COUNT` das OS vinculadas),
  não deve virar coluna fixa — evita duas fontes de verdade
  dessincronizando.
- **Sem `restricao`**: no export do sistema legado, 100% dos registros
  vinham "Não informado" — campo morto, deixado de fora por ora.
- **Índice único de placa por oficina**: evita cadastrar o mesmo
  veículo duas vezes sem querer.
- **Placa aceita os dois formatos** (antigo `ABC1234`/`ABC-1234` e
  Mercosul `ABC1D23`), confirmado a partir do CSV real que vocês
  exportaram do sistema legado.

## Pendência para a próxima etapa (módulo de OS)

O `buscarVeiculoPorPlaca()` e o hook `useVeiculoPorPlaca()` já foram
feitos pensando no requisito que vocês marcaram: quando a tela de OS
buscar uma placa, o retorno já vem com os dados do cliente dono
embutidos (`VeiculoComCliente`), pronto pra popular o formulário da OS
automaticamente.
