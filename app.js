document.addEventListener('DOMContentLoaded', () => {
    const taskManager = {
        tasks: [],
        elements: {
            columns: {
                todo: document.getElementById('todo'),
                progress: document.getElementById('progress'),
                done: document.getElementById('done')
            },
            addTaskButtons: document.querySelectorAll('.add__task'),
            modal: document.querySelector('.modal'),
            modalBackground: document.querySelector('.modal-background'),
            modalForm: document.querySelector('.modal-form'),
            taskTitle: document.getElementById('taskTitle'),
            taskDescription: document.getElementById('taskDescription'),
            taskDeadline: document.getElementById('taskDeadline'),
            taskStatus: document.getElementById('taskStatus'),
            closeBtn: document.querySelector('.btn-close'),
            cancelBtn: document.querySelector('.btn-cancel'),
            saveBtn: document.querySelector('.btn-save')
        }
    };

    initializeTaskManager(taskManager);
});

// INIT
function initializeTaskManager(taskManager) {
    renderTasks(taskManager);
    setupEventListeners(taskManager);
}

// RENDER TASK
function renderTasks(taskManager) {
    Object.values(taskManager.elements.columns).forEach(column => {
        column.querySelectorAll('.task').forEach(task => task.remove());
    });

    taskManager.tasks.forEach(task => {
        const column = taskManager.elements.columns[task.status];
        const addTaskButton = column.querySelector('.add__task');
        if (column) {
            const taskElement = createTaskElement(taskManager, task);
            column.insertBefore(taskElement, addTaskButton);
        }
    });

    updateCounters(taskManager);
}

// CREATE TASK
function createTaskElement(taskManager, task) {
    const taskElement = document.createElement('div');
    taskElement.className = 'task';
    taskElement.dataset.taskId = task.id;

    taskElement.innerHTML = `
        <h3>${task.title}</h3>
        ${task.description ? `<p>${task.description}</p>` : ''}
        <small>Deadline: ${task.deadline || 'No due date'}</small>
        <div class="task-actions">
            <button class="btn edit-btn">Edit</button>
            <button class="btn delete-btn">Delete</button>
        </div>
    `;

    const editButton = taskElement.querySelector('.edit-btn');
    const deleteButton = taskElement.querySelector('.delete-btn');

    // Add event listeners for EDIT and DELETE buttons
    editButton.addEventListener('click', () => openTaskModal(taskManager, task));
    deleteButton.addEventListener('click', () => deleteTask(taskManager, task.id));

    return taskElement;
}

// OPEN THE FORM MODAL
function openTaskModal(taskManager, task = null) {
    if (task) {
        taskManager.elements.taskTitle.value = task.title;
        taskManager.elements.taskDescription.value = task.description || '';
        taskManager.elements.taskDeadline.value = task.deadline || '';
        taskManager.elements.taskStatus.value = task.status;
        taskManager.elements.modalForm.dataset.taskId = task.id;
    } else {
        taskManager.elements.taskTitle.value = '';
        taskManager.elements.taskDescription.value = '';
        taskManager.elements.taskDeadline.value =  '';
        taskManager.elements.taskStatus.value = 'todo';
        delete taskManager.elements.modalForm.dataset.taskId;
    }

    taskManager.elements.modal.style.display = 'block';
    taskManager.elements.modalBackground.style.display = 'block';
}

// CLOSE THE FORM MODAL
function closeTaskModal(taskManager) {
    taskManager.elements.modal.style.display = 'none';
    taskManager.elements.modalBackground.style.display = 'none';
    taskManager.elements.modalForm.reset();
}

// FORM SUBMIT
function handleFormSubmit(taskManager) {
    const taskTitle = taskManager.elements.taskTitle.value.trim();
    const taskDescription = taskManager.elements.taskDescription.value.trim();
    const taskDeadline = taskManager.elements.taskDeadline.value;
    const taskStatus = taskManager.elements.taskStatus.value;
    const taskId = taskManager.elements.modalForm.dataset.taskId;

    if (!taskTitle) {
        alert('Task title is required');
        return;
    }

    const task = {
        id: taskId || Date.now().toString(),
        title: taskTitle,
        description: taskDescription,
        deadline: taskDeadline || 'No due date',
        status: taskStatus
    };

    if (taskId) {
        updateTask(taskManager, task);
    } else {
        addTask(taskManager, task);
    }

    renderTasks(taskManager);
    closeTaskModal(taskManager);
}

// ADD
function addTask(taskManager, task) {
    taskManager.tasks.push(task);
}

// UPDATE TASK
function updateTask(taskManager, task) {
    const taskIndex = taskManager.tasks.findIndex(t => t.id === task.id);
    if (taskIndex !== -1) {
        taskManager.tasks[taskIndex] = task;
    }
}

// DELETE
function deleteTask(taskManager, taskId) {
    if (confirm('Do you want to delete this task?')) {
        taskManager.tasks = taskManager.tasks.filter(task => task.id !== taskId);
        renderTasks(taskManager);
    }
}

// UPDATE NUMBER COUNTERS
function updateCounters(taskManager) {
    const todoCount = taskManager.elements.columns.todo.querySelectorAll('.task').length;
    const progressCount = taskManager.elements.columns.progress.querySelectorAll('.task').length;
    const doneCount = taskManager.elements.columns.done.querySelectorAll('.task').length;

    document.getElementById('totalTasks').textContent = taskManager.tasks.length;
    document.getElementById('completedTasks').textContent = doneCount;
    document.getElementById('inProgressTasks').textContent = progressCount;

    document.querySelector('#todo .column__number').textContent = todoCount;
    document.querySelector('#progress .column__number').textContent = progressCount;
    document.querySelector('#done .column__number').textContent = doneCount;
}

// EVENT LISTENERS
function setupEventListeners(taskManager) {
    // ADD task buttons
    document.body.addEventListener('click', (e) => {
        if (e.target.classList.contains('add__task')) {
            openTaskModal(taskManager);
        }
    });

    // CLOSE modal buttons
    document.body.addEventListener('click', (e) => {
        if (e.target.classList.contains('btn-close') || e.target.classList.contains('btn-cancel') || e.target === taskManager.elements.modalBackground) {
            closeTaskModal(taskManager);
        }
    });

    // Handle submit form
    taskManager.elements.modalForm.addEventListener('submit', (e) => {
        e.preventDefault();
        handleFormSubmit(taskManager);
    });

    // SAVE task button
    taskManager.elements.saveBtn.addEventListener('click', (e) => {
        e.preventDefault();
        handleFormSubmit(taskManager);
    });
}
