# API Request Optimization

This document explains the changes made to optimize API requests in the Collectify frontend.

## Issues Identified

1. **Multiple Unnecessary API Calls:**
   - ItemForm component was making API calls even when not visible
   - Missing cancellation of in-flight requests when new ones are triggered
   - No debouncing on search inputs causing a request for every keystroke

2. **Memory Leaks:**
   - API requests were not being cancelled on component unmount
   - No cleanup for timeouts and event listeners

## Implemented Solutions

### 1. Conditional API Calls

- ItemForm now only makes API calls when it's visible (`show` prop is true)
- The SearchPage only renders ItemForm when it's actually needed
- Added dependency on `show` state in useEffect calls

### 2. Request Cancellation

- Created `apiUtils.js` utility with functions for cancellable requests
- Used AbortController to properly cancel in-flight requests
- Implemented cleanup functions in useEffect hooks

### 3. Debouncing

- Added debounce utility function to prevent rapid-fire API calls
- Applied 500ms debounce to search input changes
- Managed debounce timeouts with useRef for proper cleanup

### 4. Centralized API Management

- Created reusable utility functions for API requests
- Implemented consistent error handling
- Added request ID system to track and cancel related requests

## Files Modified

1. **SearchPage.jsx**
   - Added debouncing to search inputs
   - Conditionally rendering ItemForm
   - Added cleanup for pending requests
   - Improved error handling

2. **ItemForm.jsx**
   - Added conditional fetching based on visibility
   - Implemented request cancellation
   - Added proper dependency arrays to useEffect

3. **New file: apiUtils.js**
   - Created utility functions for API management
   - Implemented debounce utility
   - Added request cancellation helpers

## Best Practices Implemented

1. **Avoid Unnecessary Renders**
   - Components now render conditionally based on state

2. **Cleanup Resources**
   - All timers, API calls, and subscriptions are properly cleaned up

3. **Prevent Redundant Requests**
   - Debouncing input changes
   - Cancelling superseded requests

4. **Error Handling**
   - Proper error catching and state updates
   - Distinction between cancelled requests and actual errors

## Performance Improvements

- Fewer network requests
- Reduced server load
- Faster UI response
- No memory leaks
- Better resource utilization

## Usage Guidelines

When making API calls in React components:

1. Always consider when the request should happen (conditional fetching)
2. Implement cancellation for requests that may be superseded
3. Debounce input-triggered requests
4. Clean up all resources on component unmount
5. Use the apiUtils helpers for consistent handling
