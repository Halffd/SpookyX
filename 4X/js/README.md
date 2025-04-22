# JavaScript Files for 4X Extension

This directory contains the JavaScript files for the 4X extension.

## Files

- `background.js` - Background service worker for the extension
- `content.js` - Main content script that runs on archive sites
- `options.js` - Script for the options page

## Code Structure

### Background Script (`background.js`)

The background script handles:
- Extension installation and updates
- Communication between the popup and content scripts
- Data storage and retrieval using Chrome's storage API
- Managing cached post data

### Content Script (`content.js`)

The content script runs on all supported archive sites and contains:
- Main functionality for expanding quoted posts
- Fetching and processing post data from archive APIs
- User interface enhancements (settings panel, buttons)
- Event listeners for user interactions
- Settings application and persistence
- Post highlighting and filtering features

### Options Script (`options.js`)

The options script handles:
- Loading and saving user settings
- Populating the options UI with current settings
- Form validation
- Cache management

## Coding Guidelines

When modifying or adding code, please follow these guidelines:

1. **Use modern JavaScript**: Use ES6+ features but ensure compatibility with Chrome.

2. **Comment your code**: Add comments to explain complex logic and functions.

3. **Error handling**: Always include proper error handling, especially for API calls.

4. **Avoid global namespace pollution**: Use IIFEs or modules to encapsulate code.

5. **Performance considerations**: Be mindful of performance, especially in code that runs frequently.

6. **Debug logging**: Use the built-in debug logging function (only outputs when debug mode is enabled).

## Adding New Features

When adding new features:

1. Determine the appropriate file for your feature
2. Follow the existing code patterns and style
3. Add appropriate configuration options in the settings UI if applicable
4. Include thorough error handling
5. Test on multiple archive sites to ensure compatibility 