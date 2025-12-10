import React from "react";
import { useApp } from "../context/AppContext";

export default function HighContrastToggle() {
  const { isHighContrast, toggleHighContrast, t } = useApp();

  return (
    <button
      className={`high-contrast-toggle ${isHighContrast ? "active" : ""}`}
      onClick={toggleHighContrast}
      aria-pressed={isHighContrast}
    >
      {isHighContrast ? t("Normal Contrast") : t("High Contrast")}
    </button>
  );
}
