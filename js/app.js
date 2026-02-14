/**
 * Innovation Hub Executive Tracker — Application Logic
 */

// ===== STATE =====
let tasks = [];
let filteredTasks = [];
let sortColumn = '';
let sortDirection = 'asc';

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', () => {
    loadTasks();
    updateLastSync();
});

function loadTasks() {
    // Load from data.js (TASKS_DATA is defined there)
    tasks = TASKS_DATA.map((t, i) => ({ ...t, _index: i }));
    populateFilters();
    applyFilters();
    updateKPIs();
    renderEditorTable();
}

// ===== KPI CALCULATIONS =====
function updateKPIs() {
    const total = filteredTasks.length;
    const completed = filteredTasks.filter(t => t.status === 'Completed').length;
    const today = new Date().toISOString().split('T')[0];
    const overdue = filteredTasks.filter(t =>
        t.status !== 'Completed' && t.due_date < today
    ).length;

    animateValue('totalTasks', total);
    document.getElementById('completionRate').textContent = total > 0 ? Math.round((completed / total) * 100) + '%' : '0%';
    animateValue('overdueCount', overdue);
}

function animateValue(elementId, target) {
    const el = document.getElementById(elementId);
    const isPercent = el.textContent.includes('%');
    if (isPercent) return;

    const current = parseInt(el.textContent) || 0;
    if (current === target) return;

    const duration = 400;
    const start = performance.now();

    function update(timestamp) {
        const elapsed = timestamp - start;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        el.textContent = Math.round(current + (target - current) * eased);
        if (progress < 1) requestAnimationFrame(update);
    }
    requestAnimationFrame(update);
}

// ===== FILTERS =====
function populateFilters() {
    const months = new Set();
    const statuses = new Set();
    const assignees = new Set();
    const pendingWith = new Set();

    tasks.forEach(t => {
        if (t.due_date) {
            const d = new Date(t.due_date);
            months.add(d.toLocaleString('default', { month: 'long', year: 'numeric' }));
        }
        statuses.add(t.status);
        assignees.add(t.assigned_to);
        pendingWith.add(t.pending_with);
    });

    fillSelect('filterMonth', [...months].sort());
    fillSelect('filterStatus', [...statuses].sort());
    fillSelect('filterAssigned', [...assignees].sort());
    fillSelect('filterPending', [...pendingWith].sort());
}

function fillSelect(id, options) {
    const select = document.getElementById(id);
    const current = select.value;
    const firstOption = select.options[0].textContent;
    select.innerHTML = `<option value="">${firstOption}</option>`;
    options.forEach(opt => {
        const el = document.createElement('option');
        el.value = opt;
        el.textContent = opt;
        select.appendChild(el);
    });
    select.value = current;
}

function applyFilters() {
    const month = document.getElementById('filterMonth').value;
    const status = document.getElementById('filterStatus').value;
    const assigned = document.getElementById('filterAssigned').value;
    const pending = document.getElementById('filterPending').value;
    const search = document.getElementById('searchInput').value.toLowerCase().trim();

    filteredTasks = tasks.filter(t => {
        if (month) {
            const d = new Date(t.due_date);
            const m = d.toLocaleString('default', { month: 'long', year: 'numeric' });
            if (m !== month) return false;
        }
        if (status && t.status !== status) return false;
        if (assigned && t.assigned_to !== assigned) return false;
        if (pending && t.pending_with !== pending) return false;
        if (search) {
            const searchStr = [t.task_category, t.status, t.assigned_to, t.pending_with, t.due_date].join(' ').toLowerCase();
            if (!searchStr.includes(search)) return false;
        }
        return true;
    });

    if (sortColumn) {
        filteredTasks.sort((a, b) => {
            let va = a[sortColumn] || '';
            let vb = b[sortColumn] || '';
            if (sortColumn === 'due_date') {
                va = new Date(va);
                vb = new Date(vb);
            }
            if (va < vb) return sortDirection === 'asc' ? -1 : 1;
            if (va > vb) return sortDirection === 'asc' ? 1 : -1;
            return 0;
        });
    }

    renderTable();
    updateKPIs();
}

function clearFilters() {
    document.getElementById('filterMonth').value = '';
    document.getElementById('filterStatus').value = '';
    document.getElementById('filterAssigned').value = '';
    document.getElementById('filterPending').value = '';
    document.getElementById('searchInput').value = '';
    sortColumn = '';
    sortDirection = 'asc';
    applyFilters();
}

// ===== SORTING =====
function sortTable(column) {
    if (sortColumn === column) {
        sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
        sortColumn = column;
        sortDirection = 'asc';
    }
    applyFilters();
}

