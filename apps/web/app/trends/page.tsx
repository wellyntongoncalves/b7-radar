import { ModulePlaceholder } from '../../components/ModulePlaceholder';
export default function Page() {
  return (
    <ModulePlaceholder
      title="B7 Trends"
      description="Tendências, categorias em crescimento e oportunidades."
      items={['Categorias em crescimento', 'Novos produtos', 'Sazonalidade', 'Evolução de demanda']}
    />
  );
}
