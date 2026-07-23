// Dashboard. KPIs are placeholders until a backend/sync feeds real, classified
// data — every card here will carry origin + confidence once wired.
const KPIS = [
  { label: 'Produtos monitorados', value: '—', hint: 'Conecte o B7 Monitor' },
  { label: 'Alertas recentes', value: '—', hint: 'Nenhum alerta ainda' },
  { label: 'Oportunidades', value: '—', hint: 'B7 Opportunity Score' },
  { label: 'Cálculos salvos', value: '—', hint: 'B7 Margem' },
];

export default function DashboardPage() {
  return (
    <>
      <h1 className="b7-page-title">Visão geral</h1>
      <p className="b7-page-sub">Dados organizados. Decisões mais fortes.</p>

      <div className="b7-grid b7-grid--kpi">
        {KPIS.map((k) => (
          <div className="b7-card" key={k.label}>
            <div className="b7-kpi__label">{k.label}</div>
            <div className="b7-kpi__value">{k.value}</div>
            <div className="b7-kpi__hint">{k.hint}</div>
          </div>
        ))}
      </div>

      <div className="b7-card" style={{ marginTop: 16 }}>
        <h2>Bem-vindo à B7 Radar</h2>
        <p style={{ color: 'var(--b7-text-muted)', lineHeight: 1.6 }}>
          Instale a extensão para analisar anúncios do Mercado Livre no contexto, com métricas
          rotuladas por origem e confiança. Use o <strong>B7 Margem</strong> para precificar com
          segurança. Nenhum valor é apresentado como exato quando é estimativa — a origem e a
          confiança de cada número ficam sempre visíveis.
        </p>
      </div>

      <p className="b7-disclaimer">
        Os indicadores acima ficam vazios até que o monitoramento e a sincronização sejam
        ativados. A B7 Radar não inventa dados: ausência é mostrada como “indisponível”.
      </p>
    </>
  );
}
