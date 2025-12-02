import { useState, useRef } from 'react';
import { api } from '../../utils/authUtils';
import { getApiBaseUrl } from '../../utils/urlUtils';
import Button from '../Button';
import Camera from '../Camera';

const PhotoUpload = ({ initialData, onPhotoUpload, currentPhotoUrl }) => {
    const [photoUploading, setPhotoUploading] = useState(false);
    const [photoError, setPhotoError] = useState(null);
    const [showCamera, setShowCamera] = useState(false);
    const [capturedPhoto, setCapturedPhoto] = useState(null);
    const fileInputRef = useRef(null);

    const handlePhotoUpload = async (file) => {
        if (!file || !initialData?.id) return;

        setPhotoError(null);
        setPhotoUploading(true);

        try {
            const formData = new FormData();
            formData.append('photos[]', file);

            const res = await api.post(`/items/${initialData.id}/photos`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            const filename = res?.data?.filename;
            if (filename) {
                const apiBaseUrl = getApiBaseUrl();
                onPhotoUpload(`${apiBaseUrl}/uploads/${filename}`);
                console.log(`Photo URL: ${apiBaseUrl}/uploads/${filename}`);
            }
        } catch (err) {
            console.error('Error uploading photo:', err);
            setPhotoError(err.response?.data?.error || 'Failed to upload image');
        } finally {
            setPhotoUploading(false);
            setCapturedPhoto(null);
        }
    };

    const handleFileInputChange = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            handlePhotoUpload(file);
        }
        // Reset input so the same file can be selected again
        e.target.value = '';
    };

    const handleCameraCapture = (file) => {
        // Create temporary URL for preview
        const objectUrl = URL.createObjectURL(file);
        setCapturedPhoto({
            file: file,
            previewUrl: objectUrl
        });

        // Don't automatically upload - wait for user to save the form
        setShowCamera(false);
        onPhotoUpload(objectUrl); // Set temporary preview
    };

    // Handle saving the captured photo
    const handleSavePhoto = () => {
        if (capturedPhoto?.file) {
            handlePhotoUpload(capturedPhoto.file);
        }
    };

    // Handle discarding the captured photo
    const handleDiscardPhoto = () => {
        if (capturedPhoto?.previewUrl) {
            URL.revokeObjectURL(capturedPhoto.previewUrl);
        }
        setCapturedPhoto(null);
        setShowCamera(false);
        // Restore original photo URL
        if (currentPhotoUrl && !currentPhotoUrl.startsWith('blob:')) {
            onPhotoUpload(currentPhotoUrl);
        } else {
            onPhotoUpload(null);
        }
    };

    return (
        <div className="photo-upload mb-3">
            <label className="form-label">Item Image</label>

            {photoError && (
                <div className="alert alert-danger">
                    <strong>Error: </strong>{photoError}
                    {photoError.includes('not supported') && (
                        <div className="mt-2">
                            <small>
                                Try using a different browser like Chrome or Safari, or check if your device has a camera.
                            </small>
                        </div>
                    )}
                </div>
            )}

            {showCamera ? (
                <Camera
                    onCapture={handleCameraCapture}
                    onCancel={() => setShowCamera(false)}
                    onError={(error) => {
                        console.error('Camera error:', error);
                        setPhotoError(error.message || 'Failed to access camera');
                        setShowCamera(false);
                    }}
                />
            ) : capturedPhoto ? (
                <div className="mb-3">
                    <div
                        style={{
                            minHeight: 400,
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'center',
                            margin: '0 auto',
                            border: '1px solid #dee2e6',
                            borderRadius: '12px',
                            padding: '10px',
                            backgroundColor: '#f8f9fa'
                        }}
                    >
                        <a
                            href={capturedPhoto.previewUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ cursor: 'pointer', display: 'flex', justifyContent: 'center' }}
                            title="Click to open full image in new tab"
                        >
                            <img
                                src={capturedPhoto.previewUrl}
                                alt="Captured"
                                style={{
                                    maxWidth: '100%',
                                    maxHeight: 400,
                                    objectFit: 'contain',
                                    borderRadius: 8
                                }}
                            />
                        </a>
                    </div>
                    <div className="d-flex gap-2 mt-2">
                        <Button variant="outline-danger" onClick={handleDiscardPhoto} className="flex-grow-1">
                            Discard
                        </Button>
                        <Button variant="primary" onClick={handleSavePhoto} className="flex-grow-1">
                            Use Photo
                        </Button>
                    </div>
                </div>
            ) : currentPhotoUrl && !photoUploading ? (
                <div className="mb-3">
                    <div
                        style={{
                            minHeight: 400,
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'center',
                            margin: '0 auto',
                            border: '1px solid #dee2e6',
                            borderRadius: '12px',
                            padding: '10px',
                            backgroundColor: '#f8f9fa'
                        }}
                    >
                        <a
                            href={currentPhotoUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ cursor: 'pointer', display: 'flex', justifyContent: 'center' }}
                            title="Click to open full image in new tab"
                        >
                            <img
                                src={currentPhotoUrl}
                                alt="Item"
                                style={{
                                    maxWidth: '100%',
                                    maxHeight: 400,
                                    objectFit: 'contain',
                                    borderRadius: 8
                                }}
                            />
                        </a>
                    </div>
                    <div className="d-flex align-items-center gap-2 mt-3">
                        <input
                            type="file"
                            ref={fileInputRef}
                            accept="image/*"
                            className="form-control"
                            onChange={handleFileInputChange}
                            disabled={photoUploading}
                            style={{ flex: 1 }}
                        />
                        <Button
                            type="button"
                            onClick={() => setShowCamera(true)}
                            disabled={photoUploading}
                        >
                            Camera
                        </Button>
                    </div>
                </div>
            ) : (
                <div className="d-flex align-items-center gap-2">
                    <input
                        type="file"
                        ref={fileInputRef}
                        accept="image/*"
                        className="form-control"
                        onChange={handleFileInputChange}
                        disabled={photoUploading}
                        style={{ flex: 1 }}
                    />
                    <Button
                        type="button"
                        onClick={() => setShowCamera(true)}
                        disabled={photoUploading}
                    >
                        Camera
                    </Button>
                </div>
            )}

            {photoUploading && (
                <div className="alert alert-info mt-2">
                    <div className="d-flex align-items-center">
                        <div className="spinner-border spinner-border-sm me-2" role="status">
                            <span className="visually-hidden">Uploading...</span>
                        </div>
                        <span>Uploading photo...</span>
                    </div>
                </div>
            )}

            {photoError && (
                <div className="alert alert-danger mt-2">
                    <strong>Error: </strong>{photoError}
                    {photoError.includes('not supported') && (
                        <div className="mt-2">
                            <small>
                                Try using a different browser like Chrome or Safari, or check if your device has a camera.
                                On some mobile devices, you may need to allow camera access in your browser settings.
                            </small>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default PhotoUpload;
