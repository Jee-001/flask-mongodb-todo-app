document.addEventListener('DOMContentLoaded', function() {
    const todoInput = document.getElementById('todoInput');
    const addBtn = document.getElementById('addBtn');
    const todoList = document.getElementById('todoList');
    const clearAllBtn = document.getElementById('clearAllBtn');
    const taskCount = document.getElementById('taskCount');
    
    // Load tasks when page loads
    fetchTasks();
    
    // Event listeners
    addBtn.addEventListener('click', addTask);
    todoInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') addTask();
    });
    clearAllBtn.addEventListener('click', clearAllTasks);
    
    // Fetch tasks from server
    function fetchTasks() {
        fetch('/api/tasks')
            .then(response => response.json())
            .then(tasks => renderTasks(tasks))
            .catch(error => console.error('Error:', error));
    }
    
    // Add new task
    function addTask() {
        const taskText = todoInput.value.trim();
        if (taskText) {
            fetch('/api/tasks', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ text: taskText })
            })
            .then(response => response.json())
            .then(() => {
                todoInput.value = '';
                fetchTasks();
            })
            .catch(error => console.error('Error:', error));
        }
    }
    function addTask() {
        const taskText = todoInput.value.trim();
        if (taskText) {
            fetch('/api/tasks', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ text: taskText })
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(() => {
                todoInput.value = '';
                fetchTasks(); // Refresh the list
            })
            .catch(error => {
                console.error('Error:', error);
                alert('Failed to add task: ' + error.message);
            });
        }
    }
    
    // Render tasks
    function renderTasks(tasks) {
        todoList.innerHTML = '';
        
        if (tasks.length === 0) {
            todoList.innerHTML = '<li class="list-group-item text-center text-muted">No tasks yet. Add one above!</li>';
            taskCount.textContent = '0 tasks remaining';
            clearAllBtn.disabled = true;
            return;
        }
        
        clearAllBtn.disabled = false;
        
        const incompleteTasks = tasks.filter(task => !task.completed).length;
        taskCount.textContent = `${incompleteTasks} ${incompleteTasks === 1 ? 'task' : 'tasks'} remaining`;
        
        tasks.forEach(task => {
            const li = document.createElement('li');
            li.className = `list-group-item ${task.completed ? 'completed' : ''}`;
            li.dataset.id = task._id;
            
            li.innerHTML = `
                <span>${task.text}</span>
                <div class="task-actions">
                    <button class="btn btn-sm ${task.completed ? 'btn-warning' : 'btn-success'} complete-btn">
                        <i class="fas ${task.completed ? 'fa-undo' : 'fa-check'}"></i>
                    </button>
                    <button class="btn btn-sm btn-danger delete-btn">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
            
            todoList.appendChild(li);
        });
    }
    
    // Clear all tasks
    function clearAllTasks() {
        if (confirm('Are you sure you want to delete all tasks?')) {
            fetch('/api/tasks/clear', {
                method: 'DELETE'
            })
            .then(() => fetchTasks())
            .catch(error => console.error('Error:', error));
        }
    }
    
    // Event delegation for dynamic buttons
    todoList.addEventListener('click', function(e) {
        const target = e.target.closest('button');
        if (!target) return;
        
        const li = target.closest('li');
        const taskId = li.dataset.id;
        
        if (target.classList.contains('complete-btn')) {
            const isCompleted = li.classList.contains('completed');
            fetch(`/api/tasks/${taskId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ completed: !isCompleted })
            })
            .then(() => fetchTasks())
            .catch(error => console.error('Error:', error));
        } else if (target.classList.contains('delete-btn')) {
            fetch(`/api/tasks/${taskId}`, {
                method: 'DELETE'
            })
            .then(() => fetchTasks())
            .catch(error => console.error('Error:', error));
        }
    });
});