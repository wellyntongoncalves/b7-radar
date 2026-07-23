import { MargemCalculator } from '../../components/MargemCalculator';

export default function MargemPage() {
  return (
    <>
      <h1 className="b7-page-title">B7 Margem</h1>
      <p className="b7-page-sub">
        Margem de contribuição, ROI e ponto de equilíbrio. Compare anúncio clássico e premium.
      </p>
      <MargemCalculator />
    </>
  );
}
