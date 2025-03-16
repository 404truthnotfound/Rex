# REX: AI Chat History & Memory Enhancement

**Never lose important AI conversations again!** REX is a powerful browser extension that saves, searches, and enhances your chat history across Claude, ChatGPT, and Gemini.

![GitHub License](https://img.shields.io/github/license/yourusername/REX)
![GitHub release (latest by date)](https://img.shields.io/github/v/release/yourusername/REX)

## 🚀 Key Features

- **Complete Chat History Backup**: Automatically saves all your AI conversations locally
- **Cross-Platform Support**: Works seamlessly with Claude, ChatGPT, and Gemini
- **Smart Memory Recall**: Trigger memory recall with natural language commands
- **Privacy-First Design**: All data stored locally by default
- **Zero Learning Curve**: Just install and start using immediately
- **Conversation Search**: Find past discussions with powerful search capabilities
- **Context Injection**: Automatically enhances AI responses with relevant past information

## 🧠 How REX Enhances Your AI Experience

REX solves the biggest limitation of AI assistants - their limited context window and lack of long-term memory. With REX, you can:

- **Maintain Continuity**: Continue conversations from days or weeks ago
- **Avoid Repetition**: Never explain the same concepts multiple times
- **Build Knowledge**: Let your AI assistant learn and remember your preferences
- **Save Time**: Quickly recall past discussions without scrolling through history
- **Enhance Productivity**: Get more consistent and personalized AI assistance

## 📋 Memory Categories

REX intelligently organizes your conversations into useful categories:

- **Topics**: Subject domains, concepts, and themes discussed
- **People**: Individuals mentioned, their relationships and roles
- **Things**: Objects, products, technologies, tools
- **Projects**: User initiatives, goals, ongoing work

## 🔍 Usage Examples

Once installed, simply use natural language commands in your AI chats:

```
REX, recall our discussion about machine learning algorithms
```

```
REX, remember our discussion about my marketing strategy
```

```
REX, what did we say about database optimization?
```

```
REX, update on the website redesign project
```

## 💻 Installation

### Easy Installation (For All Users)

1. Download the latest release ZIP file from the [Releases](https://github.com/yourusername/REX/releases) page
2. Open Chrome and navigate to `chrome://extensions`
3. Enable "Developer mode" using the toggle in the top-right corner
4. Drag and drop the ZIP file into the Chrome extensions page
5. Click "Add extension" when prompted

That's it! REX will now automatically start saving your AI conversations.

### Developer Installation

1. Clone the repository: `git clone https://github.com/yourusername/REX.git`
2. Install dependencies: `npm install`
3. Start the backend server: `npm start` or `python app.py`
4. Load the extension in Chrome:
   - Navigate to `chrome://extensions`
   - Enable "Developer mode"
   - Click "Load unpacked" and select the `extension` directory

## 🔧 Technical Implementation

- **Platform Detection**: Automatically identifies which AI platform you're using
- **Conversation Capture**: Seamlessly extracts and summarizes conversations
- **Context Injection**: Monitors for activation phrases and injects relevant context
- **Backend API**: FastAPI server for advanced memory processing
- **Local Storage**: Fallback storage for offline operation

## 📁 Project Structure

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

## 🛠️ Development

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

## 📦 Building for Distribution

To build the extension for distribution:

```bash
npm run build
```

This will create a ZIP file in the `dist` directory that can be distributed and installed in Chrome.

## 👥 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🔍 Keywords

AI chat history, ChatGPT backup, Claude history, Gemini chat saver, AI conversation export, chat memory, AI chat scraper, conversation history, AI memory enhancement, chat backup tool, AI assistant memory, chat archive, AI chat export, conversation backup, chat history scraper
