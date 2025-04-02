const {app, BrowserWindow, Menu, ipcMain, dialog} = require('electron')
const path = require('path')
const fs = require('fs');
const fsPro = require('fs').promises;
const PdfParse = require("pdf-parse");


let mainWindow;

const isDev = process.env.NODE_ENV !== 'production';
const EXCLUDED_DIRS = ["node_modules", "git", "vendor", "build", "zip"];

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





//function to move file from source to destination
const moveFilesFromSourceToDestination = async(sourcePath, destinationPath)=>{
    console.log("dest 37: -> ", destinationPath);
    
    destinationPath = path.join(destinationPath, path.basename(sourcePath));
    console.log("src: ", sourcePath);
    console.log("dest: ", destinationPath);


    try {
        await fsPro.chmod(sourcePath, 0o666); // Remove read-only restrictions
        await fsPro.rename(sourcePath, destinationPath);
        console.log(`${sourcePath} ----> ${destinationPath}\n`);
        
    } catch (error) {
        console.log(error.message);
    }
    
}


const handleCurrentPdfFile = async(filePath, destFolder, keyWords)=>{
    // console.log(filePath);
    
    try {
        const dataBuffer = await fs.readFileSync(filePath);
        const data = (await PdfParse(dataBuffer)).text.toLowerCase();

        console.log(data.slice(0,20));
        console.log(filePath);
        
        console.log("KEY WORDS: ", keyWords);
        
        for(let key of keyWords){
            if(data.includes(key.toLowerCase())){
                await moveFilesFromSourceToDestination(filePath, destFolder);
            }
        }
        
    } catch (error) {
        console.log(error.message);
    }
}



const handleCurrFile = async(entry, destFolder, keyWords) => {
        console.log("83: keywords: ", keyWords);
        
    if(entry.name.endsWith('pdf')){
        try {
            console.log(entry.name.endsWith('pdf'));
            const filePath = path.join(entry.path, entry.name);
           await handleCurrentPdfFile(filePath, destFolder, keyWords);
        } catch (error) {
            console.log("e: ", error);       
        }
        
    }
    
    return;
}


    const handleCurrentSrcFolder = async(srcFolder, destFolder, keyWords)=>{
        console.log("100: ;", keyWords);
        await fsPro.chmod(srcFolder, 0o666); // Remove read-only restrictions

        
        try {
            const entriesInCurrFolder = await fs.readdirSync(srcFolder, {withFileTypes: true});
            
            for(let entry of entriesInCurrFolder){
                // console.log(entry.isDirectory());
                console.log("111: ", entry.name, entry.name.split('.')[1]);
                const entriesArr = entry.name.split(".");

                if(EXCLUDED_DIRS.includes(entriesArr[entriesArr.length-1])){
                    return;       
                }
                
                if(entry.isDirectory()){
                    // console.log("45: ", entry);
                    await handleCurrentSrcFolder(path.join(entry.path, entry.name), destFolder, keyWords);
                } else{
                    // console.log(entry);
                    await handleCurrFile(entry, destFolder, keyWords);
                }
                
            }        

        } catch (error) {
            console.log("33: ", error.message);
            Toastify.toast('error while reading folder')
        }
    }

const handleMainFunction = async(srcFolder, destFolder, keyWords)=>{
    console.log("125: ", keyWords);
    
    await handleCurrentSrcFolder(srcFolder, destFolder, keyWords);
    console.log("done");

    
}




ipcMain.on('file:transfer', async(e, options) => {
    console.log("options: ", options);

    const srcFolder = options.inputFolderPath;
    const destFolder = path.join(options.outputFolderPath, options.destFolderName);
    const keyWords = options.keyWords.toLowerCase().split(',').map(word => word[0]==' ' ? word.slice(1) : word)

    console.log(srcFolder, destFolder, keyWords);
    
    if(fs.existsSync(destFolder)){
        console.log("file exists");
    } else{
        fs.mkdirSync(destFolder);
    }

    await mainWindow.loadFile(path.join(__dirname, '/renderer/loader.html'))

    await handleMainFunction(srcFolder, destFolder, keyWords);

    await mainWindow.loadFile(path.join(__dirname, '/renderer/index.html'))

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