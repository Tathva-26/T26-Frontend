import { useMemo } from "react";
import { useElementSize } from "@/hooks/useElementSize";
import { STAGE, STACKED_MAX_ASPECT } from "@/pageComponents/GPC/gpcConfig";

/**
 * Picks the hero layout from the shape of the section itself, not from the
 * viewport width:
 *   "stage"   - landscape space (desktops, landscape phones and tablets):
 *               the Figma-size Stage, scaled by `scale` to fit.
 *   "stacked" - portrait space (phones and tablets held upright).
 * Returns null until the section has been measured.
 */
export function useGpcLayout(sectionRef) {
  const size = useElementSize(sectionRef);

  return useMemo(() => {
    if (!size || size.width <= 0 || size.height <= 0) return null;
    if (size.width / size.height <= STACKED_MAX_ASPECT) return { mode: "stacked", scale: 1 };
    return { mode: "stage", scale: Math.min(size.width / STAGE.width, size.height / STAGE.height) };
  }, [size]);
}
