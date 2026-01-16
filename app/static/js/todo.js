/**
 * Todo JavaScript
 * Handles task CRUD operations
 */

let tasks = [];
let editingTaskId = null;

const STATES = [
    "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
    "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand",
    "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur",
    "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab",
    "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura",
    "Uttar Pradesh", "Uttarakhand", "West Bengal", "Delhi", "Jammu and Kashmir"
];

document.addEventListener('DOMContentLoaded', async () => {
    populateStateDropdown();
    await loadTasks();
    checkUrlParams();

    document.getElementById('addTaskBtn')?.addEventListener('click', () => openModal());
    document.getElementById('emptyAddBtn')?.addEventListener('click', () => openModal());
    document.getElementById('closeModal')?.addEventListener('click', closeModal);
    document.getElementById('cancelTaskBtn')?.addEventListener('click', closeModal);
    document.getElementById('taskForm')?.addEventListener('submit', handleSubmit);
    document.getElementById('priorityFilter')?.addEventListener('change', filterTasks);

    document.querySelectorAll('#statusFilter .filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('#statusFilter .filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            filterTasks();
        });
    });
});

function populateStateDropdown() {
    const select = document.getElementById('taskState');
    STATES.forEach(state => {
        const option = document.createElement('option');
        option.value = state;
        option.textContent = state;
        select.appendChild(option);
    });
}

function checkUrlParams() {
    const params = new URLSearchParams(window.location.search);
    if (params.get('title')) {
        document.getElementById('taskTitle').value = params.get('title');
        document.getElementById('taskDescription').value = params.get('description') || '';
        openModal();
        window.history.replaceState({}, '', '/todo');
    }
}

async function loadTasks() {
    const loadingState = document.getElementById('loadingState');
    loadingState.style.display = 'flex';

    try {
        const response = await fetch('/todo/api/tasks');
        const result = await response.json();

        if (result.success) {
            tasks = result.data.tasks;
            renderTasks(tasks);
            updateStats();
        }
    } catch (error) {
        console.error('Error loading tasks:', error);
    } finally {
        loadingState.style.display = 'none';
    }
}

function filterTasks() {
    const status = document.querySelector('#statusFilter .filter-btn.active')?.dataset.status || '';
    const priority = document.getElementById('priorityFilter').value;

    let filtered = [...tasks];
    if (status) filtered = filtered.filter(t => t.status === status);
    if (priority) filtered = filtered.filter(t => t.priority === priority);

    renderTasks(filtered);
}

function renderTasks(taskList) {
    const container = document.getElementById('taskList');
    const emptyState = document.getElementById('emptyState');

    if (taskList.length === 0) {
        container.innerHTML = '';
        emptyState.style.display = 'flex';
        return;
    }

    emptyState.style.display = 'none';

    container.innerHTML = taskList.map(t => `
        <div class="task-card ${t.status}">
            <div class="task-checkbox">
                <input type="checkbox" ${t.status === 'done' ? 'checked' : ''} 
                       onchange="toggleStatus('${t.id}', this.checked)">
            </div>
            <div class="task-content">
                <div class="task-header">
                    <h3 class="task-title">${t.title}</h3>
                    <span class="priority-badge ${t.priority}">${t.priority}</span>
                </div>
                ${t.description ? `<p class="task-description">${t.description}</p>` : ''}
                <div class="task-meta">
                    <span class="status-badge ${t.status}">${t.status.replace('_', ' ')}</span>
                    ${t.state ? `<span>📍 ${t.state}</span>` : ''}
                    ${t.anomaly_type ? `<span>🏷️ ${t.anomaly_type}</span>` : ''}
                    ${t.assigned_to ? `<span>👤 ${t.assigned_to}</span>` : ''}
                </div>
            </div>
            <div class="task-actions">
                <button class="action-btn" onclick="editTask('${t.id}')" title="Edit">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </svg>
                </button>
            </div>
        </div>
    `).join('');
}

function updateStats() {
    document.getElementById('totalTasks').textContent = tasks.length;
    document.getElementById('pendingTasks').textContent = tasks.filter(t => t.status === 'pending').length;
    document.getElementById('inProgressTasks').textContent = tasks.filter(t => t.status === 'in_progress').length;
    document.getElementById('doneTasks').textContent = tasks.filter(t => t.status === 'done').length;
}

function openModal(taskId = null) {
    editingTaskId = taskId;
    const modal = document.getElementById('taskModal');
    const title = document.getElementById('modalTitle');
    const form = document.getElementById('taskForm');

    if (taskId) {
        const task = tasks.find(t => t.id == taskId);
        if (task) {
            title.textContent = 'Edit Task';
            document.getElementById('taskId').value = task.id;
            document.getElementById('taskTitle').value = task.title;
            document.getElementById('taskDescription').value = task.description || '';
            document.getElementById('taskState').value = task.state || '';
            document.getElementById('taskAnomalyType').value = task.anomaly_type || '';
            document.getElementById('taskPriority').value = task.priority;
            document.getElementById('taskStatus').value = task.status;
            document.getElementById('taskAssignee').value = task.assigned_to || '';
        }
    } else {
        title.textContent = 'Add New Task';
        form.reset();
        document.getElementById('taskId').value = '';
    }

    modal.style.display = 'flex';
}

function closeModal() {
    document.getElementById('taskModal').style.display = 'none';
    editingTaskId = null;
}

function editTask(id) {
    openModal(id);
}

async function handleSubmit(e) {
    e.preventDefault();

    const data = {
        title: document.getElementById('taskTitle').value,
        description: document.getElementById('taskDescription').value,
        state: document.getElementById('taskState').value,
        anomaly_type: document.getElementById('taskAnomalyType').value,
        priority: document.getElementById('taskPriority').value,
        status: document.getElementById('taskStatus').value,
        assigned_to: document.getElementById('taskAssignee').value
    };

    const taskId = document.getElementById('taskId').value;

    try {
        const url = taskId ? `/todo/api/tasks/${taskId}` : '/todo/api/tasks';
        const method = taskId ? 'PATCH' : 'POST';

        const response = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        const result = await response.json();

        if (result.success) {
            closeModal();
            await loadTasks();
        } else {
            alert('Error: ' + result.error);
        }
    } catch (error) {
        console.error('Error saving task:', error);
        alert('Failed to save task');
    }
}

async function toggleStatus(id, done) {
    // Optimistic UI Update
    const checkbox = document.querySelector(`input[onchange="toggleStatus('${id}', this.checked)"]`);
    const card = checkbox?.closest('.task-card');

    if (card) {
        card.classList.add('status-updating');
        if (done) {
            card.classList.add('done');
            card.classList.remove('pending', 'in_progress');
            // Update status badge text immediately
            const badge = card.querySelector('.status-badge');
            if (badge) {
                badge.textContent = 'DONE';
                badge.className = 'status-badge done';
            }
        } else {
            card.classList.remove('done');
            card.classList.add('pending'); // Default back to pending
            const badge = card.querySelector('.status-badge');
            if (badge) {
                badge.textContent = 'PENDING';
                badge.className = 'status-badge pending';
            }
        }
    }

    try {
        await fetch(`/todo/api/tasks/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: done ? 'done' : 'pending' })
        });

        // Wait a bit for animation to finish before consistent reload
        setTimeout(loadTasks, 500);

    } catch (error) {
        console.error('Error updating status:', error);
        // Revert on error (reload tasks to get true state)
        loadTasks();
    }
}
