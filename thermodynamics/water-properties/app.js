const API =
  "https://api.easytechcalculators.com/water/state";
// or use Render URL if no custom domain yet

async function solve() {
  const body = {
    input1_name: document.getElementById("i1n").value,
    input1_value: parseFloat(document.getElementById("i1v").value),
    input2_name: document.getElementById("i2n").value,
    input2_value: parseFloat(document.getElementById("i2v").value)
  };

  const res = await fetch(API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });

  const data = await res.json();
  document.getElementById("output").textContent =
    JSON.stringify(data, null, 2);
}
