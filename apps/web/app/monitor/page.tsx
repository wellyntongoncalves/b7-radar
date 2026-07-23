import { ModulePlaceholder } from '../../components/ModulePlaceholder';
export default function Page() {
  return (
    <ModulePlaceholder
      title="B7 Monitor"
      description="Monitoramento, snapshots, histórico e alertas."
      items={[
        'Itens monitorados',
        'Histórico de preço, vendas estimadas e estoque',
        'Alertas e alterações de concorrentes',
        'Snapshots periódicos (sem coleta agressiva)',
      ]}
    />
  );
}
