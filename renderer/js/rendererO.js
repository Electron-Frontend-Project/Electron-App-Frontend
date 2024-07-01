const { ipcRenderer } = require('electron');
const path = require('path');
const os = require('os');

import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.121.0/build/three.module.js";
import { OrbitControls } from "https://cdn.jsdelivr.net/npm/three@0.121.0/examples/jsm/controls/OrbitControls.js";

import { Lut } from './Lut.js';

import { SelectionBox } from "./SelectionBox.js";
import { SelectionHelper } from "./SelectionHelper.js";


document.addEventListener('DOMContentLoaded', () => {
    const readFile = document.getElementById('readFileO');
    const dxInput = document.getElementById('dxInput');
    readFile.addEventListener('click', async () => {
        //const filePath = 'C:/Users/suuser/Desktop/PDTO4/topology/builtmesh/solidR2.msh'; // Replace with the actual file path
       // const dirPath = "C:/Users/suuser/Desktop/PDTO-GitHub/PDTO-Project/topology/builtmeshallit";
        const userDir = os.homedir();  // User dir
        const dirPath = path.resolve(userDir, 'Desktop/PDTO-GitHub/PDTO-Project/topology/builtmeshallit');

        ipcRenderer.send('read-file2', dirPath);
    });
});     

// to get dx 
let dx;
ipcRenderer.on('get-dxO', (event, data) => {    
    dx = data;
});

ipcRenderer.on('file-read-error2', (event, errorMessage) => {
    // Handle the file read error here in the renderer process
    console.error('File read error:', errorMessage);
});

ipcRenderer.on('file-not-found2', (event, errorMessage) => {
    // Handle the file not found error here in the renderer process
    console.error('File not found:', errorMessage);
});


let i=1;

let camera, scene, renderer, camera2, scene2, renderer2, axesHelper, fixedObjectGroup, ambientLight,
directionalLight, radius, widthSegments, heightSegments, controls, controls2, CAM_DISTANCE, currentAxis, lines, sphere, spheres,
container, lut, orthoCamera, sprite, uiScene, textSprite
; 
let selectedColorMap = '';

const colorMapSelect = document.getElementById('color-map-select');

colorMapSelect.addEventListener('change', (event) => {
  selectedColorMap = event.target.value;
  console.log("selected map2:" + selectedColorMap);
});

init();

function init() {

    

    spheres = [];   
    scene = new THREE.Scene();  
    scene2 = new THREE.Scene();
    uiScene = new THREE.Scene();
    scene.background = new THREE.Color( "#ffffff" );    
    scene2.background = new THREE.Color( "#ffffff" );  
    THREE.Object3D.DefaultUp.set(0.0, 0.0, 1.0); // z axis  
  
    // Create a camera with appropriate aspect ratio and size
    container = document.querySelector('.topology-part');   
    const container2 = document.querySelector('.corner-boxO');
    const width = container.clientWidth;
    const height = container.clientHeight;
    const width2 = container2.clientWidth;
    const height2 = container2.clientHeight;
    camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000); 
    camera2 = new THREE.PerspectiveCamera(75, width2 / height2, 0.1, 1000); 
    
   
    orthoCamera = new THREE.OrthographicCamera( - 1, width / height , 1, - 1, 1, 2 );
	orthoCamera.position.set( 0.75, 0, 1 );

    CAM_DISTANCE = 10;
    camera.position.z = 40;
    renderer = new THREE.WebGLRenderer({ alpha: true }); 
    renderer2 = new THREE.WebGLRenderer({ alpha: true }); 
    renderer.setClearColor( 0x000000, 0 ); // background color
    renderer2.setClearColor( 0x000000, 0 ); // backgorund color
    // Set the renderer's size to match the container

 

    renderer.setSize(width, height);   
    renderer2.setSize(width2, height2); 
    // Append the renderer's canvas to the container
    container.appendChild(renderer.domElement); 
    container2.appendChild(renderer2.domElement);
    // Create OrbitControls
    controls = new OrbitControls(camera, renderer.domElement);
    controls2 = new OrbitControls(camera2, renderer2.domElement);
    axesHelper = new THREE.AxesHelper( 5 );
    scene2.add( axesHelper );
    currentAxis = 'none';


    radius = dx / 2; // Radius of spheres
    widthSegments = 32; // Surface parts of the sphere
    heightSegments = 32; // Height divisions of the sphere
    
    // fixed object group
    fixedObjectGroup = new THREE.Group();
    scene.add(fixedObjectGroup);
    // Add ambient light to the scene
    ambientLight = new THREE.AmbientLight(0x404040); // Soft white light
    scene.add(ambientLight);
    // Add a directional light to the scene
    directionalLight = new THREE.DirectionalLight(0xffffff, 1); // White light, 50% intensity
    directionalLight.position.set(1, 1, 1); // Set the direction of the light
    scene.add(directionalLight);

    const fileQueue = []; // Queue to hold files in order
    ipcRenderer.on('file-data2', (event, fileData) => {
        const name = fileData.name;
        const data = fileData.content;
       
        // Now you have access to both the file name and the content
        console.log("Received file:", name);

        // Remove existing spheres
        while (spheres.length > 0) {
            const sphere = spheres.pop();
            fixedObjectGroup.remove(sphere);
        }
               
       //clearLastModel();
       console.log(i+=1);
       // Remove the old spheres from the fixedObjectGroup
        while (fixedObjectGroup.children.length > 0) {
            const child = fixedObjectGroup.children[0];
            if (child instanceof THREE.Mesh) {
                fixedObjectGroup.remove(child);
            }
        }
   
        // Handle the received data here in the renderer process
        lines = data.split('\n');
        console.log("lines size: "+ lines.length );
        if (dx) {
        console.log('dx1:',dx);
        }
       // console.log(lines); 
       
        animate();
        
    });
}
function animate() {
    
    requestAnimationFrame(animate);
    // Update controls for both cameras
    controls.update();
    controls2.update();
    
    // Update the position and target of camera2 based on camera1
    camera2.position.copy(camera.position);
    camera2.position.sub(controls.target);
    camera2.position.setLength(CAM_DISTANCE);
    camera2.lookAt(scene2.position);

    render();
}



