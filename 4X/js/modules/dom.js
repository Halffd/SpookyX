/**
 * DOM manipulation utilities for the 4X extension
 * Provides helper methods for working with the DOM
 */
(function() {
    // Initialize namespace if it doesn't exist
    if (!window.FourX) window.FourX = {};
    
    // DOM utilities
    FourX.DOM = {
        /**
         * Initialize DOM utilities
         */
        init: function() {
            // Nothing to initialize
            FourX.debug("DOM utilities initialized");
        },
        
        /**
         * Create an element with attributes and children
         * @param {string} tagName - The tag name of the element to create
         * @param {object} attributes - Key-value pairs of attributes to set
         * @param {Array|string|Element} children - Child elements or text to append
         * @returns {Element} The created element
         */
        createElement: function(tagName, attributes = {}, children = []) {
            const element = document.createElement(tagName);
            
            // Set attributes
            Object.entries(attributes).forEach(([key, value]) => {
                if (key === 'className') {
                    element.className = value;
                } else if (key === 'style' && typeof value === 'object') {
                    Object.entries(value).forEach(([prop, val]) => {
                        element.style[prop] = val;
                    });
                } else if (key.startsWith('on') && typeof value === 'function') {
                    const eventName = key.slice(2).toLowerCase();
                    element.addEventListener(eventName, value);
                } else if (key === 'html') {
                    element.innerHTML = value;
                } else if (key === 'text') {
                    element.textContent = value;
                } else {
                    element.setAttribute(key, value);
                }
            });
            
            // Add children
            if (children) {
                if (!Array.isArray(children)) {
                    children = [children];
                }
                
                children.forEach(child => {
                    if (child instanceof Element) {
                        element.appendChild(child);
                    } else if (typeof child === 'string') {
                        element.appendChild(document.createTextNode(child));
                    }
                });
            }
            
            return element;
        },
        
        /**
         * Find a post element by its ID
         * @param {string} postId - The ID of the post to find
         * @returns {Element|null} The post element or null if not found
         */
        findPostElement: function(postId) {
            // Handle different post ID formats
            if (postId.startsWith('p')) {
                return document.getElementById(postId);
            } else {
                return document.getElementById(`p${postId}`);
            }
        },
        
        /**
         * Create a button element with standard styling
         * @param {string} text - Text for the button
         * @param {Function} onClick - Click handler
         * @param {string} className - Additional class name
         * @returns {Element} Button element
         */
        createButton: function(text, onClick, className = '') {
            return this.createElement('button', {
                className: `fourx-button ${className}`,
                text: text,
                onClick: onClick
            });
        },
        
        /**
         * Create a toggle switch for settings
         * @param {string} id - Input ID
         * @param {boolean} checked - Initial state
         * @param {Function} onChange - Change handler
         * @returns {Element} Label containing the toggle switch
         */
        createToggleSwitch: function(id, checked, onChange) {
            const input = this.createElement('input', {
                type: 'checkbox',
                id: id,
                checked: checked,
                onChange: onChange
            });
            
            const slider = this.createElement('span', {
                className: 'slider'
            });
            
            return this.createElement('label', {
                className: 'toggle-switch',
                for: id
            }, [input, slider]);
        },
        
        /**
         * Add CSS to the page
         * @param {string} css - CSS string to add
         * @param {string} id - Optional ID for the style element
         * @returns {Element} The created style element
         */
        addCSS: function(css, id = null) {
            const style = document.createElement('style');
            style.textContent = css;
            
            if (id) {
                style.id = id;
                // Remove existing style with same ID if present
                const existing = document.getElementById(id);
                if (existing) {
                    existing.remove();
                }
            }
            
            document.head.appendChild(style);
            return style;
        },
        
        /**
         * Create a dropdown select element
         * @param {string} id - Element ID
         * @param {Array} options - Array of {value, text} objects
         * @param {string} selectedValue - Currently selected value
         * @param {Function} onChange - Change handler
         * @returns {Element} Select element
         */
        createSelect: function(id, options, selectedValue, onChange) {
            const select = this.createElement('select', {
                id: id,
                onChange: onChange
            });
            
            options.forEach(option => {
                const optionElement = this.createElement('option', {
                    value: option.value,
                    text: option.text
                });
                
                if (option.value === selectedValue) {
                    optionElement.selected = true;
                }
                
                select.appendChild(optionElement);
            });
            
            return select;
        },
        
        /**
         * Show a notification message that disappears after a delay
         * @param {string} message - Message text
         * @param {string} type - Message type (info, success, error, warning)
         * @param {number} duration - Duration in ms to show the message
         */
        showNotification: function(message, type = 'info', duration = 3000) {
            // Create notification container if it doesn't exist
            let container = document.getElementById('fourx-notifications');
            if (!container) {
                container = this.createElement('div', {
                    id: 'fourx-notifications'
                });
                document.body.appendChild(container);
            }
            
            // Create notification element
            const notification = this.createElement('div', {
                className: `fourx-notification fourx-${type}`,
                text: message
            });
            
            // Add to container
            container.appendChild(notification);
            
            // Animate in
            setTimeout(() => {
                notification.classList.add('active');
            }, 10);
            
            // Remove after duration
            setTimeout(() => {
                notification.classList.remove('active');
                
                // Remove from DOM after animation
                setTimeout(() => {
                    notification.remove();
                }, 300);
            }, duration);
            
            return notification;
        },
        
        /**
         * Insert element after a reference element
         * @param {Element} newElement - Element to insert
         * @param {Element} referenceElement - Element to insert after
         * @returns {Element} The inserted element
         */
        insertAfter: function(newElement, referenceElement) {
            if (!referenceElement.parentNode) return null;
            
            if (referenceElement.nextSibling) {
                referenceElement.parentNode.insertBefore(newElement, referenceElement.nextSibling);
            } else {
                referenceElement.parentNode.appendChild(newElement);
            }
            
            return newElement;
        },
        
        /**
         * Generate a unique ID for DOM elements
         * @param {string} prefix - Prefix for the ID
         * @returns {string} Unique ID
         */
        generateId: function(prefix = 'fourx') {
            return `${prefix}-${Math.random().toString(36).substring(2, 10)}`;
        },
        
        /**
         * Create a modal dialog
         * @param {string} title - Dialog title
         * @param {Element|string} content - Dialog content
         * @param {object} options - Additional options
         * @returns {object} Dialog controller with show/hide methods
         */
        createModal: function(title, content, options = {}) {
            const id = this.generateId('modal');
            
            // Create overlay
            const overlay = this.createElement('div', {
                className: 'fourx-modal-overlay',
                id: `${id}-overlay`
            });
            
            // Create close button
            const closeButton = this.createElement('button', {
                className: 'fourx-modal-close',
                text: '×',
                onClick: () => this.hideModal(id)
            });
            
            // Create title element
            const titleElement = this.createElement('div', {
                className: 'fourx-modal-title',
                text: title
            });
            
            // Create header
            const header = this.createElement('div', {
                className: 'fourx-modal-header'
            }, [titleElement, closeButton]);
            
            // Create content container
            const contentElement = this.createElement('div', {
                className: 'fourx-modal-content'
            });
            
            // Add content
            if (typeof content === 'string') {
                contentElement.innerHTML = content;
            } else if (content instanceof Element) {
                contentElement.appendChild(content);
            }
            
            // Create footer if buttons provided
            let footer = null;
            if (options.buttons && options.buttons.length > 0) {
                footer = this.createElement('div', {
                    className: 'fourx-modal-footer'
                });
                
                options.buttons.forEach(button => {
                    const buttonElement = this.createButton(
                        button.text, 
                        button.onClick || (() => this.hideModal(id)),
                        button.className || ''
                    );
                    footer.appendChild(buttonElement);
                });
            }
            
            // Create modal
            const modal = this.createElement('div', {
                className: 'fourx-modal',
                id: id
            }, [header, contentElement, footer].filter(Boolean));
            
            // Add modal to overlay
            overlay.appendChild(modal);
            
            // Add to body
            document.body.appendChild(overlay);
            
            return {
                id: id,
                element: modal,
                overlay: overlay,
                show: () => this.showModal(id),
                hide: () => this.hideModal(id)
            };
        },
        
        /**
         * Show a modal dialog
         * @param {string} id - Modal ID
         */
        showModal: function(id) {
            const overlay = document.getElementById(`${id}-overlay`);
            if (overlay) {
                overlay.classList.add('active');
                document.body.classList.add('fourx-modal-open');
            }
        },
        
        /**
         * Hide a modal dialog
         * @param {string} id - Modal ID
         */
        hideModal: function(id) {
            const overlay = document.getElementById(`${id}-overlay`);
            if (overlay) {
                overlay.classList.remove('active');
                document.body.classList.remove('fourx-modal-open');
                
                // Remove after animation
                setTimeout(() => {
                    overlay.remove();
                }, 300);
            }
        }
    };
})(); 