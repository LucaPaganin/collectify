// item-modal-handler.js
// Handles the item modal interactions for editing and viewing items

document.addEventListener('DOMContentLoaded', function() {
  // Handle load data into modal for edit
  var itemModalEl = document.getElementById('itemModal');
  
  itemModalEl.addEventListener('show.bs.modal', function (event) {
    var button = event.relatedTarget;
    var itemData = button.getAttribute('data-item');
    var modalTitle = document.getElementById('itemModalLabel');
    var form = document.getElementById('itemForm');
    var submitBtn = document.getElementById('modalSubmitBtn');
    var itemObj = itemData ? JSON.parse(itemData) : null;

    console.log(`Item data loaded: ${itemData}`);
    console.log(`item object stringified: ${JSON.stringify(itemObj)}`);
    
    if (itemObj) {
      // Edit mode
      modalTitle.textContent = 'Edit Item';
      form.action = '/item/' + itemObj.id + '/edit';
      submitBtn.textContent = 'Save Changes';
      
      // Fill fields
      document.getElementById('itemId').value = itemObj.id;
      document.getElementById('name').value = itemObj.name || '';
      document.getElementById('brand').value = itemObj.brand || '';
      document.getElementById('serial').value = itemObj.serial_number || '';
      document.getElementById('form_factor').value = itemObj.form_factor || '';
      document.getElementById('desc').value = itemObj.description || '';
      
      // Set the category and fetch its specification schema
      var categoryField = document.getElementById('category');
      categoryField.value = itemObj.category_id || '';
      
      // Clear file input - we don't show existing photos here since they're already stored
      document.getElementById('photos').value = null;
      
      // Fetch the category schema first, then set the specification values
      if (itemObj.category_id) {
        fetch(`/api/categories/${itemObj.category_id}/specifications_schema`)
          .then(res => res.json())
          .then(schema => {
            // Store the schema globally so the specification fields can be rendered properly
            window.currentCategorySchema = schema;
            
            // Set the specification values
            if (itemObj.specification_values) {
              window.specValues = itemObj.specification_values;
            } else {
              window.specValues = {};
            }
            
            // Render the specification fields with the values
            if (typeof renderSpecificationFields === 'function') {
              renderSpecificationFields();
            }
            
            // Create a hidden input field for the specification values
            let existingSpecInput = form.querySelector('input[name="specification_values"]');
            if (existingSpecInput) {
              existingSpecInput.value = JSON.stringify(window.specValues);
            } else {
              let specInput = document.createElement('input');
              specInput.type = 'hidden';
              specInput.name = 'specification_values';
              specInput.value = JSON.stringify(window.specValues);
              form.appendChild(specInput);
            }
          });
      }
      
      // Handle URLs - show existing ones
      if (itemObj.urls && itemObj.urls.length > 0) {
        // If we have the global urls array and renderUrls function from app-bootstrap.js
        if (window.urls !== undefined && typeof renderUrls === 'function') {
          window.urls = itemObj.urls.map(url => ({ value: url }));
          renderUrls();
        } else {
          // Otherwise add them manually to the DOM
          const urlsList = document.getElementById('urlsList');
          urlsList.innerHTML = '';
          
          itemObj.urls.forEach(url => {
            const div = document.createElement('div');
            div.className = 'input-group mb-2';
            div.innerHTML = `
              <input type="url" class="form-control" name="urls[]" value="${url}" placeholder="https://example.com">
              <button type="button" class="btn btn-outline-danger url-remove-btn">&times;</button>
            `;
            urlsList.appendChild(div);
          });
          
          // Add event listeners to remove buttons
          document.querySelectorAll('.url-remove-btn').forEach(btn => {
            btn.addEventListener('click', function() {
              this.closest('.input-group').remove();
            });
          });
        }
      } else {
        // No URLs for this item
        if (window.urls !== undefined && typeof renderUrls === 'function') {
          window.urls = [];
          renderUrls();
        } else {
          document.getElementById('urlsList').innerHTML = '';
        }
      }
    } else {
      // Create mode
      modalTitle.textContent = 'Add New Item';
      form.action = '/api/items';
      submitBtn.textContent = 'Create Item';
      form.reset();
      
      // Reset specification values
      window.specValues = {};
      
      // If the category field has a value, fetch the schema for it
      var categoryField = document.getElementById('category');
      if (categoryField.value) {
        fetch(`/api/categories/${categoryField.value}/specifications_schema`)
          .then(res => res.json())
          .then(schema => {
            window.currentCategorySchema = schema;
            if (typeof renderSpecificationFields === 'function') {
              renderSpecificationFields();
            }
          });
      } else {
        window.currentCategorySchema = {};
        if (typeof renderSpecificationFields === 'function') {
          renderSpecificationFields();
        }
      }
      
      // Reset URLs
      if (window.urls !== undefined && typeof renderUrls === 'function') {
        window.urls = [];
        renderUrls();
      } else {
        document.getElementById('urlsList').innerHTML = '';
      }
      
      // Remove any hidden specification_values input if it exists
      let existingSpecInput = form.querySelector('input[name="specification_values"]');
      if (existingSpecInput) {
        existingSpecInput.remove();
      }
    }
  });
});

// URL management function
function addNewUrl() {
  const urlsList = document.getElementById('urlsList');
  const div = document.createElement('div');
  div.className = 'input-group mb-2';
  div.innerHTML = `
    <input type="url" class="form-control" name="urls[]" placeholder="https://example.com">
    <button type="button" class="btn btn-outline-danger" onclick="this.closest('.input-group').remove()">&times;</button>
  `;
  urlsList.appendChild(div);
}
