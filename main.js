const {app, BrowserWindow, Menu, ipcMain, dialog} = require('electron')
const path = require('path')
const fs = require('fs')

let mainWindow;

const isDev = process.env.NODE_ENV !== 'production';

const createMainWindow = ()=>{
    mainWindow = new BrowserWindow({
        title: 'File Org',
        height: 600,
        width: isDev ? 1000 :  700,
        webPreferences: {
            contextIsolation: true,
            nodeIntegration: true,
            preload: path.join(__dirname, '/preload.js')
        }
    })

    if(isDev){
        mainWindow.webContents.openDevTools();
    }

    mainWindow.loadFile(path.join(__dirname, '/renderer/index.html'))
}



ipcMain.on('file:transfer', (e, options) => {
    console.log("options: ", options);

    const srcFolder = options.inputFolderPath;
    const destFolder = path.join(options.outputFolderPath, options.destFolderName);
    const keyWords = options.keyWords;

    console.log(srcFolder, destFolder, keyWords);
    
    if(fs.existsSync(destFolder)){
        console.log("file exists");
    } else{
        fs.mkdirSync(destFolder);
    }

    
})


 const handleOpenFile = async()=>{
    const { canceled, filePaths } = await dialog.showOpenDialog({
        properties: ['openDirectory']
    })
    if (!canceled) {
        console.log(filePaths[0]);
        
        return filePaths[0]
    }
}

const menu = [
    {
        role: 'fileMenu'
    }
]



app.whenReady().then(()=>{
    createMainWindow();
    ipcMain.handle('dialog:openFile', handleOpenFile)
    const mainMenu = Menu.buildFromTemplate(menu);

    Menu.setApplicationMenu(mainMenu)
})