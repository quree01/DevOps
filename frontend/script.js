// ==== TASK MANAGEMENT ====
const taskInput = document.getElementById('task-input');
const dueDateInput = document.getElementById('due-date-input');
const prioritySelect = document.getElementById('priority-select');
const addTaskBtn = document.getElementById('add-task-btn');
const taskList = document.getElementById('task-list');
const filterButtons = document.querySelectorAll('.filter-btn');
const clearCompletedBtn = document.getElementById('clear-completed-btn');
const taskCountDisplay = document.getElementById('task-count');

let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
let currentFilter = 'all';
let dragSrcEl = null;

// Utility Functions
function saveTasks() {
  localStorage.setItem('tasks', JSON.stringify(tasks));
}
function formatDate(date) {
  const d = new Date(date);
  if (isNaN(d)) return '';
  return d.toISOString().split('T')[0];
}
function isSameDay(d1, d2) {
  return d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate();
}
function isOverdue(dueDate) {
  if (!dueDate) return false;
  const today = new Date();
  const due = new Date(dueDate);
  return due < today && !isSameDay(due, today);
}
function placeCaretAtEnd(el) {
  el.focus();
  if (typeof window.getSelection !== "undefined" && typeof document.createRange !== "undefined") {
    const range = document.createRange();
    range.selectNodeContents(el);
    range.collapse(false);
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
  }
}

// Task Rendering
function renderTasks() {
  taskList.innerHTML = '';
  let filteredTasks = tasks;
  switch (currentFilter) {
    case 'active':
      filteredTasks = tasks.filter(t => !t.completed);
      break;
    case 'completed':
      filteredTasks = tasks.filter(t => t.completed);
      break;
    case 'overdue':
      filteredTasks = tasks.filter(t => !t.completed && isOverdue(t.dueDate));
      break;
  }
  filteredTasks.forEach((task, index) => {
    const li = document.createElement('li');
    li.setAttribute('draggable', 'true');
    li.dataset.index = index;
    li.className = task.completed ? 'completed' : '';

    // Drag and drop handlers
    li.addEventListener('dragstart', handleDragStart);
    li.addEventListener('dragover', handleDragOver);
    li.addEventListener('drop', handleDrop);
    li.addEventListener('dragend', handleDragEnd);

    // Priority indicator
    const priorityDot = document.createElement('span');
    priorityDot.className = `priority-indicator priority-${task.priority}`;

    // Task text (editable)
    const taskText = document.createElement('span');
    taskText.className = 'task-text';
    taskText.textContent = task.text;
    taskText.title = 'Click to edit';
    taskText.contentEditable = false;
    taskText.addEventListener('click', () => toggleComplete(index));
    taskText.addEventListener('dblclick', () => {
      taskText.contentEditable = true;
      taskText.focus();
      placeCaretAtEnd(taskText);
    });
    taskText.addEventListener('blur', () => {
      taskText.contentEditable = false;
      updateTaskText(index, taskText.textContent.trim());
    });
    taskText.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        taskText.blur();
      }
    });

    // Due date display
    const dueDateSpan = document.createElement('span');
    dueDateSpan.className = 'due-date';
    if (task.dueDate) {
      dueDateSpan.textContent = formatDate(task.dueDate);
      if (isOverdue(task.dueDate) && !task.completed) {
        dueDateSpan.classList.add('overdue');
      }
    } else {
      dueDateSpan.textContent = 'No due date';
      dueDateSpan.style.opacity = '0.6';
    }

    // Task meta container
    const metaDiv = document.createElement('div');
    metaDiv.className = 'task-meta';
    metaDiv.appendChild(priorityDot);
    metaDiv.appendChild(dueDateSpan);

    // Delete button
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete-btn';
    deleteBtn.innerHTML = '&times;';
    deleteBtn.title = 'Delete task';
    deleteBtn.addEventListener('click', () => deleteTask(index));

    li.appendChild(taskText);
    li.appendChild(metaDiv);
    li.appendChild(deleteBtn);
    taskList.appendChild(li);
  });
  updateTaskCount();
  refreshFocusTaskList();
}

