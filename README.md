# REX: Advanced AI Memory Enhancement System

A browser extension that provides enhanced memory capabilities across all AI chat platforms, eliminating the need for repetitive explanations by maintaining conversation history and intelligently injecting relevant context.

## Features

- **Cross-Platform Memory**: Works with all major AI platforms (Claude, ChatGPT, Gemini)
- **Hybrid Storage Approach**: Stores both full conversation logs and structured summaries
- **Memory Activation Triggers**: Responds to specific recall phrases
- **Privacy-First Design**: All data stored locally by default
- **Zero-Friction Experience**: Seamlessly injects context without disrupting workflow

## Memory Categories

- **Topics**: Subject domains, concepts, and themes discussed
- **People**: Individuals mentioned, their relationships and roles
- **Things**: Objects, products, technologies, tools
- **Projects**: User initiatives, goals, ongoing work

## Installation

### Easy Installation (For All Users)

1. Download the latest release ZIP file from the [Releases](https://github.com/yourusername/REX/releases) page
2. Open Chrome and navigate to `chrome://extensions`
3. Enable "Developer mode" using the toggle in the top-right corner
4. Drag and drop the ZIP file into the Chrome extensions page
5. Click "Add extension" when prompted

### Developer Installation

1. Clone the repository: `git clone https://github.com/yourusername/REX.git`
2. Install dependencies: `npm install`
3. Start the backend server: `npm start` or `python app.py`
4. Load the extension in Chrome:
   - Navigate to `chrome://extensions`
   - Enable "Developer mode"
   - Click "Load unpacked" and select the `extension` directory

## Usage

Once installed, you can use REX with any supported AI chat platform:

- Visit Claude, ChatGPT, or Gemini
- Type commands like:
  - `REX, recall [topic]`
  - `REX, remember our discussion about [topic]`
  - `REX, what did we say about [topic]`
  - `REX, update on [project]`

REX will automatically enhance the AI's memory with relevant information from your past conversations.

## Technical Implementation

- **Platform Detection**: URL-based detection with flexible DOM scraping
- **Conversation Capture**: Extracts and summarizes conversations
- **Context Injection**: Monitors for activation phrases and injects relevant context
- **Backend API**: FastAPI server for advanced memory processing
- **Local Storage**: Fallback storage for offline operation

## Project Structure

```
REX/
├── api/                  # API endpoints
├── app.py                # FastAPI application entry point
├── conversation_manager/ # Conversation processing
├── extension/            # Browser extension
│   ├── background/       # Background scripts
│   ├── content/          # Content scripts
│   ├── icons/            # Extension icons
│   └── popup/            # Extension popup interface
├── memory_system/        # Memory management
├── models/               # Data models
├── tests/                # Test cases
└── utils/                # Utility functions
```

## Development

### Backend (Python)

1. Create a virtual environment: `python -m venv venv`
2. Activate the virtual environment:
   - Windows: `venv\Scripts\activate`
   - macOS/Linux: `source venv/bin/activate`
3. Install dependencies: `pip install -r requirements.txt`
4. Run the server: `python app.py`

### Extension (JavaScript)

1. Navigate to the extension directory: `cd extension`
2. Make your changes to the extension code
3. Load the extension in Chrome for testing

## Building for Distribution

To build the extension for distribution:

```bash
npm run build
```

This will create a ZIP file in the `dist` directory that can be distributed and installed in Chrome.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
