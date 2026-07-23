export function ModulePlaceholder({
  title,
  description,
  items,
}: {
  title: string;
  description: string;
  items: string[];
}) {
  return (
    <>
      <h1 className="b7-page-title">{title}</h1>
      <p className="b7-page-sub">{description}</p>
      <div className="b7-card">
        <h2>Em construção</h2>
        <ul style={{ color: 'var(--b7-text-muted)', lineHeight: 1.9, margin: 0 }}>
          {items.map((i) => (
            <li key={i}>{i}</li>
          ))}
        </ul>
      </div>
    </>
  );
}
