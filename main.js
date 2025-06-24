const {app, BrowserWindow, Menu, ipcMain, dialog, shell} = require('electron')
const path = require('path')
const fs = require('fs');
const fsPro = require('fs').promises;
const PdfParse = require("pdf-parse");
const mammoth = require('mammoth');
const unzipper = require('unzipper')
const xml2js = require('xml2js')


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



const handleCurrentDocxFile = async(filePath, destFolder, keyWords)=>{
    try {
        const buffer = await fsPro.readFile(filePath);
        const { value: text } = await mammoth.extractRawText({ buffer });

        const data = text.toLocaleLowerCase();
        console.log("data: ", data.slice(0, 500));
        
        for(let key of keyWords){
            
            if(data.includes(key.toLowerCase())){
                await moveFilesFromSourceToDestination(filePath, destFolder);
            }
        }
    } catch (error) {
        console.log("f***\n", error.message);
    }
}



function extractText(xmlObj) {
    let textArray = [];

    function traverse(obj) {
        if (typeof obj === "object") {
            for (const key in obj) {
                if (key === "a:t") {
                    textArray.push(obj[key][0]); // Extract actual text
                } else {
                    traverse(obj[key]);
                }
            }
        }
    }

    traverse(xmlObj);
    return textArray;
}

async function extractTextFromPPTX(filePath) {
    const pptxText = [];

    // Unzip PPTX file
    const zip = fs.createReadStream(filePath).pipe(unzipper.Parse({ forceStream: true }));

    for await (const entry of zip) {
        // Look for slide XML files
        if (entry.path.startsWith("ppt/slides/slide") && entry.path.endsWith(".xml")) {
            const content = await entry.buffer();
            const parsedXml = await xml2js.parseStringPromise(content);
            
            // Extract text from slide
            const textElements = extractText(parsedXml);
            pptxText.push(...textElements);
        } else {
            entry.autodrain();
        }
    }

    // console.log("Extracted Text:", pptxText.join(" "));
    return pptxText.join(" ");
}



const handleCurrentPptxFile = async(filePath, destFolder, keyWords)=>{
    const data = (await extractTextFromPPTX(filePath)).toLowerCase();
    console.log(data.slice(0, 50));
    
    for(let key of keyWords){
        if(data.includes(key.toLowerCase())){
            await moveFilesFromSourceToDestination(filePath, destFolder);
        }
    }
    
}



const handleCurrFile = async(entry, destFolder, keyWords) => {
    // console.log("83: keywords: ", keyWords);
        
    const filePath = path.join(entry.path, entry.name);
    if(entry.name.endsWith('pdf')){
        try {
            console.log(entry.name.endsWith('pdf'));
           await handleCurrentPdfFile(filePath, destFolder, keyWords);
        } catch (error) {
            console.log("e: ", error);       
        }
    } else if(entry.name.endsWith("docx")){
        try {
            await handleCurrentDocxFile(filePath, destFolder, keyWords);
        } catch (error) {
            console.log("116: ", error);
        }
    } else if(entry.name.endsWith('pptx')){
        console.log(entry);
        try {
            await handleCurrentPptxFile(filePath, destFolder, keyWords);
        } catch (error) {
            console.log("116: ", error);
        }
    }
    
    return;
}


    const handleCurrentSrcFolder = async(srcFolder, destFolder, keyWords)=>{
        // console.log("100: ;", keyWords);
        await fsPro.chmod(srcFolder, 0o666); // Remove read-only restrictions

        
        try {
            const entriesInCurrFolder = await fs.readdirSync(srcFolder, {withFileTypes: true});
            
            for(let entry of entriesInCurrFolder){
                // console.log(entry.isDirectory());
                // console.log("111: ", entry.name, entry.name.split('.')[1]);
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
    // console.log("125: ", keyWords);
    
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

    // await shell.openPath(destFolder);
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