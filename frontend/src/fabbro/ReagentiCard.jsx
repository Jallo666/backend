import resinaImg    from "../assets/reagenti/resina.png";
import farinaOssaImg from "../assets/reagenti/farina_ossa.png";
import RisorsaGruppo from "./RisorsaGruppo.jsx";

const META = {
  resina:      { label: "Resina",       img: resinaImg    },
  farina_ossa: { label: "Farina d'Ossa", img: farinaOssaImg },
};

export default function ReagentiCard({ materiali }) {
  return <RisorsaGruppo titolo="Reagenti" categoria="reagente" materiali={materiali} meta={META} />;
}
