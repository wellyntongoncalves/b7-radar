import { ModulePlaceholder } from '../../components/ModulePlaceholder';
export default function Page() {
  return (
    <ModulePlaceholder
      title="Preferências"
      description="Perfil, workspace, integrações, custos, impostos, privacidade e segurança."
      items={['Perfil e workspace', 'Integrações (OAuth marketplace)', 'Custos e impostos', 'Privacidade e LGPD (exportar/excluir)']}
    />
  );
}
