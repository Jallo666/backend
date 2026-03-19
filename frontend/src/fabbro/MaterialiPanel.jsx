import MaterialiCard  from "./MaterialiCard.jsx";
import GemmeCard      from "./GemmeCard.jsx";
import ReagentiCard   from "./ReagentiCard.jsx";

export default function MaterialiPanel({ materiali }) {
  if (!materiali || !materiali.length) return null;
  return (
    <div className="fab-materiali">
      <MaterialiCard  materiali={materiali} />
      <GemmeCard      materiali={materiali} />
      <ReagentiCard   materiali={materiali} />
    </div>
  );
}
