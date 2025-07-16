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
    let currentCategorySchema = {};  // Store current category's specification schema
    let specValues = {};  // Store specification values for the current item
    let urls = [];

    // Fetch categories, items and category specs schema
    function fetchCategories() {
        fetch('/api/categories')
            .then(res => res.json())
            .then(data => {
                categories = data;
                renderCategorySelect();
                renderCategoryField();
            });
    }
    
    function fetchCategorySpecsSchema(categoryId) {
        if (!categoryId) {
            currentCategorySchema = {};
            renderSpecificationFields();
            return Promise.resolve({});
        }
        
        return fetch(`/api/categories/${categoryId}/specifications_schema`)
            .then(res => res.json())
            .then(schema => {
                currentCategorySchema = schema;
                renderSpecificationFields();
                return schema;
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
        specValues = {};
        urls = [];
        renderSpecificationFields();
        renderUrls();
        
        // Fetch specs schema for the default category
        if (categoryField.value) {
            fetchCategorySpecsSchema(categoryField.value);
        }
    }
    function renderSpecificationFields() {
        // Render specification fields based on the category's schema
        specificationsList.innerHTML = '';
        
        if (Object.keys(currentCategorySchema).length === 0) {
            specificationsList.innerHTML = '<p class="text-muted">No specifications defined for this category.</p>';
            return;
        }
        
        for (const [key, spec] of Object.entries(currentCategorySchema)) {
            const value = specValues[key] || '';
            let fieldHtml = '';
            
            if (spec.type === 'text' || !spec.type) {
                fieldHtml = `
                    <div class="mb-3">
                        <label class="form-label">${spec.label || key}</label>
                        <input type="text" class="form-control" 
                            placeholder="${spec.placeholder || ''}" 
                            value="${value}" 
                            data-spec-key="${key}">
                    </div>
                `;
            } else if (spec.type === 'number') {
                fieldHtml = `
                    <div class="mb-3">
                        <label class="form-label">${spec.label || key}</label>
                        <input type="number" class="form-control" 
                            placeholder="${spec.placeholder || ''}" 
                            value="${value}"
                            min="${spec.min || ''}" 
                            max="${spec.max || ''}" 
                            step="${spec.step || 1}" 
                            data-spec-key="${key}">
                    </div>
                `;
            } else if (spec.type === 'select' && spec.options) {
                const options = spec.options.map(opt => 
                    `<option value="${opt.value}" ${value === opt.value ? 'selected' : ''}>${opt.label}</option>`
                ).join('');
                
                fieldHtml = `
                    <div class="mb-3">
                        <label class="form-label">${spec.label || key}</label>
                        <select class="form-select" data-spec-key="${key}">
                            <option value="">Select...</option>
                            ${options}
                        </select>
                    </div>
                `;
            }
            
            specificationsList.innerHTML += fieldHtml;
        }
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
    
    categoryField.addEventListener('change', function() {
        // When category changes, fetch its specification schema
        specValues = {}; // Reset current spec values
        const categoryId = this.value;
        if (categoryId) {
            fetchCategorySpecsSchema(categoryId);
        } else {
            currentCategorySchema = {};
            renderSpecificationFields();
        }
    });
    
    addUrlBtn.addEventListener('click', function () {
        urls.push({ value: '' });
        renderUrls();
    });
    
    specificationsList.addEventListener('input', function (e) {
        const specKey = e.target.dataset.specKey;
        if (specKey) {
            specValues[specKey] = e.target.value;
        }
    });
    
    // Hide the add spec button since specs are now based on category schema
    if (addSpecBtn) {
        addSpecBtn.style.display = 'none';
    }
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
        
        // Client-side validation for required fields
        const nameField = document.getElementById('name');
        const categoryField = document.getElementById('category');
        const brandField = document.getElementById('brand');
        
        let isValid = true;
        
        if (!nameField.value.trim()) {
            nameField.classList.add('is-invalid');
            isValid = false;
        } else {
            nameField.classList.remove('is-invalid');
        }
        
        if (!categoryField.value) {
            categoryField.classList.add('is-invalid');
            isValid = false;
        } else {
            categoryField.classList.remove('is-invalid');
        }
        
        if (!brandField.value.trim()) {
            brandField.classList.add('is-invalid');
            isValid = false;
        } else {
            brandField.classList.remove('is-invalid');
        }
        
        if (!isValid) {
            return; // Stop form submission if validation fails
        }
        
        const formData = new FormData(itemForm);
        // Add specification values and urls
        formData.append('specification_values', JSON.stringify(specValues));
        urls.forEach(url => { if (url.value) formData.append('urls[]', url.value); });
        
        fetch('/api/items', {
            method: 'POST',
            body: formData
        })
        .then(res => {
            if (!res.ok) {
                return res.json().then(errorData => {
                    throw new Error(errorData.error || 'Failed to create item');
                });
            }
            return res.json();
        })
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
