const { ipcRenderer } = require('electron');

let readFilePath = ''; // Variable to store the file path
let readFlag = false; // Flag to indicate whether a file has been selected

// Listen for the file path response from the main process
ipcRenderer.on('response-file-path', (event, filePath) => {
    if (filePath) {
        readFilePath = filePath; // Save the file path
        console.log("Selected file: ", filePath);
    }
});

document.addEventListener('DOMContentLoaded', () => {
    const sendFileButton = document.getElementById('sendFileButton');
    let i = 0; // Click count

    sendFileButton.addEventListener('click', async () => {
        // First, show the current file path
        if (readFilePath) {
            console.log("Currently selected file path: ", readFilePath);
        } else {
            console.log("No file has been selected yet.");
        }

        if (i % 2 === 1) {
            // If odd: Reset file selection
            sendFileButton.style.backgroundColor = ''; // Reset button color to default
            readFilePath = ''; // Reset the file path
            readFlag = false; // Set the flag to false
            console.log("Selections have been reset.");
        } else {
            // If even: File selection will be made
            sendFileButton.style.backgroundColor = 'green'; // Change button color to green
            ipcRenderer.send('open-file-dialog'); // Open the file dialog
            readFlag = true; // Set the flag to true
        }
        i++; // Increment the click count

        // Log the current states
        console.log("Click count: ", i);
       
    });
});

// Listen for the file path response from the main process
ipcRenderer.on('response-file-path', (event, filePath) => {
    if (filePath) {
        readFilePath = filePath; // Save the file path
        console.log("File selection completed. Readflag : ", readFlag);
        console.log("File selection completed. Selected file: ", filePath);

        // Send the current states to the main process
        ipcRenderer.send('send-readFile', { readFlag, readFilePath });
    }
});