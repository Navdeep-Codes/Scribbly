const canvas = document.getElementById("noteCanvas");
const ctx = canvas.getContext("2d");

let drawing = false;

canvas.addEventListener("mousedown", (e) => {
  drawing = true;
  ctx.beginPath();
  ctx.moveTo(e.offsetX, e.offsetY);
});

canvas.addEventListener("mousemove", (e) => {
  if (!drawing) return;
  ctx.lineTo(e.offsetX, e.offsetY);
  ctx.strokeStyle = "#111";
  ctx.lineWidth = 2;
  ctx.lineCap = "round";
  ctx.stroke();
});

canvas.addEventListener("mouseup", () => {
  drawing = false;
  ctx.closePath();
});

canvas.addEventListener("mouseout", () => {
  drawing = false;
  ctx.closePath();
});

document.getElementById("clearCanvas").addEventListener("click", () => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
});

document.getElementById("saveCanvas").addEventListener("click", () => {
  const dataURL = canvas.toDataURL("image/png");
  const link = document.createElement("a");
  link.href = dataURL;
  link.download = "notive-note.png";
  link.click();
});
document.getElementById("convertText").addEventListener("click", () => {
  const output = document.getElementById("textOutput");
  output.value = "Processing...";

  Tesseract.recognize(
    canvas.toDataURL("image/png"),
    'eng',
    {
      logger: m => console.log(m) // Optional: shows progress
    }
  ).then(({ data: { text } }) => {
    output.value = text.trim() || "(No readable text found)";
  }).catch(err => {
    output.value = "Error recognizing text.";
    console.error(err);
  });
});

