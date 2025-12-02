import { useState, useCallback } from 'react';
import { api } from '../authUtils';

/**
 * Custom hook for managing specifications for categories
 */
const useSpecifications = (showSnackbar) => {
    const [specifications, setSpecifications] = useState([]);
    const [draggedSpecIndex, setDraggedSpecIndex] = useState(null);

    // Fetch specifications schema for a category
    const fetchSpecificationsSchema = useCallback(async (categoryId) => {
        try {
            const response = await api.get(`/categories/${categoryId}/specifications_schema`);

            // Process the response data based on its structure
            let specs;
            if (Array.isArray(response.data)) {
                // It's already an array, just sort it
                specs = response.data.sort((a, b) =>
                    (a.display_order || 0) - (b.display_order || 0)
                );
            } else if (typeof response.data === 'object') {
                // It's an object, convert to array
                specs = Object.entries(response.data).map(([key, spec], index) => ({
                    key,
                    ...spec,
                    display_order: spec.display_order || index
                }));
                //Sort by display_order
                specs.sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
            } else {
                // Unexpected format
                specs = [];
                console.error('Unexpected format for specifications schema:', response.data);
            }

            setSpecifications(specs);
            return specs;
        } catch (error) {
            console.error('Error fetching specifications:', error);
            setSpecifications([]);
            if (showSnackbar) {
                showSnackbar('Error fetching specifications: ' + (error.response?.data?.error || error.message), 'error');
            }
            return [];
        }
    }, [showSnackbar]);

    // Add a new specification field
    const addSpecificationField = useCallback(() => {
        setSpecifications(prev => {
            const currentSpecs = prev;
            // Calculate the next display order (should be the highest + 1)
            const nextDisplayOrder = currentSpecs.length > 0
                ? Math.max(...currentSpecs.map(spec => spec.display_order || 0)) + 1
                : 0;

            // Create new spec with display order at the end
            const newSpec = {
                key: '',
                label: '',
                type: 'text',
                placeholder: '',
                display_order: nextDisplayOrder // Add new fields at the bottom
            };

            return [...currentSpecs, newSpec]; // Add to the end of the array
        });
    }, []);

    // Update a specification field
    const updateSpecificationField = useCallback((index, field, value) => {
        setSpecifications(prev => {
            const updatedSpecs = [...prev];

            // If we're updating a specific field
            if (typeof index === 'number') {
                updatedSpecs[index] = { ...updatedSpecs[index], [field]: value };

                // If changing type, reset type-specific fields
                if (field === 'type') {
                    if (value === 'number') {
                        updatedSpecs[index] = {
                            ...updatedSpecs[index],
                            min: undefined,
                            max: undefined,
                            step: 1,
                            options: undefined
                        };
                    } else if (value === 'select') {
                        updatedSpecs[index] = {
                            ...updatedSpecs[index],
                            options: [],
                            min: undefined,
                            max: undefined,
                            step: undefined
                        };
                    } else {
                        updatedSpecs[index] = {
                            ...updatedSpecs[index],
                            min: undefined,
                            max: undefined,
                            step: undefined,
                            options: undefined
                        };
                    }
                }
            }
            // If we're replacing the entire specifications array (for reordering)
            else if (Array.isArray(index)) {
                return index;
            }

            return updatedSpecs;
        });
    }, []);

    // Remove a specification field
    const removeSpecificationField = useCallback((index) => {
        setSpecifications(prev => {
            const updatedSpecs = [...prev];
            updatedSpecs.splice(index, 1);

            // Update display_order for remaining items
            const reorderedSpecs = updatedSpecs.map((spec, idx) => ({
                ...spec,
                display_order: idx
            }));

            return reorderedSpecs;
        });
    }, []);

    // Save specifications schema
    const saveSpecificationsSchema = useCallback(async (categoryId) => {
        // Validate required fields
        const hasEmptyKeys = specifications.some(spec => !spec.key || !spec.key.trim());
        if (hasEmptyKeys) {
            if (showSnackbar) {
                showSnackbar('All specification fields must have a key', 'error');
            }
            return false;
        }

        try {
            // Make sure all spec objects have the required properties and correct format
            const formattedSpecs = specifications.map((spec, index) => ({
                key: spec.key,
                label: spec.label || spec.key,
                type: spec.type || 'text',
                placeholder: spec.placeholder || '',
                display_order: spec.display_order !== undefined ? spec.display_order : index,
                ...(spec.type === 'number' ? {
                    min: spec.min !== undefined ? Number(spec.min) : undefined,
                    max: spec.max !== undefined ? Number(spec.max) : undefined,
                    step: spec.step !== undefined ? Number(spec.step) : 1
                } : {}),
                ...(spec.type === 'select' ? {
                    options: Array.isArray(spec.options) ? spec.options : []
                } : {})
            }));

            // Send properly formatted specifications
            await api.put(
                `/categories/${categoryId}/specifications_schema`,
                formattedSpecs,
                { headers: { 'Content-Type': 'application/json' } }
            );

            if (showSnackbar) {
                showSnackbar('Specifications saved successfully', 'success');
            }
            return true;
        } catch (error) {
            console.error('Error saving specifications:', error);
            if (showSnackbar) {
                showSnackbar('Error saving specifications: ' + (error.response?.data?.error || error.message), 'error');
            }
            return false;
        }
    }, [specifications, showSnackbar]);

    // Drag and drop handlers for specifications reordering
    const handleDragStart = useCallback((e, index) => {
        setDraggedSpecIndex(index);
        // For better drag and drop visual feedback
        if (e.dataTransfer) {
            e.dataTransfer.effectAllowed = 'move';
        }
    }, []);

    const handleDragOver = useCallback((e) => {
        e.preventDefault();
    }, []);

    const handleDragEnd = useCallback(() => {
        setDraggedSpecIndex(null);
    }, []);

    const handleDrop = useCallback((e) => {
        e.preventDefault();
        const dropTarget = e.currentTarget;
        const dropIndex = parseInt(dropTarget.dataset.index || 0, 10);

        if (draggedSpecIndex === null || draggedSpecIndex === dropIndex) {
            return;
        }

        setSpecifications(prev => {
            const specs = [...prev];
            const draggedItem = specs[draggedSpecIndex];

            // Remove the dragged item
            specs.splice(draggedSpecIndex, 1);
            // Insert it at the new position
            specs.splice(dropIndex, 0, draggedItem);

            // Update display order for all items
            const reorderedSpecs = specs.map((spec, idx) => ({
                ...spec,
                display_order: idx
            }));

            return reorderedSpecs;
        });

        setDraggedSpecIndex(null);
    }, [draggedSpecIndex]);

    return {
        specifications,
        setSpecifications,
        fetchSpecificationsSchema,
        addSpecificationField,
        updateSpecificationField,
        removeSpecificationField,
        saveSpecificationsSchema,
        handleDragStart,
        handleDragOver,
        handleDragEnd,
        handleDrop
    };
};

export default useSpecifications;
