# 📁 File Organizer - Electron App

A cross-platform desktop application built with **Electron** and **Node.js** to organize your `.pdf`, `.docx`, and `.pptx` files based on keywords found inside the files. Perfect for sorting large folders of academic notes, office documents, and more.

---

## 🚀 Features

- 🔍 **Content-Based Sorting**: Reads and analyzes file content to identify keywords.
- 📄 Supports `.pdf`, `.docx`, and `.pptx` file types.
- 📁 **Recursive Folder Traversal**: Scans all subfolders automatically.
- ❌ Skips system-related folders like `node_modules`, `.git`, `build`, etc.
- 📤 **Moves Matching Files** to a target destination folder.
- 🖥️ Built using **Electron** with a native-feel desktop interface.
- 🔌 Uses **IPC communication** for seamless interaction between frontend and backend.

---

## 🛠️ Tech Stack

- **Electron** – Desktop shell
- **Node.js** – Backend file operations
- **pdf-parse** – PDF content extraction
- **mammoth** – `.docx` text extraction
- **xml2js + unzipper** – `.pptx` XML-based parsing
- **fs / fs.promises** – Node.js file system utilities

---

## 📦 Installation

```bash
git clone https://github.com/SachinKiragi/file-organizer.git
cd file-organizer
npm install
npm start
```
