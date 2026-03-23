import quarzoImg    from "../assets/gemme/quarzo.png";
import oniceNeroImg from "../assets/gemme/onice_nero.png";
import RisorsaGruppo from "./RisorsaGruppo.jsx";

const META = {
  quarzo:     { label: "Quarzo",     img: quarzoImg    },
  onice_nero: { label: "Onice Nero", img: oniceNeroImg },
};

export default function GemmeCard({ materiali }) {
  return <RisorsaGruppo titolo="Gemme" categoria="gemma" materiali={materiali} meta={META} />;
}
