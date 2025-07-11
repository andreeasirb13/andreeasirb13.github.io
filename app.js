document.addEventListener('DOMContentLoaded', () => {
    const taskManager = {
        tasks: [],
        elements: {
            columns: {
                todo: document.getElementById('todo'),
                progress: document.getElementById('progress'),
                done: document.getElementById('done')
            },
            addTaskButtons: document.querySelectorAll('.btn-add-task'),
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

function initializeTaskManager(taskManager) {
    loadTasks(taskManager);
    renderTasks(taskManager);
    setupEventListeners(taskManager);
}

function loadTasks(taskManager) {
    const savedTasks = localStorage.getItem('tasks');
    if (savedTasks) {
        taskManager.tasks = JSON.parse(savedTasks);
    }
}

// Save tasks to the local Storage
function saveTasks(taskManager) {
    localStorage.setItem('tasks', JSON.stringify(taskManager.tasks));
}

function renderTasks(taskManager) {
    Object.values(taskManager.elements.columns).forEach(column => {
        column.querySelectorAll('.task').forEach(task => task.remove());
    });

    taskManager.tasks.forEach(task => {
        const column = taskManager.elements.columns[task.status];
        const addTaskButton = column.querySelector('.btn-add-task');
        if (column) {
            const taskElement = createTaskElement(taskManager, task);
            column.insertBefore(taskElement, addTaskButton);
        }
    });

    updateCounters(taskManager);
}

// Task creation
function createTaskElement(taskManager, task) {
    const taskElement = document.createElement('div');
    taskElement.className = 'task';
    taskElement.draggable = true;
    taskElement.dataset.taskId = task.id;

    const fragment = document.createDocumentFragment();

    const titleH3 = document.createElement('h3');
    titleH3.textContent = `Task title: ${task.title}`;
    fragment.appendChild(titleH3);

    if (task.description && task.description.trim() !== '') {
        const description = document.createElement('p');
        description.textContent = `Description: ${task.description}`;
        fragment.appendChild(description);
    }

    const deadlineSmall = document.createElement('small');
    deadlineSmall.textContent = `Deadline: ${task.deadline || 'No due date'}`;
    deadlineSmall.classList.add(task.deadline ? 'task__deadline' : 'task__deadline--default');
    fragment.appendChild(deadlineSmall);

    const actionsDiv = document.createElement('div');
    actionsDiv.className = 'task-actions';

    const duplicateBtn = document.createElement('button');
    duplicateBtn.className = 'btn btn-duplicate';
    duplicateBtn.textContent = 'Duplicate';

    const editBtn = document.createElement('button');
    editBtn.className = 'btn btn-edit';
    editBtn.textContent = 'Edit';

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'btn btn-delete';
    deleteBtn.textContent = 'Delete';

    actionsDiv.appendChild(duplicateBtn);
    actionsDiv.appendChild(editBtn);
    actionsDiv.appendChild(deleteBtn);
    fragment.appendChild(actionsDiv);

    taskElement.innerHTML = '';
    taskElement.appendChild(fragment);

    taskElement.addEventListener('dragstart', handleDragStart);
    taskElement.addEventListener('dragend', handleDragEnd);

    const duplicateButton = taskElement.querySelector('.btn-duplicate');
    const editButton = taskElement.querySelector('.btn-edit');
    const deleteButton = taskElement.querySelector('.btn-delete');
    duplicateButton.addEventListener('click', () => duplicateTask(taskManager, task));
    editButton.addEventListener('click', () => openTaskModal(taskManager, task));
    deleteButton.addEventListener('click', () => deleteTask(taskManager, task.id));

    return taskElement;
}


/* DRAG and DROP functions */

function handleDragStart(e) {
    e.dataTransfer.setData('text/plain', e.target.dataset.taskId);
    e.target.classList.add('dragging');
}

function handleDragEnd(e) {
    e.target.classList.remove('dragging');
}

function handleDragOver(e) {
    e.preventDefault();
}

function handleDrop(taskManager, e) {
    e.preventDefault();

    const draggingTask = document.querySelector('.dragging');
    if (!draggingTask) return;

    const column = e.currentTarget;
    const afterElement = getDragAfterElement(column, e.clientY);

    const addTaskButton = column.querySelector('.btn-add-task');

    if (afterElement) {
        column.insertBefore(draggingTask, afterElement);
    } else {
        column.insertBefore(draggingTask, addTaskButton);
    }

    // Update task status based on the column
    const taskId = draggingTask.dataset.taskId;
    const taskIndex = taskManager.tasks.findIndex(t => t.id === taskId);
    if (taskIndex === -1) return;

    const task = taskManager.tasks[taskIndex];
    task.status = column.id;

    saveTasks(taskManager);
    updateCounters(taskManager);
}

function getDragAfterElement(column, y) {
    const draggableEls = [...column.querySelectorAll('.task:not(.dragging)')];

    return draggableEls.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;
        if (offset < 0 && offset > closest.offset) {
            return { offset, element: child };
        } else {
            return closest;
        }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
}

// Open the Form Modal
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

    taskManager.elements.saveBtn.disabled = !taskManager.elements.taskTitle.value.trim();

    taskManager.elements.taskTitle.addEventListener('input', () => {
        taskManager.elements.saveBtn.disabled = !taskManager.elements.taskTitle.value.trim();
    });

    taskManager.elements.modal.style.display = 'block';
    taskManager.elements.modalBackground.classList.add('show');
    taskManager.elements.modalBackground.style.display = 'block';

    const focusableEl = taskManager.elements.modal.querySelectorAll('input, button, select, textarea, a[href]');
    if (focusableEl.length) {
        focusableEl[0].focus();
    }
}

// Close the Form Modal
function closeTaskModal(taskManager) {
    taskManager.elements.modal.style.display = 'none';
    taskManager.elements.modalBackground.classList.remove('show');
    taskManager.elements.modalBackground.style.display = 'none';
    taskManager.elements.modalForm.reset();

    taskManager.elements.taskTitle.removeEventListener('input', () => {
        taskManager.elements.saveBtn.disabled = !taskManager.elements.taskTitle.value.trim();
    });
}

// Form Submit
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
        deadline: taskDeadline || null,
        status: taskStatus
    };

    if (taskId) {
        updateTask(taskManager, task);
    } else {
        addTask(taskManager, task);
    }

    saveTasks(taskManager);
    renderTasks(taskManager);
    closeTaskModal(taskManager);
}


/* Task Add, Duplicate, Deletion, Edit */

function addTask(taskManager, task) {
    taskManager.tasks.push(task);
}

function duplicateTask(taskManager, task) {
    const duplicatedTask = {
        id: Date.now().toString(),
        title: task.title,
        description: task.description,
        deadline: task.deadline,
        status: task.status
    };

    addTask(taskManager, duplicatedTask);
    saveTasks(taskManager);
    renderTasks(taskManager);
}

function updateTask(taskManager, task) {
    const taskIndex = taskManager.tasks.findIndex(t => t.id === task.id);
    if (taskIndex !== -1) {
        taskManager.tasks[taskIndex] = task;
    }
}

function deleteTask(taskManager, taskId) {
    if (confirm('Do you want to delete this task?')) {
        taskManager.tasks = taskManager.tasks.filter(task => task.id !== taskId);
        saveTasks(taskManager);
        renderTasks(taskManager);
    }
}

/* Counters for tasks management */
function updateCounters(taskManager) {
    const todoCount = taskManager.elements.columns.todo.querySelectorAll('.task').length;
    const progressCount = taskManager.elements.columns.progress.querySelectorAll('.task').length;
    const doneCount = taskManager.elements.columns.done.querySelectorAll('.task').length;

    document.getElementById('totalTasks').textContent = `${taskManager.tasks.length}`;
    document.getElementById('completedTasks').textContent = `${doneCount}`;
    document.getElementById('inProgressTasks').textContent = `${progressCount}`;

    document.querySelector('#todo .column__number').textContent = `${todoCount}`;
    document.querySelector('#progress .column__number').textContent = `${progressCount}`;
    document.querySelector('#done .column__number').textContent = `${doneCount}`;
}


/* Setting the EVENT LISTENERS */
function setupEventListeners(taskManager) {
    // ADD task buttons
    document.body.addEventListener('click', (e) => {
        if (e.target.classList.contains('btn-add-task')) {
            openTaskModal(taskManager);
        }
    });

    // CLOSE modal buttons
    document.body.addEventListener('click', (e) => {
        if (e.target.classList.contains('btn-close') || e.target.classList.contains('btn-cancel') || e.target === taskManager.elements.modalBackground) {
            closeTaskModal(taskManager);
        }
    });

    // SUBMIT forms
    taskManager.elements.modalForm.addEventListener('submit', (e) => {
        e.preventDefault();
        handleFormSubmit(taskManager);
    });

    // DRAG and DROP events
    Object.values(taskManager.elements.columns).forEach(column => {
        column.addEventListener('dragover', (e) => handleDragOver(e));
        column.addEventListener('drop', (e) => handleDrop(taskManager, e));
    });
}

