import { useState, useEffect, useCallback } from 'react';
import { api } from '../authUtils';

/**
 * Custom hook for managing categories in the admin panel
 */
const useCategories = () => {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

    const showSnackbar = useCallback((message, severity = 'info') => {
        setSnackbar({ open: true, message, severity });
    }, []);

    const closeSnackbar = useCallback(() => {
        setSnackbar(prev => ({ ...prev, open: false }));
    }, []);

    // Fetch categories from API
    const fetchCategories = useCallback(async () => {
        setLoading(true);

        try {
            const response = await api.get('/categories');
            setCategories(response.data);
            setLoading(false);
        } catch (error) {
            showSnackbar('Error fetching categories: ' + (error.response?.data?.error || error.message), 'error');
            setLoading(false);
        }
    }, [showSnackbar]);

    // Fetch categories on mount
    useEffect(() => {
        fetchCategories();
    }, [fetchCategories]);

    // Add a new category
    const addCategory = useCallback(async (categoryName) => {
        try {
            const response = await api.post('/categories', { name: categoryName });
            setCategories(prev => [...prev, response.data].sort((a, b) => a.name.localeCompare(b.name)));
            showSnackbar('Category added successfully', 'success');
        } catch (error) {
            showSnackbar('Error adding category: ' + (error.response?.data?.error || error.message), 'error');
        }
    }, [showSnackbar]);

    // Update a category name
    const updateCategory = useCallback(async (updatedCategory) => {
        try {
            const response = await api.put(`/categories/${updatedCategory.id}`, { name: updatedCategory.name });
            setCategories(prev => prev.map(cat =>
                cat.id === updatedCategory.id ? { ...cat, name: response.data.name } : cat
            ));
            showSnackbar('Category updated successfully', 'success');
            return true;
        } catch (error) {
            showSnackbar('Error updating category: ' + (error.response?.data?.error || error.message), 'error');
            return false;
        }
    }, [showSnackbar]);

    // Delete a category
    const deleteCategory = useCallback(async (categoryId) => {
        try {
            await api.delete(`/categories/${categoryId}`);
            setCategories(prev => prev.filter(cat => cat.id !== categoryId));
            showSnackbar('Category deleted successfully', 'success');
            return true;
        } catch (error) {
            showSnackbar('Error deleting category: ' + (error.response?.data?.error || error.message), 'error');
            return false;
        }
    }, [showSnackbar]);

    return {
        categories,
        loading,
        snackbar,
        showSnackbar,
        closeSnackbar,
        fetchCategories,
        addCategory,
        updateCategory,
        deleteCategory
    };
};

export default useCategories;
