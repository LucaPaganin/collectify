// item-delete-handler.js
// Handles item deletion functionality for single and batch operations

document.addEventListener('DOMContentLoaded', function() {
  // DOM Elements
  const toggleSelectBtn = document.getElementById('toggleSelectBtn');
  const deleteSelectedBtn = document.getElementById('deleteSelectedBtn');
  const selectAllCheckbox = document.getElementById('selectAllCheckbox');
  const modalDeleteBtn = document.getElementById('modalDeleteBtn');
  const itemModal = document.getElementById('itemModal');
  
  // Delete confirmation modal elements
  const deleteConfirmModal = new bootstrap.Modal(document.getElementById('deleteConfirmModal'));
  const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
  const deleteConfirmBody = document.getElementById('deleteConfirmBody');
  
  // Batch delete confirmation modal elements
  const batchDeleteConfirmModal = new bootstrap.Modal(document.getElementById('batchDeleteConfirmModal'));
  const confirmBatchDeleteBtn = document.getElementById('confirmBatchDeleteBtn');
  const deleteItemCount = document.getElementById('deleteItemCount');
  
  // State variables
  let currentItemId = null;
  let pendingDeleteId = null;
  let pendingBatchDeleteIds = [];
  let isSelectMode = false;
  let itemName = '';
  
  // Toggle selection mode
  if (toggleSelectBtn) {
    toggleSelectBtn.addEventListener('click', function() {
      isSelectMode = !isSelectMode;
      
      // Toggle checkbox visibility
      document.querySelectorAll('.item-select-checkbox').forEach(el => {
        el.classList.toggle('d-none', !isSelectMode);
      });
      
      // Toggle delete selected button
      if (deleteSelectedBtn) {
        deleteSelectedBtn.classList.toggle('d-none', !isSelectMode);
      }
      
      // Update button text
      this.innerHTML = isSelectMode ? 
        '<i class="bi bi-x-lg"></i> Cancel' : 
        '<i class="bi bi-check-square"></i> Select';
        
      // Toggle active state
      this.classList.toggle('btn-outline-danger', !isSelectMode);
      this.classList.toggle('btn-danger', isSelectMode);
    });
  }
  
  // Select all checkbox functionality
  if (selectAllCheckbox) {
    selectAllCheckbox.addEventListener('change', function() {
      document.querySelectorAll('.item-checkbox').forEach(checkbox => {
        checkbox.checked = this.checked;
      });
      updateDeleteSelectedButton();
    });
  }
  
  // Individual checkbox change event to update select all state
  document.addEventListener('change', function(e) {
    if (e.target.classList.contains('item-checkbox')) {
      updateSelectAllCheckbox();
      updateDeleteSelectedButton();
    }
  });
  
  // Update the state of select all checkbox based on individual checkboxes
  function updateSelectAllCheckbox() {
    const checkboxes = document.querySelectorAll('.item-checkbox');
    const checkedBoxes = document.querySelectorAll('.item-checkbox:checked');
    
    if (selectAllCheckbox) {
      if (checkboxes.length === 0) {
        selectAllCheckbox.indeterminate = false;
        selectAllCheckbox.checked = false;
      } else if (checkedBoxes.length === 0) {
        selectAllCheckbox.indeterminate = false;
        selectAllCheckbox.checked = false;
      } else if (checkedBoxes.length === checkboxes.length) {
        selectAllCheckbox.indeterminate = false;
        selectAllCheckbox.checked = true;
      } else {
        selectAllCheckbox.indeterminate = true;
      }
    }
  }
  
  // Update delete selected button state
  function updateDeleteSelectedButton() {
    const checkedBoxes = document.querySelectorAll('.item-checkbox:checked');
    
    if (deleteSelectedBtn) {
      deleteSelectedBtn.disabled = checkedBoxes.length === 0;
    }
  }
  
  // Delete single item handler
  document.addEventListener('click', function(e) {
    if (e.target.classList.contains('delete-item-btn') || 
        e.target.parentElement.classList.contains('delete-item-btn')) {
      
      const button = e.target.classList.contains('delete-item-btn') ? 
                    e.target : e.target.parentElement;
      const itemId = button.getAttribute('data-item-id');
      
      // Find the item name for better confirmation message
      let itemElement;
      if (button.closest('.card')) {
        // In gallery view
        itemElement = button.closest('.card').querySelector('.card-title');
      } else if (button.closest('tr')) {
        // In list view
        itemElement = button.closest('tr').querySelector('td:nth-child(3)'); // Name column
      }
      
      if (itemElement) {
        itemName = itemElement.textContent.trim();
        deleteConfirmBody.textContent = `Are you sure you want to delete "${itemName}"? This action cannot be undone.`;
      } else {
        deleteConfirmBody.textContent = `Are you sure you want to delete this item? This action cannot be undone.`;
      }
      
      // Store the ID to be deleted when confirmed
      pendingDeleteId = itemId;
      
      // Show the modal
      deleteConfirmModal.show();
    }
  });
  
  // Confirm delete button in delete confirmation modal
  if (confirmDeleteBtn) {
    confirmDeleteBtn.addEventListener('click', function() {
      if (pendingDeleteId) {
        // Hide the modal
        deleteConfirmModal.hide();
        
        // Delete the item
        deleteItem(pendingDeleteId);
        
        // Reset the pending ID
        pendingDeleteId = null;
      }
    });
  }
  
  // Delete selected items
  if (deleteSelectedBtn) {
    deleteSelectedBtn.addEventListener('click', function() {
      const selectedItems = Array.from(document.querySelectorAll('.item-checkbox:checked'))
                                .map(checkbox => checkbox.getAttribute('data-item-id'));
      
      if (selectedItems.length === 0) return;
      
      // Update the count in the modal
      if (deleteItemCount) {
        deleteItemCount.textContent = selectedItems.length;
      }
      
      // Store the IDs to be deleted when confirmed
      pendingBatchDeleteIds = selectedItems;
      
      // Show the modal
      batchDeleteConfirmModal.show();
    });
  }
  
  // Confirm batch delete button in batch delete confirmation modal
  if (confirmBatchDeleteBtn) {
    confirmBatchDeleteBtn.addEventListener('click', function() {
      if (pendingBatchDeleteIds.length > 0) {
        // Hide the modal
        batchDeleteConfirmModal.hide();
        
        // Delete all selected items
        Promise.all(pendingBatchDeleteIds.map(id => deleteItem(id, false)))
          .then(() => {
            // Refresh the page after all deletions
            window.location.reload();
          })
          .catch(err => {
            console.error('Error deleting items:', err);
            alert('An error occurred while deleting items.');
          });
        
        // Reset the pending IDs
        pendingBatchDeleteIds = [];
      }
    });
  }
  
  // Modal delete button
  if (modalDeleteBtn) {
    modalDeleteBtn.addEventListener('click', function() {
      if (currentItemId) {
        const itemNameElement = document.getElementById('name');
        if (itemNameElement && itemNameElement.value) {
          itemName = itemNameElement.value.trim();
          deleteConfirmBody.textContent = `Are you sure you want to delete "${itemName}"? This action cannot be undone.`;
        } else {
          deleteConfirmBody.textContent = `Are you sure you want to delete this item? This action cannot be undone.`;
        }
        
        // Store the ID to be deleted when confirmed
        pendingDeleteId = currentItemId;
        
        // Hide the item modal and show the delete confirmation modal
        const itemModalInstance = bootstrap.Modal.getInstance(itemModal);
        itemModalInstance.hide();
        
        // Show the delete confirmation modal after a short delay to avoid modal conflicts
        setTimeout(() => {
          deleteConfirmModal.show();
        }, 400);
      }
    });
  }
  
  // Handle modal show event to update delete button visibility
  if (itemModal) {
    itemModal.addEventListener('show.bs.modal', function(event) {
      const button = event.relatedTarget;
      const itemData = button ? button.getAttribute('data-item') : null;
      
      if (itemData) {
        const itemObj = JSON.parse(itemData);
        currentItemId = itemObj.id;
        
        // Show delete button only in edit mode
        if (modalDeleteBtn) {
          modalDeleteBtn.classList.remove('d-none');
        }
      } else {
        // Hide delete button in create mode
        currentItemId = null;
        if (modalDeleteBtn) {
          modalDeleteBtn.classList.add('d-none');
        }
      }
    });
  }
  
  // Function to delete an item and refresh the page
  function deleteItem(id, reload = true) {
    return fetch(`/api/items/${id}`, {
      method: 'DELETE',
    })
    .then(res => {
      if (!res.ok) {
        return res.json().then(data => {
          throw new Error(data.error || 'Failed to delete item');
        });
      }
      return res.json();
    })
    .then(data => {
      if (reload) {
        window.location.reload();
      }
      return data;
    })
    .catch(err => {
      console.error('Error:', err);
      alert('An error occurred: ' + err.message);
      throw err;
    });
  }
});
