import resinaImg from "../assets/reagenti/resina.png";
import RisorsaGruppo from "./RisorsaGruppo.jsx";

const META = {
  resina: { label: "Resina", img: resinaImg },
};

export default function ReagentiCard({ materiali }) {
  return <RisorsaGruppo titolo="Reagenti" categoria="reagente" materiali={materiali} meta={META} />;
}
