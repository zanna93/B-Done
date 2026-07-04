import type { WasteType } from "../../domain/models";
import { formatWasteName } from "../../domain/calendarEngine";

interface WasteBadgeProps {
  type: WasteType;
}

export function WasteBadge({ type }: WasteBadgeProps) {
  return (
    <span className="waste-badge" data-waste={type}>
      {formatWasteName(type)}
    </span>
  );
}
