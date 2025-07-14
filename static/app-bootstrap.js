// Bootstrap-based JS for Collectify
// Handles fetching categories/items, populating the grid, and modal form logic

document.addEventListener('DOMContentLoaded', function () {
    // Elements
    const categorySelect = document.getElementById('categorySelect');
    const itemGrid = document.getElementById('itemGrid');
    const itemForm = document.getElementById('itemForm');
    const categoryField = document.getElementById('category');
    const specificationsList = document.getElementById('specificationsList');
    const addSpecBtn = document.getElementById('addSpecBtn');
    const urlsList = document.getElementById('urlsList');
    const addUrlBtn = document.getElementById('addUrlBtn');
    const itemModal = new bootstrap.Modal(document.getElementById('itemModal'));

    let categories = [];
    let items = [];
    let specs = [];
    let urls = [];

    // Fetch categories and items
    function fetchCategories() {
        fetch('/api/categories')
            .then(res => res.json())
            .then(data => {
                categories = data;
                renderCategorySelect();
                renderCategoryField();
            });
    }
    function fetchItems(categoryId = '') {
        let url = '/api/items';
        if (categoryId) url += `?category_id=${categoryId}`;
        itemGrid.innerHTML = '<div class="text-center py-4">Loading items...</div>';
        fetch(url)
            .then(res => res.json())
            .then(data => {
                items = data;
                renderItems();
            });
    }
    // Render category dropdowns
    function renderCategorySelect() {
        categorySelect.innerHTML = '<option value="">All Categories</option>' +
            categories.map(cat => `<option value="${cat.id}">${cat.name}</option>`).join('');
    }
    function renderCategoryField() {
        categoryField.innerHTML = categories.map(cat => `<option value="${cat.id}">${cat.name}</option>`).join('');
    }
    // Render items grid
    function renderItems() {
        if (!items.length) {
            itemGrid.innerHTML = '<div class="text-center py-4">No items found. Click "Add New Item" to get started!</div>';
            return;
        }
        itemGrid.innerHTML = items.map(item => `
            <div class="col-md-4">
                <div class="card h-100">
                    <img src="${item.primary_photo ? '/uploads/' + item.primary_photo : 'https://placehold.co/600x400/eee/ccc?text=No+Image'}" class="card-img-top" alt="Item image">
                    <div class="card-body">
                        <h5 class="card-title">${item.name}</h5>
                        <p class="card-text">${item.brand || 'N/A'}</p>
                        <span class="badge bg-secondary">${item.category_name}</span>
                    </div>
                </div>
            </div>
        `).join('');
    }
    // Modal form logic
    function resetForm() {
        itemForm.reset();
        specs = [];
        urls = [];
        renderSpecs();
        renderUrls();
    }
    function renderSpecs() {
        specificationsList.innerHTML = specs.map((spec, i) => `
            <div class="input-group mb-2">
                <input type="text" class="form-control" placeholder="Attribute (e.g., 'Weight')" value="${spec.key || ''}" data-index="${i}" data-type="key">
                <input type="text" class="form-control" placeholder="Value (e.g., '250g')" value="${spec.value || ''}" data-index="${i}" data-type="value">
                <button type="button" class="btn btn-outline-danger" data-index="${i}" data-action="remove-spec">&times;</button>
            </div>
        `).join('');
    }
    function renderUrls() {
        urlsList.innerHTML = urls.map((url, i) => `
            <div class="input-group mb-2">
                <input type="url" class="form-control" placeholder="https://example.com" value="${url.value || ''}" data-index="${i}" data-type="url">
                <button type="button" class="btn btn-outline-danger" data-index="${i}" data-action="remove-url">&times;</button>
            </div>
        `).join('');
    }
    // Event listeners
    categorySelect.addEventListener('change', function () {
        fetchItems(this.value);
    });
    addSpecBtn.addEventListener('click', function () {
        specs.push({ key: '', value: '' });
        renderSpecs();
    });
    addUrlBtn.addEventListener('click', function () {
        urls.push({ value: '' });
        renderUrls();
    });
    specificationsList.addEventListener('input', function (e) {
        const idx = e.target.dataset.index;
        const type = e.target.dataset.type;
        if (type === 'key') specs[idx].key = e.target.value;
        if (type === 'value') specs[idx].value = e.target.value;
    });
    specificationsList.addEventListener('click', function (e) {
        if (e.target.dataset.action === 'remove-spec') {
            specs.splice(e.target.dataset.index, 1);
            renderSpecs();
        }
    });
    urlsList.addEventListener('input', function (e) {
        const idx = e.target.dataset.index;
        if (e.target.dataset.type === 'url') urls[idx].value = e.target.value;
    });
    urlsList.addEventListener('click', function (e) {
        if (e.target.dataset.action === 'remove-url') {
            urls.splice(e.target.dataset.index, 1);
            renderUrls();
        }
    });
    // Form submit
    itemForm.addEventListener('submit', function (e) {
        e.preventDefault();
        const formData = new FormData(itemForm);
        // Add specs and urls
        const specsObj = {};
        specs.forEach(spec => { if (spec.key) specsObj[spec.key] = spec.value; });
        formData.append('specifications', JSON.stringify(specsObj));
        urls.forEach(url => { if (url.value) formData.append('urls[]', url.value); });
        fetch('/api/items', {
            method: 'POST',
            body: formData
        })
        .then(res => res.json())
        .then(() => {
            fetchItems(categorySelect.value);
            itemModal.hide();
            resetForm();
        })
        .catch(err => alert('An error occurred: ' + err.message));
    });
    // Reset form when modal is shown
    document.getElementById('itemModal').addEventListener('show.bs.modal', resetForm);
    // Initial load
    fetchCategories();
    fetchItems();
});
