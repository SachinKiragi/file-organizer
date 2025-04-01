
const inputBtn = document.getElementById('inputBtn');
const outputBtn = document.getElementById('outputBtn');
const inputFolderPathElement = document.getElementById('inputFolderPath');
const outputFolderPathElement = document.getElementById('outputFolderPath');
const keywordElement = document.getElementById('keywords');
const destFolderElement = document.getElementById('destFolderName');
const transferBtn = document.getElementById('transferBtn');

let inputFolderPath="";
let outputFolderPath="";
let destFolderName="";
let keyWords="";


console.log(inputBtn, outputBtn, inputFolderPathElement, outputFolderPathElement, keywordElement, destFolderElement);


inputBtn.addEventListener('click', async()=>{
    const folderPath = await window.electronAPI.openFile();
    inputFolderPathElement.innerText = folderPath;
});

outputBtn.addEventListener('click', async()=>{
    const folderPath = await window.electronAPI.openFile();
    outputFolderPathElement.innerText = folderPath;
});

transferBtn.addEventListener('click', ()=>{
    inputFolderPath = inputFolderPathElement.innerText;
    outputFolderPath = outputFolderPathElement.innerText;
    keyWords = keywordElement.value;
    destFolderName = destFolderElement.value;
    if(!inputFolderPath || !outputFolderPath || !keyWords || !destFolderName) {
        alertError("Plz Enter Valid Inputs")
        return;
    }
    console.log(inputFolderPath, outputFolderPath, keyWords, destFolderName);
    const dataObj = {
        inputFolderPath, outputFolderPath, keyWords, destFolderName
    }
    ipcRenderer.send('file:transfer', dataObj)
})


function alertError(message){
    Toastify.toast({
        text: message,
        duration: 5000,
        close: false,
        style: {
            background: 'red',
            color: 'white',
            textAlign: 'center'
        }
    })
}
