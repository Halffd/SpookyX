# 4X Extension

![4X Logo](img/logo128.png)

## Archive Explorer for Image Boards

4X is a powerful Chrome extension that enhances the browsing experience on image board archive sites. Inspired by the functionality of userscripts like SpookyX, the 4X extension provides a modern, feature-rich way to navigate archives with improved performance and usability.

## Features

### Post Expansion
- Expand quoted posts directly in the current thread
- View all backlinks in one click
- Shift+click on any quoted post to expand it
- Auto-expand quotes on hover (optional)

### Interface Enhancements
- Dark mode for comfortable nighttime browsing
- Compact mode for denser content display
- Customizable font sizes and highlight colors
- Post highlighting for keywords

### Advanced Functionality
- Fast searching across archives
- Post caching to reduce API requests
- Content filtering options
- Robust error handling for failed requests
- Debug mode for troubleshooting

## Installation

### Chrome Web Store
Coming soon - the extension will be available on the Chrome Web Store.

### Manual Installation
1. Download or clone this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" (toggle in the top-right corner)
4. Click "Load unpacked" and select the `4X` folder
5. The extension should now be installed and active

## Supported Archives

4X works with most popular image board archives:

- archive.4plebs.org
- desuarchive.org
- archived.moe
- archive.nyafuu.org
- thebarchive.com
- arch.b4k.co
- archive.loveisover.me
- cuckchan.org
- 4ch.be
- archive.palanq.win
- ch.archive.horse
- boards.fireden.net
- archiveofsins.com
- archive.whatisthisimnotgoodwithcomputers.com
- magyarchan.net
- www.tokyochronos.net
- old.sage.moe
- arch.b4k.dev

## Usage

### Basic Navigation
Once installed, browse to any supported archive site. The 4X button will appear in the bottom-right corner of the page. Click it to open the settings panel.

### Expanding Posts
- Shift+click any quoted post to expand it and all its backlinks
- Click the "Expand All" button added to posts with quotes
- Toggle auto-expand in settings to automatically expand quotes on hover

### Customization
Access full settings through:
- The popup menu (click the extension icon in the toolbar)
- The "Full Settings" button in the quick settings panel
- The dedicated options page in Chrome's extension management

## Development

### Project Structure
```
4X/
├── manifest.json       # Extension manifest
├── css/
│   └── main.css        # Main stylesheet
├── js/
│   ├── background.js   # Background service worker
│   ├── content.js      # Main content script
│   └── options.js      # Options page script
├── popup/
│   ├── popup.html      # Popup interface
│   └── popup.js        # Popup functionality
├── options.html        # Full options page
└── img/                # Icons and images
```

### Building from Source
The extension is written in plain JavaScript, HTML, and CSS. No build step is required.

For development:
1. Make your changes to the source files
2. Reload the extension in Chrome's extension management page
3. Test your changes on supported archive sites

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Inspired by the original SpookyX userscript
- Thanks to all archive maintainers for their valuable service to the community
- Icon created with [Icon Kitchen](https://icon.kitchen/) 