const titleInput = document.getElementById("noteTitle");
const contentInput = document.getElementById("noteContent");
const saveBtn = document.getElementById("saveNote");
const notesList = document.getElementById("notesList");

// Load from localStorage on page load
window.onload = function () {
  loadNotes();
};

saveBtn.addEventListener("click", () => {
  const title = titleInput.value.trim();
  const content = contentInput.value.trim();

  if (!title || !content) {
    alert("Please enter both a title and some content.");
    return;
  }

  const notes = JSON.parse(localStorage.getItem("notes")) || [];
  notes.push({ title, content });
  localStorage.setItem("notes", JSON.stringify(notes));

  titleInput.value = "";
  contentInput.value = "";
  loadNotes();
});

function loadNotes() {
  const notes = JSON.parse(localStorage.getItem("notes")) || [];
  notesList.innerHTML = "";

  notes.forEach((note, index) => {
    const li = document.createElement("li");
    li.textContent = note.title;
    li.onclick = () => {
      titleInput.value = note.title;
      contentInput.value = note.content;
    };
    notesList.appendChild(li);
  });
}
