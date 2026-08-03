interface ItemToggle {
  id: string
  rotulo: string
  ativo: boolean
}

interface ListaDeTogglesProps {
  itens: ItemToggle[]
  onAlternar: (id: string, ativo: boolean) => void
  desabilitado?: boolean
}

export function ListaDeToggles({ itens, onAlternar, desabilitado }: ListaDeTogglesProps) {
  return (
    <div className="border rounded-lg divide-y">
      {itens.map((item) => (
        <label key={item.id} className="flex items-center justify-between px-4 py-3 text-sm cursor-pointer">
          <span>{item.rotulo}</span>
          <input
            type="checkbox"
            checked={item.ativo}
            disabled={desabilitado}
            onChange={(e) => onAlternar(item.id, e.target.checked)}
            className="h-4 w-4"
          />
        </label>
      ))}
    </div>
  )
}
