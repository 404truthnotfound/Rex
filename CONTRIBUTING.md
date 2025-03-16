# Contributing to REX

Thank you for considering contributing to REX! This document outlines the process for contributing to the project.

## Code of Conduct

By participating in this project, you agree to maintain a respectful and inclusive environment for everyone.

## How to Contribute

### Reporting Bugs

If you find a bug, please create an issue with the following information:

- A clear, descriptive title
- Steps to reproduce the bug
- Expected behavior
- Actual behavior
- Screenshots (if applicable)
- Browser and extension version

### Suggesting Features

Feature suggestions are welcome! Please create an issue with:

- A clear, descriptive title
- Detailed description of the proposed feature
- Any relevant mockups or examples
- Explanation of why this feature would be useful

### Pull Requests

1. Fork the repository
2. Create a new branch: `git checkout -b feature-branch-name`
3. Make your changes
4. Test your changes thoroughly
5. Commit your changes: `git commit -m 'Add some feature'`
6. Push to the branch: `git push origin feature-branch-name`
7. Submit a pull request

## Development Setup

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

## Coding Standards

- Follow the existing code style
- Write clear, descriptive commit messages
- Add comments for complex logic
- Update documentation for any changed functionality

## Testing

- Add tests for new features
- Ensure all existing tests pass
- Test across all supported platforms (Claude, ChatGPT, Gemini)

## Documentation

- Update README.md with any new features or changes
- Document any new API endpoints or parameters
- Keep code comments up-to-date

Thank you for contributing to REX!
