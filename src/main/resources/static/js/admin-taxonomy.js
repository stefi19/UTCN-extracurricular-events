const TAXONOMY_API_URL = 'http://localhost:8080';
let categoriesState = [];
let departmentsState = [];
let editingCategoryId = null;
let editingDepartmentId = null;
function taxonomyToken() {
    return localStorage.getItem('jwt_token');
}
function taxonomyHeaders(extra = {}) {
    return {
        Authorization: `Bearer ${taxonomyToken()}`,
        ...extra
    };
}
document.addEventListener('DOMContentLoaded', () => {
    initAdminTaxonomyPage();
});
async function initAdminTaxonomyPage() {
    const container = document.getElementById('admin-taxonomy-container');
    if (!container) return;
    if (!taxonomyToken()) {
        window.location.href = '/login';
        return;
    }
    try {
        const meResponse = await fetch('/api/auth/me', { headers: taxonomyHeaders() });
        if (!meResponse.ok) {
            throw new Error('Could not load user profile');
        }
        const me = await meResponse.json();
        if (me.role !== 'ADMIN') {
            container.innerHTML = `
                <div class="empty-state">
                    <h3>Admin access required</h3>
                    <p>Only administrators can manage categories and departments.</p>
                </div>
            `;
            return;
        }
        renderTaxonomyShell();
        attachTaxonomyHandlers();
        await refreshTaxonomyData();
    } catch (error) {
        console.error('Admin taxonomy page init error:', error);
        container.innerHTML = `
            <div class="empty-state">
                <h3>Unable to load taxonomy panel</h3>
                <p>Please refresh the page and try again.</p>
            </div>
        `;
    }
}
function renderTaxonomyShell() {
    const container = document.getElementById('admin-taxonomy-container');
    container.innerHTML = `
        <div class="dashboard-grid taxonomy-grid">
            <section class="dashboard-card taxonomy-card">
                <h3 id="category-form-title">Create Category</h3>
                <p class="dashboard-muted">Categories are used to classify events for organizers and students.</p>
                <form id="category-form" class="dashboard-form">
                    <div class="form-group">
                        <label for="category-name">Category Name</label>
                        <input id="category-name" type="text" required placeholder="e.g. Workshop" />
                    </div>
                    <div id="category-error" class="error" style="display:none;"></div>
                    <div id="category-success" class="success" style="display:none;"></div>
                    <div class="form-actions">
                        <button type="submit" class="btn-primary">Save Category</button>
                        <button type="button" id="category-cancel-edit" class="btn-secondary" style="display:none;">Cancel Edit</button>
                    </div>
                </form>
                <div class="taxonomy-table-wrapper">
                    <h4>Category List</h4>
                    <div id="categories-table-container" class="dashboard-list loading">Loading categories.</div>
                </div>
            </section>
            <section class="dashboard-card taxonomy-card">
                <h3 id="department-form-title">Create Department</h3>
                <p class="dashboard-muted">Departments connect events with UTCN academic structures.</p>
                <form id="department-form" class="dashboard-form">
                    <div class="form-group">
                        <label for="department-name">Department Name</label>
                        <input id="department-name" type="text" required placeholder="e.g. Computer Science" />
                    </div>
                    <div id="department-error" class="error" style="display:none;"></div>
                    <div id="department-success" class="success" style="display:none;"></div>
                    <div class="form-actions">
                        <button type="submit" class="btn-primary">Save Department</button>
                        <button type="button" id="department-cancel-edit" class="btn-secondary" style="display:none;">Cancel Edit</button>
                    </div>
                </form>
                <div class="taxonomy-table-wrapper">
                    <h4>Department List</h4>
                    <div id="departments-table-container" class="dashboard-list loading">Loading departments.</div>
                </div>
            </section>
        </div>
    `;
}
function attachTaxonomyHandlers() {
    document.getElementById('category-form')?.addEventListener('submit', handleCategorySubmit);
    document.getElementById('department-form')?.addEventListener('submit', handleDepartmentSubmit);
    document.getElementById('category-cancel-edit')?.addEventListener('click', resetCategoryForm);
    document.getElementById('department-cancel-edit')?.addEventListener('click', resetDepartmentForm);
}
async function refreshTaxonomyData() {
    const [categoriesResponse, departmentsResponse] = await Promise.all([
        fetch(`${TAXONOMY_API_URL}/api/categories`, { headers: taxonomyHeaders() }),
        fetch(`${TAXONOMY_API_URL}/api/departments`, { headers: taxonomyHeaders() })
    ]);
    categoriesState = categoriesResponse.ok ? await categoriesResponse.json() : [];
    departmentsState = departmentsResponse.ok ? await departmentsResponse.json() : [];
    renderCategoriesTable();
    renderDepartmentsTable();
}
function renderCategoriesTable() {
    const container = document.getElementById('categories-table-container');
    container.className = 'dashboard-list';
    if (!categoriesState.length) {
        container.innerHTML = `
            <div class="empty-state compact-empty-state">
                <h3>No categories</h3>
                <p>Create the first category to get started.</p>
            </div>
        `;
        return;
    }
    container.innerHTML = `
        <div class="table-wrap">
            <table class="dashboard-table taxonomy-table">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Name</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${categoriesState.map(category => `
                        <tr>
                            <td>${category.id}</td>
                            <td>${escapeHtml(category.name)}</td>
                            <td>
                                <div class="dashboard-actions compact-actions">
                                    <button class="btn-secondary" onclick="startEditCategory(${category.id})">Edit</button>
                                    <button class="btn-manage-cancel" onclick="deleteCategory(${category.id})">Delete</button>
                                </div>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}