function createSphere() {
    console.log("selectedColorMap1:", selectedColorMap);
    const geometry = new THREE.SphereGeometry(radius, widthSegments, heightSegments);
    const defaultMaterial = new THREE.MeshLambertMaterial({ color: 0x00ff00 });
    lut = new Lut();
    
    let maxDisp = -Infinity;
    let minDisp = Infinity;

    // Find the maximum and minimum displacement values
    lines.forEach(line => {
        const values = line.split('\t'); // tab separated

        if (values.length === 8) {
            const dispx = parseFloat(values[5]);
            const dispy = parseFloat(values[6]);
            const dispz = parseFloat(values[7]);

            const displacementMagnitude = Math.sqrt(dispx * dispx + dispy * dispy + dispz * dispz);

            maxDisp = Math.max(maxDisp, displacementMagnitude);
            minDisp = Math.min(minDisp, displacementMagnitude);
        }
    });
    console.log(`Minimum displacement value: ${minDisp}`);
    console.log(`Maximum displacement value: ${maxDisp}`);

    // Set up the LUT with a color map

    lut.setColorMap(selectedColorMap); // or any other color map you prefer
    lut.setMax(maxDisp); // set the max value from the displacement range
    lut.setMin(minDisp); // set the min value from the displacement range

    sprite = new THREE.Sprite(new THREE.SpriteMaterial({
        map: new THREE.CanvasTexture(lut.createCanvas()),
        transparent: true,
        opacity: 0.5
    }));

    sprite.material.map.colorSpace = THREE.SRGBColorSpace;
    sprite.scale.x = 0.1;
    sprite.position.set(-0.1, 0, 0); // sprite position

    uiScene.add(sprite);

    // Create a high-resolution canvas for the text label and displacement scale
    const canvas = document.createElement('canvas');
    const scale = 2; // Increase scale for higher resolution
    canvas.width = 256 * scale;
    canvas.height = 1024 * scale; // Increased height to accommodate the scale
    const context = canvas.getContext('2d');
    context.scale(scale, scale); // Scale context for higher resolution
    context.font = '24px Arial'; // Decrease font size
    context.fillStyle = 'rgba(0, 0, 0, 1.0)'; // Set text color to black
   // context.fillText('Displacement', 10, 20); // Adjust position for the smaller font

    // Draw the displacement scale with max at the top and min at the bottom
    const scaleSteps = 13; // Number of steps in the scale
    const yOffset = 20; // Offset from the top
    const lineLength = 20; // Length of the scale lines
    const lineX = 50; // X position of the scale lines (adjusted)
    const textX = 80; // X position of the text (adjusted)

// Add the maximum displacement value to the top
context.font = '30px Arial'; // Increase font size
context.fillStyle = 'rgba(0, 0, 0, 1.0)'; // Set text color to black

// Draw short line above max value
context.fillRect(textX - 5, yOffset - 5, lineLength, 2);

context.fillText(maxDisp.toFixed(8), textX, yOffset); // Add max value to the top

for (let i = 0; i <= scaleSteps; i++) {
    const value = minDisp + ((i / scaleSteps) * (maxDisp - minDisp));
    const y = (canvas.height / scale) - (i / scaleSteps) * ((canvas.height / scale) ) - yOffset + 20; // Add 20 pixels of space between max value and scale
    
    // Draw short line
    context.fillRect(lineX, y - 5, lineLength, 2);
    
    // Draw the displacement value
    context.font = '30px Arial'; // Increase font size
    const textValue = value === 0? "0" : value.toFixed(8);
    context.fillText(textValue, textX, y);
}



    
    const texture = new THREE.CanvasTexture(canvas);
    texture.anisotropy = renderer.capabilities.getMaxAnisotropy(); // Improve texture quality

    // Remove the previous text sprite if it exists
    if (textSprite) {
        uiScene.remove(textSprite);
    }

    textSprite = new THREE.Sprite(new THREE.SpriteMaterial({
        map: texture,
        transparent: true,
        opacity: 1.0
    }));

    textSprite.scale.set(0.25, 1, 1); // Adjust size for the higher resolution
    textSprite.position.set(-0.0001, 0, 0); // Position to the side of the original sprite
    uiScene.add(textSprite);

    // SPHERE
    lines.forEach(line => {
        const values = line.split('\t'); // tab separated

        if (values.length === 8) {
            const x = parseFloat(values[0]);
            const y = parseFloat(values[1]);
            const z = parseFloat(values[2]);
            const strain = parseFloat(values[3]);
            const designvar = values[4];
            const dispx = parseFloat(values[5]);
            const dispy = parseFloat(values[6]);
            const dispz = parseFloat(values[7]);

            const sphere = new THREE.Mesh(geometry, defaultMaterial.clone());

            // Calculate the displacement magnitude
            const displacementMagnitude = Math.sqrt(dispx * dispx + dispy * dispy + dispz * dispz);

            // Get the color from the LUT based on the displacement magnitude
            const color = lut.getColor(displacementMagnitude);

            // Set the color of the sphere
            sphere.material.color = color;

            switch (currentAxis) {
                case 'x':
                    sphere.position.set(x, 0, 0);
                    break;
                case 'y':
                    sphere.position.set(0, y, 0);
                    break;
                case 'z':
                    sphere.position.set(0, 0, z);
                    break;
                default:
                    sphere.position.set(x, y, z);
                    break;
            }

            sphere.designvar = designvar;
            sphere.displacement = dispx + " " + dispy + " " + dispz;
            sphere.strain = strain;
            spheres.push(sphere);
            fixedObjectGroup.add(sphere);
        }
    });

    // clean up
    geometry.dispose();
    defaultMaterial.dispose();
}





