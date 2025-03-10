const { ipcRenderer } = require('electron');

let readFilePath = ''; // selected file path
let rmin, volfrac;
let readFlag = false;

// When a file is selected, get the path and send it to the API
ipcRenderer.on('file-selected', (event, data) => {
    if (data.filePath) {
        readFilePath = data.filePath;
        console.log("File selected:", readFilePath);
        // Get the rmin and volfrac values from the inputs
        rmin = parseFloat(document.getElementById('rminInput').value);
        volfrac = parseFloat(document.getElementById('volFracInput').value);
        readFlag = true;
        // Send to the API
        ipcRenderer.send('send-readFile', { rmin, volfrac, readFlag, readFilePath });
        console.log("File path: ", readFilePath, " Flag: ", readFlag, " rmin: ", rmin, " volfrac: ", volfrac);
    } else {
        console.log("File selection was cancelled or removed.");
        readFilePath = '';
        readFlag = false;
        console.log("File path: ", readFilePath, " Flag: ", readFlag);
    }
});
