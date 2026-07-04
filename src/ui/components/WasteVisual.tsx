import type { WasteType } from "../../domain/models";
import { assetPath } from "../../utils/assets";

const WASTE_PLACEHOLDER: Record<WasteType, string> = {
  organico: "ORG",
  carta: "CAR",
  plastica: "PLA",
  vetro: "VET",
  secco: "SEC",
  indifferenziato: "IND",
};

const WASTE_ICON_PATH: Partial<Record<WasteType, string>> = {
  organico: "icons/waste/organico.png",
  carta: "icons/waste/carta.png",
  plastica: "icons/waste/plastica.png",
  vetro: "icons/waste/vetro.png",
  secco: "icons/waste/secco.png",
  indifferenziato: "icons/waste/secco.png",
};

interface WasteVisualGroupProps {
  wasteTypes: WasteType[];
  compact?: boolean;
}

export function WasteVisualGroup({ wasteTypes, compact = false }: WasteVisualGroupProps) {
  if (wasteTypes.length <= 1) return <WasteVisual waste={wasteTypes[0]} compact={compact} />;

  return (
    <span className={`waste-visual-group ${compact ? "waste-visual-group--compact" : ""}`} aria-hidden="true">
      {wasteTypes.map((waste) => (
        <WasteVisual key={waste} waste={waste} compact={compact} />
      ))}
    </span>
  );
}

function WasteVisual({ waste, compact = false }: { waste?: WasteType; compact?: boolean }) {
  const iconPath = waste ? WASTE_ICON_PATH[waste] : undefined;
  const iconSrc = iconPath ? assetPath(iconPath) : undefined;
  const label = waste ? WASTE_PLACEHOLDER[waste] : "BD";

  return (
    <span className={`waste-hero ${compact ? "waste-hero--compact" : ""}`} aria-hidden="true">
      {iconSrc ? <img src={iconSrc} alt="" /> : <span>{label}</span>}
    </span>
  );
}
