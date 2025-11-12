import { useState } from "react";

export default function TextReaderButton() {
  const [isReading, setIsReading] = useState(false);

  const handleClick = () => {
    // just toggles state for now
    setIsReading((prev) => !prev);

    // optional fake functionality (for looks)
    if (!isReading) {
      console.log("🔊 Starting text reader...");
    } else {
      console.log("⏹️ Stopping text reader...");
    }
  };

  return (
    <button
      className="text-reader-btn"
      onClick={handleClick}
      style={{
        padding: "8px 14px",
        borderRadius: "6px",
        backgroundColor: isReading ? "#4caf50" : "#007bff",
        color: "white",
        border: "none",
        cursor: "pointer",
        transition: "background-color 0.2s ease",
        fontSize: "0.95rem",
      }}
    >
      {isReading ? "Stop Reading" : "Read Text Aloud"}
    </button>
  );
}