var infoBox = document.getElementById("info-box2"); // text box for mesh info
const canvas = document.querySelector('canvas');
const boxPosition = new THREE.Vector3();
renderer.domElement.addEventListener('click', onCanvasClick, false);

var INTERSECTED;
function onCanvasClick(event) {
    // Calculate the mouse click position in normalized device coordinates (NDC)
    var mouse = new THREE.Vector2();
    const containerRect = container.getBoundingClientRect();
    const x = ((event.clientX - containerRect.left) / container.clientWidth) * 2 - 1;
    const y = -((event.clientY - containerRect.top) / container.clientHeight) * 2 + 1;
    // Raycasting is used to determine which object was clicked
    var raycaster = new THREE.Raycaster();
    raycaster.setFromCamera({ x, y }, camera);
    raycaster.params.Points.threshold = 0.001; // Adjust the threshold as needed
    var intersects = raycaster.intersectObjects(spheres, true);
    if (intersects.length > 0) {
        if (INTERSECTED != intersects[0].object) {
            if (INTERSECTED) {
                INTERSECTED.material.emissive.set(INTERSECTED.currentHex);
            }
            INTERSECTED = intersects[0].object;
            INTERSECTED.currentHex = INTERSECTED.material.emissive.getHex();
            INTERSECTED.material.emissive.set(0xff0000);
            const selectedMeshUUID = INTERSECTED.uuid;
            const designVar = INTERSECTED.designvar;
            const strainEnergy = INTERSECTED.strain;
            const displacement = INTERSECTED.displacement;
            // Update the text box content
            const designVarText = "Design variable: " + designVar;
            const strainEnergyText = "Strain energy: " + strainEnergy;
            const displacementText = "Displacement: " + displacement;
            document.getElementById("design-var2").textContent = designVarText;
            document.getElementById("strain-energy2").textContent = strainEnergyText;
            document.getElementById("displacement2").textContent = displacementText;
           
            boxPosition.setFromMatrixPosition(INTERSECTED.matrixWorld);
            boxPosition.project(camera);
            var widthHalf = container.clientWidth / 2;
            var heightHalf = container.clientHeight / 2;
            boxPosition.x = (boxPosition.x * widthHalf) + widthHalf;
            boxPosition.y = - (boxPosition.y * heightHalf) + heightHalf;
            infoBox.style.display='block';
        }
    } else {
        // Hide the text box if no mesh is clicked
        infoBox.style.display='none';
    }
}



function render() {
    createSphere();
    renderer.render( scene, camera );
    renderer.autoClearColor = false;
    renderer.render( uiScene, orthoCamera );
    renderer.autoClearColor = true;
    renderer2.render(scene2, camera2);
    scene.remove(sphere); 
    
}



