function renderDepartmentsTable() {
    const container = document.getElementById('departments-table-container');
    container.className = 'dashboard-list';
    if (!departmentsState.length) {
        container.innerHTML = `
            <div class="empty-state compact-empty-state">
                <h3>No departments</h3>
                <p>Create the first department to get started.</p>
            </div>
        `;
        return;
    }
    container.innerHTML = `
        <div class="table-wrap">
            <table class="dashboard-table taxonomy-table">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Name</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${departmentsState.map(department => `
                        <tr>
                            <td>${department.id}</td>
                            <td>${escapeHtml(department.name)}</td>
                            <td>
                                <div class="dashboard-actions compact-actions">
                                    <button class="btn-secondary" onclick="startEditDepartment(${department.id})">Edit</button>
                                    <button class="btn-manage-cancel" onclick="deleteDepartment(${department.id})">Delete</button>
                                </div>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}
async function handleCategorySubmit(event) {
    event.preventDefault();
    const name = document.getElementById('category-name').value.trim();
    const errorDiv = document.getElementById('category-error');
    const successDiv = document.getElementById('category-success');
    errorDiv.style.display = 'none';
    successDiv.style.display = 'none';
    try {
        const endpoint = editingCategoryId
            ? `${TAXONOMY_API_URL}/api/categories/${editingCategoryId}`
            : `${TAXONOMY_API_URL}/api/categories`;
        const response = await fetch(endpoint, {
            method: editingCategoryId ? 'PUT' : 'POST',
            headers: taxonomyHeaders({ 'Content-Type': 'application/json' }),
            body: JSON.stringify({ name })
        });
        if (!response.ok) {
            const apiError = await response.json().catch(() => ({}));
            throw new Error(apiError.error || 'Failed to save category');
        }
        successDiv.textContent = editingCategoryId
            ? 'Category updated successfully.'
            : 'Category created successfully.';
        successDiv.style.display = 'block';
        resetCategoryForm();
        await refreshTaxonomyData();
    } catch (error) {
        errorDiv.textContent = error.message;
        errorDiv.style.display = 'block';
    }
}
async function handleDepartmentSubmit(event) {
    event.preventDefault();
    const name = document.getElementById('department-name').value.trim();
    const errorDiv = document.getElementById('department-error');
    const successDiv = document.getElementById('department-success');
    errorDiv.style.display = 'none';
    successDiv.style.display = 'none';
    try {
        const endpoint = editingDepartmentId
            ? `${TAXONOMY_API_URL}/api/departments/${editingDepartmentId}`
            : `${TAXONOMY_API_URL}/api/departments`;
        const response = await fetch(endpoint, {
            method: editingDepartmentId ? 'PUT' : 'POST',
            headers: taxonomyHeaders({ 'Content-Type': 'application/json' }),
            body: JSON.stringify({ name })
        });
        if (!response.ok) {
            const apiError = await response.json().catch(() => ({}));
            throw new Error(apiError.error || 'Failed to save department');
        }
        successDiv.textContent = editingDepartmentId
            ? 'Department updated successfully.'
            : 'Department created successfully.';
        successDiv.style.display = 'block';
        resetDepartmentForm();
        await refreshTaxonomyData();
    } catch (error) {
        errorDiv.textContent = error.message;
        errorDiv.style.display = 'block';
    }
}
function startEditCategory(categoryId) {
    const category = categoriesState.find(item => item.id === categoryId);
    if (!category) return;
    editingCategoryId = categoryId;
    document.getElementById('category-name').value = category.name || '';
    document.getElementById('category-form-title').textContent = `Edit Category #${categoryId}`;
    document.getElementById('category-cancel-edit').style.display = 'inline-flex';
}
function startEditDepartment(departmentId) {
    const department = departmentsState.find(item => item.id === departmentId);
    if (!department) return;
    editingDepartmentId = departmentId;
    document.getElementById('department-name').value = department.name || '';
    document.getElementById('department-form-title').textContent = `Edit Department #${departmentId}`;
    document.getElementById('department-cancel-edit').style.display = 'inline-flex';
}
function resetCategoryForm() {
    editingCategoryId = null;
    document.getElementById('category-form')?.reset();
    document.getElementById('category-form-title').textContent = 'Create Category';
    document.getElementById('category-cancel-edit').style.display = 'none';
    document.getElementById('category-error').style.display = 'none';
}
function resetDepartmentForm() {
    editingDepartmentId = null;
    document.getElementById('department-form')?.reset();
    document.getElementById('department-form-title').textContent = 'Create Department';
    document.getElementById('department-cancel-edit').style.display = 'none';
    document.getElementById('department-error').style.display = 'none';
}
async function deleteCategory(categoryId) {
    if (!confirm('Delete this category?')) return;
    try {
        const response = await fetch(`${TAXONOMY_API_URL}/api/categories/${categoryId}`, {
            method: 'DELETE',
            headers: taxonomyHeaders()
        });
        if (!response.ok && response.status !== 204) {
            const apiError = await response.json().catch(() => ({}));
            throw new Error(apiError.error || 'Failed to delete category');
        }
        if (editingCategoryId === categoryId) {
            resetCategoryForm();
        }
        await refreshTaxonomyData();
    } catch (error) {
        alert(error.message);
    }
}
async function deleteDepartment(departmentId) {
    if (!confirm('Delete this department?')) return;
    try {
        const response = await fetch(`${TAXONOMY_API_URL}/api/departments/${departmentId}`, {
            method: 'DELETE',
            headers: taxonomyHeaders()
        });
        if (!response.ok && response.status !== 204) {
            const apiError = await response.json().catch(() => ({}));
            throw new Error(apiError.error || 'Failed to delete department');
        }
        if (editingDepartmentId === departmentId) {
            resetDepartmentForm();
        }
        await refreshTaxonomyData();
    } catch (error) {
        alert(error.message);
    }
}
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
