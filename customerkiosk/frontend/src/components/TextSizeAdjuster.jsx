import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";

function TextSizeAdjuster() {
  const { t } = useTranslation();
  const [textSize, setTextSize] = useState(1); // base multiplier
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Apply font size to root element
  useEffect(() => {
    document.documentElement.style.fontSize = `${textSize * 16}px`;
  }, [textSize]);

  const increaseText = () => {
    setTextSize((prev) => Math.min(prev + 0.1, 2)); // limit to 200%
  };

  const decreaseText = () => {
    setTextSize((prev) => Math.max(prev - 0.1, 0.8)); // limit to 80%
  };

  const resetText = () => {
    setTextSize(1);
  };

  const dropdownStyle = {
    position: "relative",
    display: "inline-block",
  };

  const buttonStyle = {
    padding: "10px 16px",
    fontSize: "14px",
    border: "2px solid #333",
    background: "white",
    cursor: "pointer",
    borderRadius: "4px",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  };

  const dropdownContentStyle = {
    display: isOpen ? "block" : "none",
    position: "absolute",
    backgroundColor: "white",
    minWidth: "200px",
    boxShadow: "0px 8px 16px 0px rgba(0,0,0,0.2)",
    zIndex: 1000,
    borderRadius: "4px",
    border: "2px solid #333",
    padding: "10px",
    top: "100%",
    left: 0,
    marginTop: "5px",
  };

  const controlButtonStyle = {
    margin: "5px",
    padding: "8px 16px",
    fontSize: "16px",
    border: "2px solid #333",
    background: "white",
    cursor: "pointer",
    borderRadius: "4px",
  };

  const labelStyle = {
    display: "block",
    textAlign: "center",
    marginBottom: "10px",
    fontSize: "14px",
    color: "#333",
  };

  const scaleStyle = {
    textAlign: "center",
    marginTop: "10px",
    fontSize: "12px",
    color: "#666",
  };

  return (
    <div className="text-size-adjuster" style={dropdownStyle} ref={dropdownRef}>
      <button
        className="text-size-main"
        style={buttonStyle}
        onClick={() => setIsOpen(!isOpen)}
      >
        <span>{t("Text Size")}</span>
        <span>{isOpen ? "▲" : "▼"}</span>
      </button>

      <div className="text-size-dropdown" style={dropdownContentStyle}>
        <span style={labelStyle}>{t("Adjust Text Size")}</span>
        <div style={{ textAlign: "center" }}>
          <button
            className="text-size-control"
            style={controlButtonStyle}
            onClick={decreaseText}
          >
            −
          </button>
          <button
            className="text-size-control"
            style={controlButtonStyle}
            onClick={increaseText}
          >
            +
          </button>
        </div>
        <div style={{ textAlign: "center" }}>
          <button
            className="text-size-control"
            style={controlButtonStyle}
            onClick={resetText}
          >
            {t("Reset")}
          </button>
        </div>
        <div style={scaleStyle}>
          {t("Current")}: {(textSize * 100).toFixed(0)}%
        </div>
      </div>
    </div>
  );
}

export default TextSizeAdjuster;
