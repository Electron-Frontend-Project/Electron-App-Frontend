const path = require('path');
const { ipcRenderer } = require('electron');
//const jardir = 'C:/Users/suuser/Desktop/PDTO-GitHub/PDTO-Project/pdtopolys/fea/target/';
//const jardir = "C:/Users/suuser/Desktop/Electron-Github/Electron-App-Frontend/";
const jardir = path.resolve(__dirname, '../');

document.addEventListener('DOMContentLoaded', () => {
    const playbutton = document.getElementById('play-button');

    playbutton.addEventListener('click', async () => {
        console.log("Clicked play button..");
        ipcRenderer.send('start-backend', jardir);
    });
});
