import legnaImg from "../assets/materiali/legna.png";
import RisorsaGruppo from "./RisorsaGruppo.jsx";

const META = {
  legna: { label: "Legna", img: legnaImg },
};

export default function MaterialiCard({ materiali }) {
  return <RisorsaGruppo titolo="Materiali" categoria="materiale" materiali={materiali} meta={META} />;
}
