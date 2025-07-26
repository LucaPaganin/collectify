// form-submit-handler.js
// Handles form submission for creating and editing items

document.addEventListener('DOMContentLoaded', function() {
  // Get the form element
  const itemForm = document.getElementById('itemForm');
  
  if (itemForm) {
    // Add submit event listener
    itemForm.addEventListener('submit', function(e) {
      e.preventDefault();
      
      // Get form data
      const formData = new FormData(itemForm);
      
      // Get specification values if they exist
      if (window.specValues) {
        formData.append('specification_values', JSON.stringify(window.specValues));
      }
      
      // Get URLs if they exist (they should be automatically included as urls[])
      
      // Determine if we're creating or editing
      const isEditing = document.getElementById('itemId').value !== '';
      const url = isEditing ? `/api/items/${document.getElementById('itemId').value}` : '/api/items';
      const method = isEditing ? 'PUT' : 'POST';
      
      // Submit the form
      fetch(url, {
        method: method,
        body: formData
      })
      .then(res => {
        if (!res.ok) {
          return res.json().then(errorData => {
            throw new Error(errorData.error || 'Failed to process item');
          });
        }
        
        // On success, just reload the page to show changes
        window.location.reload();
      })
      .catch(err => {
        alert('An error occurred: ' + err.message);
      });
    });
  }
});