// Task Actions
function addTask() {
  const text = taskInput.value.trim();
  if (text === '') {
    alert('Please enter a task description.');
    return;
  }
  const dueDate = dueDateInput.value ? dueDateInput.value : null;
  const priority = prioritySelect.value;
  tasks.push({ text, completed: false, dueDate, priority });
  saveTasks();
  renderTasks();
  taskInput.value = '';
  dueDateInput.value = '';
  prioritySelect.value = 'low';
  taskInput.focus();
}
function toggleComplete(index) {
  tasks[index].completed = !tasks[index].completed;
  saveTasks();
  renderTasks();
}
function updateTaskText(index, newText) {
  if (newText === '') {
    deleteTask(index);
  } else {
    tasks[index].text = newText;
    saveTasks();
    renderTasks();
  }
}
function deleteTask(index) {
  tasks.splice(index, 1);
  saveTasks();
  renderTasks();
}
function updateTaskCount() {
  const total = tasks.length;
  const completed = tasks.filter(t => t.completed).length;
  const active = total - completed;
  taskCountDisplay.textContent = `Total: ${total} | Active: ${active} | Completed: ${completed}`;
}

// Drag and Drop
function handleDragStart(e) {
  dragSrcEl = this;
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/html', this.innerHTML);
  this.classList.add('dragging');
}
function handleDragOver(e) {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
  return false;
}
function handleDrop(e) {
  e.stopPropagation();
  if (dragSrcEl !== this) {
    const srcIndex = parseInt(dragSrcEl.dataset.index, 10);
    const targetIndex = parseInt(this.dataset.index, 10);
    const [movedTask] = tasks.splice(srcIndex, 1);
    tasks.splice(targetIndex, 0, movedTask);
    saveTasks();
    renderTasks();
  }
  return false;
}
function handleDragEnd() {
  this.classList.remove('dragging');
}

// Filter Buttons
filterButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    filterButtons.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentFilter = btn.dataset.filter;
    renderTasks();
  });
});
clearCompletedBtn.addEventListener('click', () => {
  tasks = tasks.filter(t => !t.completed);
  saveTasks();
  renderTasks();
});
addTaskBtn.addEventListener('click', addTask);
taskInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') addTask();
});

// ==== FOCUS SESSION TIMER ====
const focusTaskSelect = document.getElementById('focus-task');
const timerDisplay = document.getElementById('timer-display');
const startBtn = document.getElementById('start-btn');
const pauseBtn = document.getElementById('pause-btn');
const resetBtn = document.getElementById('reset-btn');
const sessionCountSpan = document.getElementById('session-count');
const focusDurationInput = document.getElementById('focus-duration-input');
const shortBreakInput = document.getElementById('short-break-input');
const longBreakInput = document.getElementById('long-break-input');
const musicToggleBtn = document.getElementById('music-toggle-btn');
const backgroundMusic = document.getElementById('background-music');

const soundStart = new Audio('https://actions.google.com/sounds/v1/cartoon/clang_and_wobble.ogg');
const soundEnd = new Audio('https://actions.google.com/sounds/v1/alarms/alarm_clock.ogg');

let focusDuration = 25 * 60;
let breakDuration = 5 * 60;
let longBreakDuration = 15 * 60;
let timer = focusDuration;
let timerInterval = null;
let isRunning = false;
let sessionCount = 0;
let isFocusTime = true;
let completedPomodoros = 0;

// Focus Task Selector
function populateFocusTasks() {
  focusTaskSelect.innerHTML = '<option value="">-- No task selected --</option>';
  tasks.forEach((task, index) => {
    const option = document.createElement('option');
    option.value = index;
    option.textContent = task.text.length > 40 ? task.text.slice(0, 37) + '...' : task.text;
    focusTaskSelect.appendChild(option);
  });
}
function refreshFocusTaskList() {
  populateFocusTasks();
}

