// Simplified Bootstrap-based JS for Collectify
// This file manages only the dynamic UI elements not handled by Jinja templates:
// - View switching (gallery/list)
// - Category selection filtering
// - Dynamic specification fields

document.addEventListener('DOMContentLoaded', function () {
    // --- DOM ELEMENTS ---
    const categorySelect = document.getElementById('categorySelect');
    const specificationsList = document.getElementById('specificationsList');
    
    // --- STATE VARIABLES ---
    window.currentCategorySchema = {};  // Current category's specification schema (for modal)
    window.specValues = {};  // Current specification values for the item being edited/added
    window.urls = []; // Current list of URLs for the item being edited/added
    let viewMode = localStorage.getItem('collectifyViewPreference') || 'gallery'; // Track current view mode - 'gallery' or 'list'

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
    const savedViewPreference = localStorage.getItem('collectifyViewPreference');
    if (savedViewPreference) {
        switchView(savedViewPreference);
    } else {
        // Default to gallery view if no preference is saved
        switchView('gallery');
    }
    
    // Filter items by category
    if (categorySelect) {
        categorySelect.addEventListener('change', function() {
            // Redirect to index with category filter
            const categoryId = this.value;
            if (categoryId) {
                window.location.href = `/?category_id=${categoryId}`;
            } else {
                window.location.href = '/';
            }
        });
        
        // Set the select to match URL parameter if present
        const urlParams = new URLSearchParams(window.location.search);
        const categoryParam = urlParams.get('category_id');
        if (categoryParam) {
            categorySelect.value = categoryParam;
        }
    }
    
    // For specification fields in forms
    window.renderSpecificationFields = function() {
        if (!specificationsList) return;
        
        // Render the specification fields in the modal, based on the current category schema
        specificationsList.innerHTML = '';
        
        if (!window.currentCategorySchema || Object.keys(window.currentCategorySchema).length === 0) {
            specificationsList.innerHTML = '<p class="text-muted">No specifications defined for this category.</p>';
            return;
        }
        
        for (const [key, spec] of Object.entries(window.currentCategorySchema)) {
            const value = window.specValues[key] || '';
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
        
        // Add event listeners to update specValues when fields change
        specificationsList.querySelectorAll('[data-spec-key]').forEach(field => {
            field.addEventListener('input', function() {
                window.specValues[this.dataset.specKey] = this.value;
                
                // Update hidden field if it exists
                const form = document.getElementById('itemForm');
                if (form) {
                    let specInput = form.querySelector('input[name="specification_values"]');
                    if (specInput) {
                        specInput.value = JSON.stringify(window.specValues);
                    } else {
                        specInput = document.createElement('input');
                        specInput.type = 'hidden';
                        specInput.name = 'specification_values';
                        specInput.value = JSON.stringify(window.specValues);
                        form.appendChild(specInput);
                    }
                }
            });
        });
    };
    
    // For URL fields in forms
    window.renderUrls = function() {
        const urlsList = document.getElementById('urlsList');
        if (!urlsList) return;
        
        urlsList.innerHTML = window.urls.map((url, i) => `
            <div class="input-group mb-2">
                <input type="url" class="form-control" name="urls[]" placeholder="https://example.com" value="${url.value || ''}">
                <button type="button" class="btn btn-outline-danger url-remove-btn" data-index="${i}">&times;</button>
            </div>
        `).join('');
        
        // Add event listeners to remove buttons
        urlsList.querySelectorAll('.url-remove-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                window.urls.splice(parseInt(this.dataset.index), 1);
                window.renderUrls();
            });
        });
    };
    
    // Handle category change to fetch specifications schema
    const categoryField = document.getElementById('category');
    if (categoryField) {
        categoryField.addEventListener('change', function() {
            const categoryId = this.value;
            if (categoryId) {
                fetch(`/api/categories/${categoryId}/specifications_schema`)
                    .then(res => res.json())
                    .then(schema => {
                        window.currentCategorySchema = schema;
                        window.specValues = {};
                        window.renderSpecificationFields();
                    });
            } else {
                window.currentCategorySchema = {};
                window.specValues = {};
                window.renderSpecificationFields();
            }
        });
    }
    
    // Initialize addUrlBtn if it exists
    const addUrlBtn = document.getElementById('addUrlBtn');
    if (addUrlBtn) {
        // Make sure we don't duplicate the onclick handler already defined in HTML
        if (!addUrlBtn.hasAttribute('onclick')) {
            addUrlBtn.addEventListener('click', function() {
                window.urls.push({ value: '' });
                window.renderUrls();
            });
        }
    }
});
