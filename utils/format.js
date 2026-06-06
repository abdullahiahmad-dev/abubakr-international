// utils/format.js
function ordinalSuffix(num) {
  if (num === null || num === undefined || isNaN(num)) return "";
  const n = Number(num);
  const j = n % 10, k = n % 100;
  if (j === 1 && k !== 11) return n + "st";
  if (j === 2 && k !== 12) return n + "nd";
  if (j === 3 && k !== 13) return n + "rd";
  return n + "th";
}

const conductRemarks = {
  A: [
    "Excellent work, keep it up!",
    "Outstanding performance.",
    "Brilliant result, well done."
  ],
  B: [
    "Very good effort.",
    "Strong performance, aim higher.",
    "Commendable result."
  ],
  C: [
    "Fair performance, can improve.",
    "Satisfactory, work harder.",
    "Good, but more effort needed."
  ],
  D: [
    "Just a pass, try harder.",
    "Below average, improve next term.",
    "Needs more concentration."
  ],
  E: [
    "Weak result, must improve.",
    "Poor performance, double effort.",
    "Serious improvement required."
  ],
  F: [
    "Very poor, must work harder.",
    "Failure, not encouraging.",
    "Needs maximum effort to improve."
  ]
};

function pickRemark(grade) {
  const arr = conductRemarks[String(grade)] || ["-"];
  return arr[Math.floor(Math.random() * arr.length)];
}

module.exports = { ordinalSuffix, pickRemark, conductRemarks };
