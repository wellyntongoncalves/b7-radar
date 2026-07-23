import { ModulePlaceholder } from '../../components/ModulePlaceholder';
export default function Page() {
  return (
    <ModulePlaceholder
      title="B7 Radar"
      description="Análise de anúncios, categorias e vendedores; pesquisa e comparador."
      items={[
        'Análise de anúncio individual',
        'Pesquisa de produtos e por categoria',
        'Comparador e rankings',
        'Produtos salvos',
      ]}
    />
  );
}
