import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import axios from 'axios';
import AdminPage from './AdminPage';

// Mock axios
jest.mock('axios');

// Mock response data
const mockCategories = [
  { id: 1, name: 'Electronics' },
  { id: 2, name: 'Books' }
];

const mockSpecifications = [
  {
    key: 'brand',
    label: 'Brand',
    type: 'text',
    placeholder: 'Enter brand name',
    display_order: 0
  },
  {
    key: 'color',
    label: 'Color',
    type: 'select',
    options: [
      { value: 'red', label: 'Red' },
      { value: 'blue', label: 'Blue' }
    ],
    display_order: 1
  }
];

describe('AdminPage Component', () => {
  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Set up default mock responses
    axios.get.mockImplementation((url) => {
      if (url === '/api/categories') {
        return Promise.resolve({ data: mockCategories });
      } else if (url.includes('/specifications_schema')) {
        return Promise.resolve({ data: mockSpecifications });
      }
      return Promise.reject(new Error('Not found'));
    });
    
    axios.post.mockResolvedValue({ data: { id: 3, name: 'New Category' } });
    axios.put.mockResolvedValue({ data: { id: 1, name: 'Updated Electronics' } });
    axios.delete.mockResolvedValue({ data: {} });
  });

  test('renders admin page with categories', async () => {
    render(
      <BrowserRouter>
        <AdminPage />
      </BrowserRouter>
    );

    // Check if the page title is rendered
    expect(screen.getByText('Admin Panel')).toBeInTheDocument();
    
    // Wait for categories to load
    await waitFor(() => {
      expect(screen.getByText('Electronics')).toBeInTheDocument();
      expect(screen.getByText('Books')).toBeInTheDocument();
    });
    
    // Check if the "Add Category" button is rendered
    expect(screen.getByText('Add Category')).toBeInTheDocument();
  });

  test('adds a new category', async () => {
    render(
      <BrowserRouter>
        <AdminPage />
      </BrowserRouter>
    );

    // Type a new category name
    const input = screen.getByLabelText('New category name');
    fireEvent.change(input, { target: { value: 'New Category' } });
    
    // Submit the form
    const addButton = screen.getByText('Add Category');
    fireEvent.click(addButton);
    
    // Check if axios.post was called with the correct arguments
    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith('/api/categories', { name: 'New Category' });
    });
  });

  test('opens edit category modal', async () => {
    render(
      <BrowserRouter>
        <AdminPage />
      </BrowserRouter>
    );

    // Wait for categories to load
    await waitFor(() => {
      expect(screen.getByText('Electronics')).toBeInTheDocument();
    });
    
    // Click the edit button for the first category
    const editButtons = screen.getAllByLabelText('edit');
    fireEvent.click(editButtons[0]);
    
    // Check if the edit modal is opened
    await waitFor(() => {
      expect(screen.getByText('Edit Category')).toBeInTheDocument();
      const input = screen.getByLabelText('Category Name');
      expect(input.value).toBe('Electronics');
    });
  });

  test('opens specifications modal', async () => {
    render(
      <BrowserRouter>
        <AdminPage />
      </BrowserRouter>
    );

    // Wait for categories to load
    await waitFor(() => {
      expect(screen.getByText('Electronics')).toBeInTheDocument();
    });
    
    // Click the specifications button for the first category
    const specButtons = screen.getAllByLabelText('specifications');
    fireEvent.click(specButtons[0]);
    
    // Check if specifications are fetched
    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith('/api/categories/1/specifications_schema');
    });
    
    // Check if the specifications modal is opened
    await waitFor(() => {
      expect(screen.getByText(/Edit Specifications for/)).toBeInTheDocument();
      expect(screen.getByText('Add Specification Field')).toBeInTheDocument();
    });
  });
});
