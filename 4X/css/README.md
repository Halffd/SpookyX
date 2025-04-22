# CSS Styles for 4X Extension

This directory contains the stylesheets for the 4X extension.

## Files

- `main.css` - The main stylesheet for the extension content

## Style Guidelines

When modifying or adding styles, please follow these guidelines:

1. **Use !important sparingly**: While we need to use `!important` to override site styles, try to be selective with its use.

2. **Keep selectors specific**: To avoid unintended style changes, use specific selectors.

3. **Group related styles**: Keep related styles together (e.g., all post styles, all button styles, etc.).

4. **Comment your styles**: Add comments to explain the purpose of style groups.

5. **Consider cross-browser compatibility**: Test styles in different browsers.

6. **Dark mode support**: Include dark mode variants for all styles where appropriate.

## Structure

The main stylesheet is organized into these sections:

- Post styling
- Backlink styling
- Loading and error messages
- Image styling
- Settings UI elements
- Post highlight styles
- Dark mode overrides
- Compact mode styles
- Media controls
- Notifications and indicators

## Adding Custom Styles

When adding new styles, please place them in the appropriate section and follow the existing naming conventions. If creating a new section, add a clear comment header. 