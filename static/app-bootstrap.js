// Bootstrap-based JS for Collectify
// This file manages the main UI logic for Collectify, including:
// - Fetching categories and items from the backend
// - Rendering the item gallery and modal forms
// - Handling all user interactions for adding/editing items
// - Managing dynamic specification fields and URLs

// Main entry point: runs when the DOM is fully loaded
// Sets up all UI elements, event listeners, and data fetching logic
document.addEventListener('DOMContentLoaded', function () {
    // --- DOM ELEMENTS ---
    const categorySelect = document.getElementById('categorySelect');
    const itemGrid = document.getElementById('itemGrid');
    const itemForm = document.getElementById('itemForm');
    const categoryField = document.getElementById('category');
    const specificationsList = document.getElementById('specificationsList');
    const addSpecBtn = document.getElementById('addSpecBtn');
    const urlsList = document.getElementById('urlsList');
    const addUrlBtn = document.getElementById('addUrlBtn');
    const itemModal = new bootstrap.Modal(document.getElementById('itemModal'));

    // --- STATE VARIABLES ---
    let categories = []; // List of all categories fetched from backend
    let items = []; // List of all items fetched from backend
    let currentCategorySchema = {};  // Current category's specification schema (for modal)
    let specValues = {};  // Current specification values for the item being edited/added
    let urls = []; // Current list of URLs for the item being edited/added
    let viewMode = localStorage.getItem('collectifyViewPreference') || 'gallery'; // Track current view mode - 'gallery' or 'list'

    // --- DATA FETCHING FUNCTIONS ---
    function fetchCategories() {
        // Fetch all categories from the backend and render dropdowns
        fetch('/api/categories')
            .then(res => res.json())
            .then(data => {
                categories = data;
                renderCategorySelect();
                renderCategoryField();
            });
    }
    
    function fetchCategorySpecsSchema(categoryId) {
        // Fetch the specification schema for a given category (used for dynamic specs fields)
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
        // Fetch all items (optionally filtered by category) and render the item grid
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
    // --- RENDERING FUNCTIONS ---
    function renderCategorySelect() {
        // Render the main category filter dropdown (top of page)
        categorySelect.innerHTML = '<option value="">All Categories</option>' +
            categories.map(cat => `<option value="${cat.id}">${cat.name}</option>`).join('');
    }
    
    function renderCategoryField() {
        // Render the category dropdown in the item modal form
        categoryField.innerHTML = categories.map(cat => `<option value="${cat.id}">${cat.name}</option>`).join('');
    }
    
    // Render both views of items (grid and list)
    function renderItems() {
        // Exit early if there are no items
        if (!items.length) {
            const noItemsMessage = '<div class="text-center py-4">No items found. Click "Add New Item" to get started!</div>';
            itemGrid.innerHTML = noItemsMessage;
            document.getElementById('itemList').innerHTML = noItemsMessage;
            return;
        }
        
        // Render the grid view (cards)
        itemGrid.innerHTML = items.map(item => `
            <div class="col-md-4 mb-4">
                <div class="card h-100">
                    <img src="${item.primary_photo ? '/uploads/' + item.primary_photo : 'https://placehold.co/600x400/eee/ccc?text=No+Image'}" 
                         class="card-img-top" alt="${item.name}" 
                         style="height:200px; object-fit:cover;">
                    <div class="card-body">
                        <h5 class="card-title">${item.name}</h5>
                        <p class="card-text">${item.brand || 'N/A'}</p>
                        <span class="badge bg-secondary">${item.category_name}</span>
                        <div class="mt-3 d-flex justify-content-end">
                            <button class="btn btn-outline-primary btn-sm edit-item-btn" data-item-id="${item.id}">Edit/View</button>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
        
        // Render list view
        const itemList = document.getElementById('itemList');
        if (itemList) {
            const table = document.createElement('table');
            table.className = 'table table-striped table-hover';
            
            // Table header
            const thead = document.createElement('thead');
            thead.innerHTML = `
                <tr>
                    <th style="width: 80px">Image</th>
                    <th>Name</th>
                    <th>Brand</th>
                    <th>Category</th>
                    <th>Serial #</th>
                    <th>Form Factor</th>
                    <th>Actions</th>
                </tr>
            `;
            table.appendChild(thead);
            
            // Table body
            const tbody = document.createElement('tbody');
            items.forEach(item => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>
                        <img src="${item.primary_photo ? '/uploads/' + item.primary_photo : 'https://placehold.co/600x400/eee/ccc?text=No+Image'}" 
                             alt="${item.name}" class="img-thumbnail" 
                             style="width:60px; height:60px; object-fit:cover;">
                    </td>
                    <td>${item.name}</td>
                    <td>${item.brand || 'N/A'}</td>
                    <td><span class="badge bg-secondary">${item.category_name}</span></td>
                    <td>${item.serial_number || 'N/A'}</td>
                    <td>${item.form_factor || 'N/A'}</td>
                    <td>
                        <button class="btn btn-outline-primary btn-sm edit-item-btn" data-item-id="${item.id}">Edit/View</button>
                    </td>
                `;
                tbody.appendChild(tr);
            });
            table.appendChild(tbody);
            
            itemList.innerHTML = '';
            itemList.appendChild(table);
        }

        // Attach event listeners for all edit buttons
        document.querySelectorAll('.edit-item-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const itemId = this.getAttribute('data-item-id');
                const item = items.find(i => i.id == itemId);
                if (item) {
                    openEditModal(item);
                }
            });
        });
    }

    function openEditModal(item) {
        // Open the modal for editing an item, pre-filling all fields
        // Fill modal fields with item data
        document.getElementById('itemModalLabel').textContent = 'Edit Item';
        document.getElementById('name').value = item.name || '';
        document.getElementById('category').value = item.category_id || '';
        document.getElementById('brand').value = item.brand || '';
        document.getElementById('serial').value = item.serial_number || '';
        document.getElementById('form_factor').value = item.form_factor || '';
        document.getElementById('desc').value = item.description || '';

        // Specifications
        // Load specifications and URLs for the item
        specValues = item.specification_values || {};
        // URLs
        urls = (item.urls || []).map(u => ({ value: u.url || u }));
        renderSpecificationFields();
        renderUrls();

        // Show modal
        // Show the modal dialog
        itemModal.show();
    }
    // Reset the modal form to its default state (used for new item creation)
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
        // Render the specification fields in the modal, based on the current category schema
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
        // Render the list of URL fields in the modal
        urlsList.innerHTML = urls.map((url, i) => `
            <div class="input-group mb-2">
                <input type="url" class="form-control" placeholder="https://example.com" value="${url.value || ''}" data-index="${i}" data-type="url">
                <button type="button" class="btn btn-outline-danger" data-index="${i}" data-action="remove-url">&times;</button>
            </div>
        `).join('');
    }
    // --- VIEW SWITCHING ---
    // Function to switch between gallery and list views
    function switchView(viewType) {
        // Update button state
        document.getElementById('galleryViewBtn').classList.toggle('active', viewType === 'gallery');
        document.getElementById('listViewBtn').classList.toggle('active', viewType === 'list');
        
        // Show/hide appropriate view container
        const itemGridEl = document.getElementById('itemGrid');
        const itemListEl = document.getElementById('itemList');
        
        if (itemGridEl) {
            itemGridEl.style.display = viewType === 'gallery' ? 'flex' : 'none';
            itemGridEl.classList.toggle('row', viewType === 'gallery');
            itemGridEl.classList.toggle('g-4', viewType === 'gallery');
        }
        
        if (itemListEl) {
            itemListEl.style.display = viewType === 'list' ? 'block' : 'none';
        }
        
        // Update current view state
        viewMode = viewType;
        
        // Store preference in local storage
        localStorage.setItem('collectifyViewPreference', viewType);
    }

    // --- EVENT LISTENERS ---
    // Add event listeners for view toggle buttons
    const galleryViewBtn = document.getElementById('galleryViewBtn');
    const listViewBtn = document.getElementById('listViewBtn');
    
    if (galleryViewBtn && listViewBtn) {
        galleryViewBtn.addEventListener('click', function() {
            switchView('gallery');
        });
        
        listViewBtn.addEventListener('click', function() {
            switchView('list');
        });
    }
    
    // Initialize view preference from local storage
    document.addEventListener('DOMContentLoaded', function() {
        const savedViewPreference = localStorage.getItem('collectifyViewPreference');
        if (savedViewPreference) {
            switchView(savedViewPreference);
        } else {
            // Default to gallery view if no preference is saved
            switchView('gallery');
        }
    });
    
    categorySelect.addEventListener('change', function () {
        // When the category filter dropdown changes, fetch items for that category
        fetchItems(this.value);
    });
    
    categoryField.addEventListener('change', function() {
        // When category changes in the modal, fetch its specification schema and reset spec values
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
        // Add a new empty URL field when the user clicks the add URL button
        urls.push({ value: '' });
        renderUrls();
    });
    
    specificationsList.addEventListener('input', function (e) {
        // Update specValues when the user types in a specification field
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
        // Update the urls array when the user types in a URL field
        const idx = e.target.dataset.index;
        if (e.target.dataset.type === 'url') urls[idx].value = e.target.value;
    });
    urlsList.addEventListener('click', function (e) {
        // Remove a URL field when the user clicks the remove button
        if (e.target.dataset.action === 'remove-url') {
            urls.splice(e.target.dataset.index, 1);
            renderUrls();
        }
    });
    // Form submit
    itemForm.addEventListener('submit', function (e) {
        // --- FORM VALIDATION ---
        // Validate required fields before submitting
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
        
        // Build FormData for submission, including specs and URLs
        const formData = new FormData(itemForm);
        // Add specification values and urls
        formData.append('specification_values', JSON.stringify(specValues));
        urls.forEach(url => { if (url.value) formData.append('urls[]', url.value); });
        
        // Submit the form via AJAX to the backend
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
    // Reset form when modal is shown (for new item)
    document.getElementById('itemModal').addEventListener('show.bs.modal', resetForm);
    // Initial load
    // --- INITIALIZATION ---
    // On page load, fetch categories and items for the gallery
    fetchCategories();
    fetchItems();
});
