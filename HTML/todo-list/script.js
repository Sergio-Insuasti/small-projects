const inputBox = document.getElementById("input-box");
const listContainer = document.getElementById("list-container");
const completedCounter = document.getElementById("completed-counter");
const uncompletedCounter = document.getElementById("uncompleted-counter");

function updateCounters() {
  const completedTasks = listContainer.querySelectorAll("li.completed").length;
  const totalTasks = listContainer.querySelectorAll("li").length;
  const uncompletedTasks = totalTasks - completedTasks;

  completedCounter.textContent = completedTasks;
  uncompletedCounter.textContent = uncompletedTasks;
}

function createTaskElement(text) {
  const li = document.createElement("li");

  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";

  const span = document.createElement("span");
  span.textContent = text;

  const editBtn = document.createElement("button");
  editBtn.className = "edit-btn";
  editBtn.textContent = "Edit";

  const deleteBtn = document.createElement("button");
  deleteBtn.className = "delete-btn";
  deleteBtn.textContent = "Delete";

  li.appendChild(checkbox);
  li.appendChild(span);
  li.appendChild(editBtn);
  li.appendChild(deleteBtn);

  checkbox.addEventListener("change", () => {
    li.classList.toggle("completed", checkbox.checked);
    updateCounters();
  });

  editBtn.addEventListener("click", () => {
    const current = span.textContent;
    const next = prompt("Edit task:", current);
    if (next !== null) {
      const trimmed = next.trim();
      if (trimmed.length > 0) {
        span.textContent = trimmed;
      }
    }
  });

  deleteBtn.addEventListener("click", () => {
    if (confirm("Delete this task?")) {
      li.remove();
      updateCounters();
    }
  });

  return li;
}

function addTask() {
  const task = inputBox.value.trim();
  if (!task) {
    alert("Please write down a task");
    return;
  }
  const li = createTaskElement(task);
  listContainer.appendChild(li);
  inputBox.value = "";
  updateCounters();
}

// Also allow Enter key to add
inputBox.addEventListener("keydown", (e) => {
  if (e.key === "Enter") addTask();
});
