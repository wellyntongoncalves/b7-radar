import { ModulePlaceholder } from '../../components/ModulePlaceholder';
export default function Page() {
  return (
    <ModulePlaceholder
      title="B7 Data"
      description="Relatórios, exportações, histórico e dashboards."
      items={['Relatórios', 'Exportações CSV/XLSX', 'Comparações', 'Dashboards personalizados']}
    />
  );
}
