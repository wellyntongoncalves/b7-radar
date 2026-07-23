import { ModulePlaceholder } from '../../components/ModulePlaceholder';
export default function Page() {
  return (
    <ModulePlaceholder
      title="B7 Seller"
      description="Análise de vendedores: reputação, catálogo, logística e concentração."
      items={['Reputação e catálogo', 'Concentração de vendas', 'Logística', 'Comparação entre vendedores']}
    />
  );
}
