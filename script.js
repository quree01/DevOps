const input = document.getElementById('todo-input');
const list = document.getElementById('todo-list');

// Add task on Enter key
input.addEventListener('keypress', function(event) {
    if (event.key === 'Enter' && input.value.trim() !== '') {
        addTodo(input.value.trim());
        input.value = '';
    }
});

// Add task function
function addTodo(task) {
    const li = document.createElement('li');
    li.textContent = task;

    // Mark as completed on click
    li.addEventListener('click', function() {
        li.classList.toggle('completed');
    });

    // Delete button
    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = 'Delete';
    deleteBtn.onclick = function(event) {
        event.stopPropagation(); // Prevent li click event
        list.removeChild(li);
    };

    li.appendChild(deleteBtn);
    list.appendChild(li);
}
