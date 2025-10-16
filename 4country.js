// ==UserScript==
// @name         4chan Country Flag Labels
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Add country name labels next to flags on 4chan
// @author       arc x
// @match        https://boards.4chan.org/*
// @match        http://boards.4chan.org/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';
    
    function addCountryLabels() {
        const flags = document.querySelectorAll('.flag:not([data-labeled])');
        
        flags.forEach(flag => {
            const countryName = flag.title;
            if (countryName) {
                // Create label span
                const label = document.createElement('span');
                label.textContent = ` (${countryName})`;
                label.style.fontSize = '0.9em';
                label.style.color = '#b7c5d9';
                
                // Insert after the flag
                flag.parentNode.insertBefore(label, flag.nextSibling);
                
                // Mark as processed
                flag.setAttribute('data-labeled', 'true');
            }
        });
    }
    
    // Initial run
    addCountryLabels();
    
    // Watch for new posts
    const observer = new MutationObserver(addCountryLabels);
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
})();