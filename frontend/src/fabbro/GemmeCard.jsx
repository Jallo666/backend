import quarzoImg from "../assets/gemme/quarzo.png";
import RisorsaGruppo from "./RisorsaGruppo.jsx";

const META = {
  quarzo: { label: "Quarzo", img: quarzoImg },
};

export default function GemmeCard({ materiali }) {
  return <RisorsaGruppo titolo="Gemme" categoria="gemma" materiali={materiali} meta={META} />;
}
