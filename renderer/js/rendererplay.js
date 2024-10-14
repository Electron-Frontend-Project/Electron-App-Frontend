const path = require('path');
const { ipcRenderer } = require('electron');
//const jardir = 'C:/Users/suuser/Desktop/PDTO-GitHub/PDTO-Project/pdtopolys/fea/target/';
//const jardir = "C:/Users/suuser/Desktop/Electron-Github/Electron-App-Frontend/";
const jardir = path.resolve(__dirname, '../');

document.addEventListener('DOMContentLoaded', () => {
    const playButton = document.getElementById('play-button');
    const stopButton = document.getElementById('stop-button');
    const pauseButton = document.getElementById('pause-button');

    playButton.addEventListener('click', async () => {
        console.log("Clicked play button..");
        ipcRenderer.send('start-backend', jardir);
    });
    
    ipcRenderer.on('jar-path', (event, jarPath) => {
        console.log(`Received JAR path: ${jarPath}`);
    });

    // Backend'den gelen stdout verilerini dinleyin ve konsola yazdırın
    ipcRenderer.on('backend-output', (event, data) => {
        console.log(`Backend Output: ${data}`);
    });

    // Backend'den gelen stderr verilerini dinleyin ve konsola yazdırın
    ipcRenderer.on('backend-error', (event, data) => {
        console.error(`Backend Error: ${data}`);
    });

    // Process'in kapanma olayını dinleyin ve konsola yazdırın
    ipcRenderer.on('backend-close', (event, data) => {
        console.log(data);
    });

    stopButton.addEventListener('click', async () => {
        console.log("Clicked stop button..");
        ipcRenderer.send('stop-backend');
    });

    pauseButton.addEventListener('click', async () => {
        console.log("Clicked pause button..");
        ipcRenderer.send('pause-backend');
    });

 
});