// ===== TABLE RENDERING =====
function renderTable() {
    const tbody = document.getElementById('taskTableBody');
    const empty = document.getElementById('tableEmpty');

    if (filteredTasks.length === 0) {
        tbody.innerHTML = '';
        empty.style.display = 'flex';
        return;
    }

    empty.style.display = 'none';
    const today = new Date().toISOString().split('T')[0];

    tbody.innerHTML = filteredTasks.map(t => {
        const isOverdue = t.status !== 'Completed' && t.due_date < today;
        const statusClass = 'status-' + t.status.toLowerCase().replace(/\s+/g, '-');
        return `
            <tr class="${isOverdue ? 'row-overdue' : ''}">
                <td>${escapeHtml(t.task_category)}</td>
                <td><span class="status-badge ${statusClass}">${escapeHtml(t.status)}</span></td>
                <td>${escapeHtml(t.assigned_to)}</td>
                <td>${escapeHtml(t.pending_with)}</td>
                <td>${formatDate(t.due_date)}</td>
            </tr>
        `;
    }).join('');
}

function renderEditorTable() {
    const tbody = document.getElementById('editorTableBody');
    tbody.innerHTML = tasks.map((t, i) => {
        const statusClass = 'status-' + t.status.toLowerCase().replace(/\s+/g, '-');
        return `
            <tr>
                <td>${escapeHtml(t.task_category)}</td>
                <td><span class="status-badge ${statusClass}">${escapeHtml(t.status)}</span></td>
                <td>${escapeHtml(t.assigned_to)}</td>
                <td>${escapeHtml(t.pending_with)}</td>
                <td>${formatDate(t.due_date)}</td>
                <td>
                    <div class="action-btns">
                        <button class="btn-icon edit" onclick="openEditForm(${i})" title="Edit">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                        </button>
                        <button class="btn-icon delete" onclick="confirmDelete(${i})" title="Delete">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

// ===== VIEW SWITCHING =====
function switchView(view) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.getElementById(view + 'View').classList.add('active');

    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    document.querySelector(`.nav-item[data-view="${view}"]`).classList.add('active');

    document.getElementById('pageTitle').textContent = view === 'dashboard' ? 'Dashboard' : 'Edit Tasks';

    if (view === 'editor') renderEditorTable();
}

// ===== SIDEBAR TOGGLE =====
function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('open');
}

// ===== MODAL MANAGEMENT =====
function openAddForm() {
    document.getElementById('modalTitle').textContent = 'Add New Task';
    document.getElementById('taskForm').reset();
    document.getElementById('formEditIndex').value = '-1';
    document.getElementById('taskModal').classList.add('active');
}

function openEditForm(index) {
    const t = tasks[index];
    document.getElementById('modalTitle').textContent = 'Edit Task';
    document.getElementById('formCategory').value = t.task_category;
    document.getElementById('formStatus').value = t.status;
    document.getElementById('formAssigned').value = t.assigned_to;
    document.getElementById('formPending').value = t.pending_with;
    document.getElementById('formDueDate').value = t.due_date;
    document.getElementById('formEditIndex').value = index;
    document.getElementById('taskModal').classList.add('active');
}

function closeModal() {
    document.getElementById('taskModal').classList.remove('active');
}

function saveTask(e) {
    e.preventDefault();
    const index = parseInt(document.getElementById('formEditIndex').value);
    const taskData = {
        task_category: document.getElementById('formCategory').value.trim(),
        status: document.getElementById('formStatus').value,
        assigned_to: document.getElementById('formAssigned').value.trim(),
        pending_with: document.getElementById('formPending').value.trim(),
        due_date: document.getElementById('formDueDate').value
    };

    if (index === -1) {
        tasks.push({ ...taskData, _index: tasks.length });
        showToast('Task added successfully!');
    } else {
        tasks[index] = { ...taskData, _index: index };
        showToast('Task updated successfully!');
    }

    closeModal();
    populateFilters();
    applyFilters();
    renderEditorTable();
}

// ===== DELETE =====
let deleteIndex = -1;

function confirmDelete(index) {
    deleteIndex = index;
    document.getElementById('deleteModal').classList.add('active');
    document.getElementById('confirmDeleteBtn').onclick = () => performDelete();
}

function closeDeleteModal() {
    document.getElementById('deleteModal').classList.remove('active');
    deleteIndex = -1;
}

function performDelete() {
    if (deleteIndex >= 0) {
        tasks.splice(deleteIndex, 1);
        tasks = tasks.map((t, i) => ({ ...t, _index: i }));
        closeDeleteModal();
        populateFilters();
        applyFilters();
        renderEditorTable();
        showToast('Task deleted successfully!');
    }
}

// ===== REFRESH =====
function refreshData() {
    const btn = document.getElementById('refreshBtn');
    btn.classList.add('spinning');
    setTimeout(() => {
        applyFilters();
        updateKPIs();
        renderEditorTable();
        btn.classList.remove('spinning');
        updateLastSync();
        showToast('Data refreshed!');
    }, 500);
}

function updateLastSync() {
    const now = new Date();
    document.getElementById('lastSyncTime').textContent =
        'Last sync: ' + now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// ===== TOAST =====
function showToast(message, isError = false) {
    const toast = document.getElementById('toast');
    const toastMsg = document.getElementById('toastMessage');
    toastMsg.textContent = message;
    toast.className = 'toast active' + (isError ? ' error' : '');
    setTimeout(() => { toast.classList.remove('active'); }, 3000);
}

// ===== HELPERS =====
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatDate(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}
