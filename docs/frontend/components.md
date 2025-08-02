# Frontend Components

This document details the reusable components used throughout the Collectify frontend application.

## Overview

Components in the Collectify frontend are organized into two main categories:

1. **UI Components**: Reusable, presentation-focused components in the `components/` directory
2. **Container Components**: Page-level components that handle data and business logic in the `containers/` directory

## UI Components

### Button

**File**: `components/Button.jsx`

A customized button component that extends Material UI's Button component.

**Props**:
- `variant`: Button style variant ('contained', 'outlined', 'text')
- `color`: Button color ('primary', 'secondary', 'error', etc.)
- `onClick`: Function to call when button is clicked
- `disabled`: Whether the button is disabled
- `children`: Button content/label
- `...props`: All other props are passed to the underlying Material UI Button

**Example Usage**:
```jsx
<Button 
  variant="contained" 
  color="primary" 
  onClick={handleSubmit}
>
  Save
</Button>
```

### Input

**File**: `components/Input.jsx`

A form input component that wraps Material UI's TextField component.

**Props**:
- `label`: Input label
- `name`: Input name attribute
- `value`: Input value
- `onChange`: Function to handle value changes
- `type`: Input type ('text', 'password', 'email', etc.)
- `error`: Error message (if any)
- `required`: Whether the field is required
- `...props`: All other props are passed to the underlying TextField

**Example Usage**:
```jsx
<Input
  label="Username"
  name="username"
  value={username}
  onChange={handleChange}
  required
  error={errors.username}
/>
```

### Modal

**File**: `components/Modal.jsx`

A modal dialog component built on Material UI's Dialog component.

**Props**:
- `open`: Whether the modal is open
- `onClose`: Function to call when the modal is closed
- `title`: Modal title
- `children`: Modal content
- `actions`: Modal footer actions (usually buttons)
- `maxWidth`: Maximum width of the modal ('xs', 'sm', 'md', 'lg', 'xl')

**Example Usage**:
```jsx
<Modal
  open={isOpen}
  onClose={handleClose}
  title="Add New Item"
  actions={
    <>
      <Button onClick={handleClose} color="secondary">Cancel</Button>
      <Button onClick={handleSave} color="primary">Save</Button>
    </>
  }
>
  <ItemForm onSubmit={handleSave} />
</Modal>
```

### Navbar

**File**: `components/Navbar.jsx`

A navigation bar component that displays the application logo, navigation links, and user authentication status.

**Props**:
- `title`: Application title to display
- `links`: Navigation links to display

**Example Usage**:
```jsx
<Navbar 
  title="Collectify" 
  links={[
    { to: '/', label: 'Home' },
    { to: '/admin', label: 'Admin', requiresAuth: true }
  ]} 
/>
```

### ProtectedRoute

**File**: `components/ProtectedRoute.jsx`

A route component that restricts access to authenticated users, redirecting unauthenticated users to the login page.

**Props**:
- `element`: The component to render if authenticated
- `...rest`: All other props are passed to the underlying Route component

**Example Usage**:
```jsx
<Route 
  path="/admin" 
  element={<ProtectedRoute element={<AdminPage />} />} 
/>
```

## Container Components

### AdminPage

**File**: `containers/AdminPage.jsx`

The admin dashboard page where administrators can manage categories, users, and application settings.

**Features**:
- Category management (create, update, delete)
- User management (view, update, delete)
- Specification schema management
- Admin settings

**Example Usage**:
```jsx
<Route path="/admin" element={<ProtectedRoute element={<AdminPage />} />} />
```

### ItemForm

**File**: `containers/ItemForm.jsx`

A form for creating and editing collection items.

**Props**:
- `item`: Initial item data (for editing)
- `onSubmit`: Function to call with form data on submission
- `categories`: Available categories for selection

**Features**:
- Basic item information (name, category, description)
- Dynamic specification fields based on category
- File uploads for item photos
- URL management

**Example Usage**:
```jsx
<ItemForm 
  item={selectedItem} 
  onSubmit={handleSubmit} 
  categories={categories} 
/>
```

### LoginPage

**File**: `containers/LoginPage.jsx`

The user authentication page with login and registration forms.

**Features**:
- User login form
- User registration form
- Authentication error handling
- Redirect after successful authentication

**Example Usage**:
```jsx
<Route path="/login" element={<LoginPage />} />
```

### SearchPage

**File**: `containers/SearchPage.jsx`

The main page of the application where users can search, filter, and view collection items.

**Features**:
- Item listing with pagination
- Search functionality
- Category filtering
- Item details view
- Quick actions for authenticated users

**Example Usage**:
```jsx
<Route path="/" element={<SearchPage />} />
```

## Context Providers

### AuthContext

**File**: `context/AuthContext.jsx`

A React context provider that manages authentication state and methods.

**Provided Values**:
- `user`: The current authenticated user (or null)
- `token`: The JWT authentication token
- `isAuthenticated`: Whether a user is currently authenticated
- `login`: Function to authenticate a user
- `logout`: Function to log out the current user
- `register`: Function to register a new user

**Example Usage**:
```jsx
// In App.js
<AuthProvider>
  <Router>
    {/* Routes */}
  </Router>
</AuthProvider>

// In a component
import { useAuth } from '../context/AuthContext';

function MyComponent() {
  const { isAuthenticated, user, logout } = useAuth();
  
  return (
    <div>
      {isAuthenticated ? (
        <>
          <p>Welcome, {user.username}!</p>
          <button onClick={logout}>Log out</button>
        </>
      ) : (
        <p>Please log in</p>
      )}
    </div>
  );
}
```

## Component Composition

Components are composed to create complex UI elements and pages:

```jsx
// Example of component composition in a page
function ItemDetailPage() {
  const { id } = useParams();
  const [item, setItem] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const { isAuthenticated } = useAuth();
  
  // Fetch item data...
  
  return (
    <div className="item-detail-page">
      <Navbar />
      
      {item ? (
        <>
          <h1>{item.name}</h1>
          <p>{item.description}</p>
          
          {isAuthenticated && (
            <Button 
              variant="contained" 
              color="primary" 
              onClick={() => setIsEditing(true)}
            >
              Edit
            </Button>
          )}
          
          <Modal
            open={isEditing}
            onClose={() => setIsEditing(false)}
            title="Edit Item"
          >
            <ItemForm 
              item={item} 
              onSubmit={handleUpdate} 
            />
          </Modal>
        </>
      ) : (
        <p>Loading...</p>
      )}
    </div>
  );
}
```

## Styling Approach

Components are styled using a combination of:

1. **Material UI Theming**: Global theme settings applied through ThemeProvider
2. **CSS Modules**: Scoped styles for specific components (e.g., `SearchPage.module.css`)
3. **Inline Styles**: Used sparingly for dynamic or conditional styling

## Component Best Practices

When creating or modifying components, follow these guidelines:

1. **Single Responsibility**: Each component should have a single, well-defined purpose
2. **Prop Validation**: Use PropTypes to document and validate component props
3. **Reusability**: UI components should be reusable across different parts of the application
4. **Separation of Concerns**: Keep presentation and business logic separate
5. **Accessibility**: Ensure components meet accessibility standards (ARIA attributes, keyboard navigation, etc.)
6. **Performance**: Optimize components for performance (memoization, virtualization, etc. when necessary)
