import PannelloLista from "../components/PannelloLista.jsx";
import RisorsaItemCard from "./RisorsaItemCard.jsx";

export default function RisorsaGruppo({ titolo, categoria, materiali, meta }) {
  const items = materiali.filter(m => m.categoria === categoria);
  return (
    <PannelloLista
      className="risorsa-pannello"
      titolo={titolo}
      items={items}
      filterFn={(m, q) => (meta[m.tipo]?.label ?? m.tipo).toLowerCase().includes(q.toLowerCase())}
      renderItem={m => <RisorsaItemCard key={m.tipo} risorsa={m} meta={meta[m.tipo] ?? {}} />}
    />
  );
}
