// script.js

// Example: change text size
const increaseBtn = document.querySelector(
  ".size-controls button:nth-child(1)"
);
const decreaseBtn = document.querySelector(
  ".size-controls button:nth-child(2)"
);
const root = document.querySelector(":root");

let textSize = 1; // base multiplier

increaseBtn.addEventListener("click", () => {
  textSize += 0.1;
  document.body.style.fontSize = `${textSize}em`;
});

decreaseBtn.addEventListener("click", () => {
  textSize = Math.max(0.8, textSize - 0.1);
  document.body.style.fontSize = `${textSize}em`;
});

// Example: language switch (demo)
document.querySelector(".top-left").addEventListener("click", () => {
  alert("Language options coming soon!");
});

// Example: place order
document.querySelector(".place-order").addEventListener("click", () => {
  alert("Order placed!");
});
