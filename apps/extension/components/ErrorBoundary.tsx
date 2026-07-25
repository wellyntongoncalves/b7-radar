import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}
interface State {
  hasError: boolean;
}

/**
 * Isolates render failures so a broken panel never corrupts the host page.
 * Shows a friendly, actionable message instead of a blank/broken injection.
 */
export class ErrorBoundary extends Component<Props, State> {
  override state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  override componentDidCatch(_error: Error, _info: ErrorInfo): void {
    // Kept silent by default; a telemetry hook can land here later.
  }

  override render(): ReactNode {
    if (this.state.hasError) {
      return (
        <section className="b7-panel" role="complementary" aria-label="B7 Radar">
          <div className="b7-panel__body">
            <div className="b7-empty" role="alert">
              <strong>Não foi possível ler este anúncio</strong>
              <p>Recarregue a página ou clique em atualizar. Nenhum dado é exibido sem leitura confiável.</p>
            </div>
          </div>
        </section>
      );
    }
    return this.props.children;
  }
}
