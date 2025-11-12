import { useState } from "react";

function TextSizeAdjuster() {
  const [textSize, setTextSize] = useState(1); // base multiplier

  const increaseText = () => {
    setTextSize((prev) => Math.min(prev + 0.1, 2)); // limit to 200%
  };

  const decreaseText = () => {
    setTextSize((prev) => Math.max(prev - 0.1, 0.8)); // limit to 80%
  };

  const resetText = () => {
    setTextSize(1);
  };

  const containerStyle = {
    fontSize: `${textSize}em`,
    textAlign: "center",
    padding: "40px",
  };

  const buttonStyle = {
    margin: "10px",
    padding: "10px 20px",
    fontSize: "1em",
    border: "2px solid #333",
    background: "white",
    cursor: "pointer",
  };

  return (
    <div style={containerStyle}>
      <h1>Adjustable Text Size Example</h1>
      <p>
        This text will get larger or smaller when you press the + or − buttons
        below.
      </p>
      <div>
        <button style={buttonStyle} onClick={decreaseText}>
          −
        </button>
        <button style={buttonStyle} onClick={resetText}>
          Reset
        </button>
        <button style={buttonStyle} onClick={increaseText}>
          +
        </button>
      </div>
      <p style={{ marginTop: "20px", fontSize: "0.9em", color: "#666" }}>
        Current scale: {textSize.toFixed(1)}×
      </p>
    </div>
  );
}

export default TextSizeAdjuster;
