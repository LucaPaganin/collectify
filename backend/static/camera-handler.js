// camera-handler.js
// Handles camera functionality for taking photos with device camera

document.addEventListener('DOMContentLoaded', function() {
  // DOM Elements
  const takePictureBtn = document.getElementById('takePictureBtn');
  const cameraModal = new bootstrap.Modal(document.getElementById('cameraModal'));
  const cameraFeed = document.getElementById('cameraFeed');
  const photoCanvas = document.getElementById('photoCanvas');
  const capturePhotoBtn = document.getElementById('capturePhotoBtn');
  const capturedImagesPreview = document.getElementById('capturedImagesPreview');
  const cameraErrorMessage = document.getElementById('cameraErrorMessage');
  const photosInput = document.getElementById('photos');
  
  // State variables
  let stream = null;
  let capturedImages = [];
  
  // Photo counter for unique filenames
  let photoCounter = 1;
  
  // Function to start the camera
  function startCamera() {
    // Reset error message
    cameraErrorMessage.style.display = 'none';
    
    // Check if browser supports getUserMedia
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      cameraErrorMessage.style.display = 'block';
      console.error("Browser doesn't support getUserMedia");
      return;
    }
    
    // Get user media with camera
    navigator.mediaDevices.getUserMedia({ 
      video: { 
        facingMode: 'environment', // Prefer back camera if available
        width: { ideal: 1280 },
        height: { ideal: 720 }
      },
      audio: false 
    })
    .then(function(mediaStream) {
      stream = mediaStream;
      cameraFeed.srcObject = stream;
      cameraFeed.play();
    })
    .catch(function(err) {
      console.error("Error accessing camera:", err);
      cameraErrorMessage.style.display = 'block';
    });
  }
  
  // Function to stop the camera
  function stopCamera() {
    if (stream) {
      stream.getTracks().forEach(track => {
        track.stop();
      });
      stream = null;
      cameraFeed.srcObject = null;
    }
  }
  
  // Function to capture photo from camera
  function capturePhoto() {
    if (!stream) return;
    
    const context = photoCanvas.getContext('2d');
    
    // Set canvas dimensions to match video dimensions
    photoCanvas.width = cameraFeed.videoWidth;
    photoCanvas.height = cameraFeed.videoHeight;
    
    // Draw the video frame to the canvas
    context.drawImage(cameraFeed, 0, 0, photoCanvas.width, photoCanvas.height);
    
    // Convert canvas to blob
    photoCanvas.toBlob(function(blob) {
      // Create a unique filename
      const timestamp = new Date().getTime();
      const filename = `camera_photo_${timestamp}_${photoCounter++}.jpg`;
      
      // Create a File object from the blob
      const file = new File([blob], filename, { type: 'image/jpeg' });
      
      // Add to captured images array
      capturedImages.push(file);
      
      // Create a preview of the captured image
      addImagePreview(file);
      
      // Update the file input to include the captured image
      updateFileInput();
      
    }, 'image/jpeg', 0.95); // JPEG format with 95% quality
  }
  
  // Function to add image preview
  function addImagePreview(file) {
    // Create a container for the preview
    const previewContainer = document.createElement('div');
    previewContainer.className = 'position-relative';
    
    // Create the preview image
    const previewImg = document.createElement('img');
    previewImg.className = 'img-thumbnail';
    previewImg.style.width = '100px';
    previewImg.style.height = '75px';
    previewImg.style.objectFit = 'cover';
    
    // Set the image source
    const reader = new FileReader();
    reader.onload = function(e) {
      previewImg.src = e.target.result;
    };
    reader.readAsDataURL(file);
    
    // Create a remove button
    const removeBtn = document.createElement('button');
    removeBtn.className = 'btn btn-sm btn-danger position-absolute top-0 end-0';
    removeBtn.innerHTML = '×';
    removeBtn.style.padding = '0 5px';
    
    // Add event listener to remove button
    removeBtn.addEventListener('click', function() {
      // Remove the file from capturedImages array
      const index = capturedImages.findIndex(img => img === file);
      if (index !== -1) {
        capturedImages.splice(index, 1);
      }
      
      // Update the file input
      updateFileInput();
      
      // Remove the preview container
      previewContainer.remove();
    });
    
    // Add elements to preview container
    previewContainer.appendChild(previewImg);
    previewContainer.appendChild(removeBtn);
    
    // Add preview container to preview area
    capturedImagesPreview.appendChild(previewContainer);
  }
  
  // Function to update the file input with captured images
  function updateFileInput() {
    // We need to create a new DataTransfer object to update the files in the input
    const dataTransfer = new DataTransfer();
    
    // Add existing selected files from the input
    if (photosInput.files) {
      Array.from(photosInput.files).forEach(file => {
        dataTransfer.items.add(file);
      });
    }
    
    // Add captured images
    capturedImages.forEach(file => {
      dataTransfer.items.add(file);
    });
    
    // Update the file input
    photosInput.files = dataTransfer.files;
    
    // Trigger change event on the file input
    const event = new Event('change', { bubbles: true });
    photosInput.dispatchEvent(event);
  }
  
  // Event listeners
  if (takePictureBtn) {
    takePictureBtn.addEventListener('click', function() {
      startCamera();
      cameraModal.show();
    });
  }
  
  // Modal events
  document.getElementById('cameraModal').addEventListener('hidden.bs.modal', function() {
    stopCamera();
  });
  
  // Capture photo button
  if (capturePhotoBtn) {
    capturePhotoBtn.addEventListener('click', function() {
      capturePhoto();
    });
  }
  
  // File input change event to show previews of selected files
  if (photosInput) {
    photosInput.addEventListener('change', function(e) {
      // Show previews for selected files
      Array.from(e.target.files).forEach(file => {
        // Skip files that are already in capturedImages
        if (!capturedImages.some(capturedFile => capturedFile.name === file.name)) {
          addImagePreview(file);
        }
      });
    });
  }
});