// Timer Functions
function formatTime(seconds) {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}
function updateTimerDisplay() {
  timerDisplay.textContent = formatTime(timer);
}
function updateDurations() {
  focusDuration = parseInt(focusDurationInput.value, 10) * 60 || 1500;
  breakDuration = parseInt(shortBreakInput.value, 10) * 60 || 300;
  longBreakDuration = parseInt(longBreakInput.value, 10) * 60 || 900;
  if (!isRunning) {
    timer = isFocusTime ? focusDuration : (completedPomodoros % 4 === 0 ? longBreakDuration : breakDuration);
    updateTimerDisplay();
  }
}
function playSound(sound) {
  sound.pause();
  sound.currentTime = 0;
  sound.play();
}
function timerTick() {
  if (timer > 0) {
    timer--;
    updateTimerDisplay();
  } else {
    clearInterval(timerInterval);
    isRunning = false;
    startBtn.disabled = false;
    pauseBtn.disabled = true;
    resetBtn.disabled = false;
    if (isFocusTime) {
      playSound(soundEnd);
      completedPomodoros++;
      sessionCount++;
      sessionCountSpan.textContent = `Sessions completed: ${sessionCount}`;
      const selectedTaskIndex = focusTaskSelect.value;
      if (selectedTaskIndex !== '') {
        tasks[selectedTaskIndex].completed = true;
        saveTasks();
        renderTasks();
      }
      isFocusTime = false;
      timer = (completedPomodoros % 4 === 0) ? longBreakDuration : breakDuration;
      alert('Focus session ended! Time for a break.');
      if (!backgroundMusic.paused) backgroundMusic.pause();
    } else {
      playSound(soundStart);
      isFocusTime = true;
      timer = focusDuration;
      alert('Break over! Ready for another focus session?');
      if (musicToggleBtn.dataset.playing === 'true') backgroundMusic.play();
    }
    updateTimerDisplay();
  }
}
function startTimer() {
  if (isRunning) return;
  isRunning = true;
  startBtn.disabled = true;
  pauseBtn.disabled = false;
  resetBtn.disabled = false;
  playSound(soundStart);
  if (musicToggleBtn.dataset.playing === 'true' && isFocusTime) backgroundMusic.play();
  timerInterval = setInterval(timerTick, 1000);
}
function pauseTimer() {
  if (!isRunning) return;
  isRunning = false;
  clearInterval(timerInterval);
  startBtn.disabled = false;
  pauseBtn.disabled = true;
  backgroundMusic.pause();
}
function resetTimer() {
  clearInterval(timerInterval);
  isRunning = false;
  timer = isFocusTime ? focusDuration : (completedPomodoros % 4 === 0 ? longBreakDuration : breakDuration);
  updateTimerDisplay();
  startBtn.disabled = false;
  pauseBtn.disabled = true;
  resetBtn.disabled = true;
  backgroundMusic.pause();
}

// Music Controls
musicToggleBtn.dataset.playing = 'false';
musicToggleBtn.addEventListener('click', () => {
  if (musicToggleBtn.dataset.playing === 'false') {
    backgroundMusic.play();
    musicToggleBtn.textContent = 'Pause Music';
    musicToggleBtn.dataset.playing = 'true';
  } else {
    backgroundMusic.pause();
    musicToggleBtn.textContent = 'Play Music';
    musicToggleBtn.dataset.playing = 'false';
  }
});

// Timer Settings Inputs
focusDurationInput.addEventListener('change', updateDurations);
shortBreakInput.addEventListener('change', updateDurations);
longBreakInput.addEventListener('change', updateDurations);

// Timer Controls
startBtn.addEventListener('click', startTimer);
pauseBtn.addEventListener('click', pauseTimer);
resetBtn.addEventListener('click', resetTimer);

// Analytics Tracking (basic example)
function trackEvent(eventName, data = {}) {
  // Replace with real analytics integration if needed
  // console.log(`[Analytics] Event: ${eventName}`, data);
}
startBtn.addEventListener('click', () => {
  trackEvent('focus_session_started', {
    taskIndex: focusTaskSelect.value || null,
    duration: timer,
  });
});
pauseBtn.addEventListener('click', () => {
  trackEvent('focus_session_paused', { remainingTime: timer });
});
resetBtn.addEventListener('click', () => {
  trackEvent('focus_session_reset');
});

// ==== INITIALIZATION ====
renderTasks();
populateFocusTasks();
updateTimerDisplay();
sessionCountSpan.textContent = `Sessions completed: ${sessionCount}`;
updateDurations();
