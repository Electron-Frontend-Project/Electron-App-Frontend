const { ipcRenderer } = require('electron');
const path = require('path');
const os = require('os');

import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.121.0/build/three.module.js";
import { OrbitControls } from "https://cdn.jsdelivr.net/npm/three@0.121.0/examples/jsm/controls/OrbitControls.js";
import { Lut } from './Lut.js';

let flag = false, isInitStopped = false, clicked = 0, camera, scene, renderer, camera2, scene2, renderer2, axesHelper, fixedObjectGroup, ambientLight,
directionalLight, radius, widthSegments, heightSegments, controls, controls2, CAM_DISTANCE, currentAxis, lines, sphere, spheres,
container, container2, lut, orthoCamera, sprite, uiScene, textSprite, complience = 0, step = 0, selectedColorMap = '', 
selectedData = '',  dx
; 
let stepTextSprite; // The sprite to be used to display the step number
let currentStepNumber = 0; // Global variable to store the step number

document.addEventListener('DOMContentLoaded', () => {
    const readFile = document.getElementById('readFileO');
    const dxInput = document.getElementById('dxInput');
    const designPart = document.getElementById('scene-container1');
    const topologyPart = document.getElementById('scene-container2');
    const mainPart = document.getElementById('main-part');
    let isDesignPartOpen = false;
    let isTopologyPartOpen = false;
    readFile.addEventListener('click', async () => {
        if (isTopologyPartOpen) {
            topologyPart.style.width = '50%';
            designPart.style.width = '50%';
            mainPart.style.flexDirection = 'row';
            isTopologyPartOpen = false;
            // Send a message to main.js to stop watching the directory
            ipcRenderer.send('stop-watching'); 
            disposeScene();           
        } else {
            topologyPart.style.width = '100%';
            designPart.style.width = '0%';
            mainPart.style.flexDirection = 'column';
            isTopologyPartOpen = true;
            clicked += 1;            
            const userDir = os.homedir();  // User dir
            const dirPath = path.resolve(userDir, 'Desktop/PDTO-GitHub/PDTO-Project/topology/builtmeshallit');
            ipcRenderer.send('read-file2', dirPath);
            init();           
        }          
    });
});     

// to get dx 
ipcRenderer.on('get-dxO', (event, data) => {    
    ({ dx } = data);
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

// **Selecting color map**
const colorMapSelect = document.getElementById('color-map-select');
const dataSelect = document.getElementById('disp-strain-select');

colorMapSelect.addEventListener('change', (event) => {
  selectedColorMap = event.target.value;
  console.log("selected map2:" + selectedColorMap);
});
dataSelect.addEventListener('change', (event) => {
    selectedData = event.target.value;
    console.log("selected data: " + selectedData);
});

function disposeScene() {
    // Remove all children from the scenes
    while (scene.children.length > 0) {
        const child = scene.children[0];
        if (child instanceof THREE.Mesh) {
            child.geometry.dispose();
            child.material.dispose();
        }
        scene.remove(child);
    }
    while (scene2.children.length > 0) {
        const child = scene2.children[0];
        if (child instanceof THREE.Mesh) {
            child.geometry.dispose();
            child.material.dispose();
        }
        scene2.remove(child);
    }
    // Dispose of the renderer and controls
    renderer.dispose();
    renderer2.dispose();
    controls.dispose();
    controls2.dispose();
}

function init() {

    if (isInitStopped) {
        return; // to stop function
    }
    spheres = [];   
    scene = new THREE.Scene();  
    scene2 = new THREE.Scene();
    uiScene = new THREE.Scene();
    scene.background = new THREE.Color( "#ffffff" );     
    THREE.Object3D.DefaultUp.set(0.0, 0.0, 1.0); // z axis    
    // Create a camera with appropriate aspect ratio and size
    container = document.querySelector('.topology-part');   
    container2 = document.querySelector('.corner-boxO');
    const width = container.clientWidth;
    const height = container.clientHeight;
    const width2 = container2.clientWidth;
    const height2 = container2.clientHeight;
    camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000); 
    camera2 = new THREE.PerspectiveCamera(75, width2 / height2, 0.1, 1000);       
    orthoCamera = new THREE.OrthographicCamera( - 1, width / height , 1, - 1, 1, 2 );
	orthoCamera.position.set( 0.75, 0, 1 );
    CAM_DISTANCE = 10;
    const area = (dx*30)*(dx*30);
    camera.position.z = 30 + dx/area;  // for camera setting according to DX, LEN and WID 
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


    // Axes' thickness and length
    const thickness = 0.2; 
    const lngth = 5;     

    // X  (red)
    const xGeometry = new THREE.CylinderGeometry(thickness, thickness, lngth, 32);
    const xMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    const xAxis = new THREE.Mesh(xGeometry, xMaterial);
    xAxis.rotation.z = Math.PI / 2; 
    xAxis.position.x = lngth / 2;  
    scene2.add(xAxis);

    // Y  (green)
    const yGeometry = new THREE.CylinderGeometry(thickness, thickness, lngth, 32);
    const yMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    const yAxis = new THREE.Mesh(yGeometry, yMaterial);
    yAxis.position.y = lngth / 2;  
    scene2.add(yAxis);

    // Z  (blue)
    const zGeometry = new THREE.CylinderGeometry(thickness, thickness, lngth, 32);
    const zMaterial = new THREE.MeshBasicMaterial({ color: 0x0000ff });
    const zAxis = new THREE.Mesh(zGeometry, zMaterial);
    zAxis.rotation.x = Math.PI / 2; 
    zAxis.position.z = lngth / 2;  
    scene2.add(zAxis);

    // create texts using Sprite
    const createLabel = (text, color, position) => {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        context.font = ' 200px Arial';
        context.fillStyle = `rgba(${color.r * 255}, ${color.g * 255}, ${color.b * 255}, 1)`;
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillText(text, canvas.width / 2, canvas.height / 2);

        const texture = new THREE.CanvasTexture(canvas);
        texture.minFilter = THREE.LinearFilter;

        const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
        const sprite = new THREE.Sprite(spriteMaterial);
        sprite.scale.set(2, 1, 1); 
        sprite.position.copy(position); 
        scene2.add(sprite);
    };

    // Add texts
    createLabel('X', new THREE.Color(1, 0, 0), new THREE.Vector3(lngth + 1, 0, 0)); // X text
    createLabel('Y', new THREE.Color(0, 1, 0), new THREE.Vector3(0, lngth + 1, 0)); // Y text
    createLabel('Z', new THREE.Color(0, 0, 1), new THREE.Vector3(0, 0, lngth + 1)); // Z text

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

        // Update container width and height
        const container = document.querySelector('.topology-part');
        const width = container.clientWidth;
        const height = container.clientHeight;

        // Update camera and renderer with new container size
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height);

        const name = fileData.name;
        const data = fileData.content;       
        // Now you have access to both the file name and the content
        console.log("Received file:", name);
        // Remove existing spheres
        while (spheres.length > 0) {
            const sphere = spheres.pop();
            fixedObjectGroup.remove(sphere);
        }
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
       

        // Extract the step number from the file name and assign it to the global variable
        currentStepNumber = extractStepNumber(name);
        console.log("Step Number:", currentStepNumber);   
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

function extractStepNumber(filename) {
    // Extract the step number from the file name (example: solid1.msh -> 1)
    const match = filename.match(/solid(\d+)\.msh/);
    return match ? parseInt(match[1], 10) : 0;
}

function createSphere() {

    if (stepTextSprite) {
        uiScene.remove(stepTextSprite);
    }

    const geometry = new THREE.SphereGeometry(radius, widthSegments, heightSegments);
    const defaultMaterial = new THREE.MeshLambertMaterial({ color: 0x00ff00 });
    lut = new Lut();    
    let maxDisp = -Infinity;
    let minDisp = Infinity;
    let maxStrain = -Infinity;
    let minStrain = Infinity;

    if(selectedData == 'strain'){
        lines.forEach(line => {
            const values = line.split('\t'); // tab separated        
            if (values.length === 8) {
                const strain = parseFloat(values[3]);        
                maxStrain = Math.max(maxStrain, strain);
                minStrain = Math.min(minStrain, strain);
            }
        });
        // Set up the LUT with a color map
        lut.setColorMap(selectedColorMap); // or any other color map you prefer
        lut.setMax(maxStrain); // set the max value from the strain range
        lut.setMin(minStrain); // set the min value from the strain range

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
        context.font = '45px Arial'; // Decrease font size
        context.fillStyle = 'rgba(0, 0, 0, 1.0)'; // Set text color to black   
        // Draw the displacement scale with max at the top and min at the bottom
        const scaleSteps = 9; // Number of steps in the scale
        const yOffset = 20; // Offset from the top
        const lineLength = 20; // Length of the scale lines
        const lineX = 50; // X position of the scale lines (adjusted)
        const textX = 80; // X position of the text (adjusted)    
        // Add the maximum displacement value to the top
        context.font = '50px Arial'; // Increase font size
        context.fillStyle = 'rgba(0, 0, 0, 1.0)'; // Set text color to black    
        // Draw short line above max value
        context.fillRect(textX - 25, yOffset - 5, lineLength, 2);    
        context.fillText(maxStrain.toExponential(2), textX, yOffset + 17); // Add max value to the top
        for (let i = 0; i <= scaleSteps; i++) {
            const value = minStrain + ((i / scaleSteps) * (maxStrain - minStrain));
            const y = (canvas.height / scale) - (i / scaleSteps) * ((canvas.height / scale) ) - yOffset + 20; // Add 20 pixels of space between max value and scale
            // Draw short line
            context.fillRect(lineX, y - 5, lineLength, 2);
            // Draw the displacement value
            context.font = '50px Arial'; // Increase font size
            const textValue = value === 0? "0" : value.toExponential(2);
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

    } else{
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
        // **Set up the LUT with a color map**    
        lut.setColorMap(selectedColorMap); 
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
        context.font = '45px Arial'; // Decrease font size
        context.fillStyle = 'rgba(0, 0, 0, 1.0)'; // Set text color to black    
        // Draw the displacement scale with max at the top and min at the bottom
        const scaleSteps = 9; // Number of steps in the scale
        const yOffset = 20; // Offset from the top
        const lineLength = 20; // Length of the scale lines
        const lineX = 50; // X position of the scale lines (adjusted)
        const textX = 80; // X position of the text (adjusted)    
        // Add the maximum displacement value to the top
        context.font = '50px Arial'; // Increase font size
        context.fillStyle = 'rgba(0, 0, 0, 1.0)'; // Set text color to black    
        // Draw short line above max value
        context.fillRect(textX - 25, yOffset - 5, lineLength, 2);    
        context.fillText(maxDisp.toExponential(2), textX, yOffset + 17); // Add max value to the top    
        for (let i = 0; i <= scaleSteps; i++) {
            const value = minDisp + ((i / scaleSteps) * (maxDisp - minDisp));
            const y = (canvas.height / scale) - (i / scaleSteps) * ((canvas.height / scale) ) - yOffset + 20; // Add 20 pixels of space between max value and scale
            // Draw short line
            context.fillRect(lineX, y - 5, lineLength, 2);        
            // Draw the displacement value
            context.font = '50px Arial'; // Increase font size
            const textValue = value === 0? "0" : value.toExponential(2);
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
    }
    
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
            complience = complience + strain;
            const sphere = new THREE.Mesh(geometry, defaultMaterial.clone());
            // Calculate the displacement/strain magnitude
            const magnitude = selectedData == 'strain'? strain : Math.sqrt(dispx * dispx + dispy * dispy + dispz * dispz);
            // Get the color from the LUT based on the magnitude
            const color = lut.getColor(magnitude);
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

    // Create a canvas and add the text
    const canvas = document.createElement('canvas');
    const canvasWidth = container.clientWidth; // The width of the container
    const canvasHeight = 100; // Fixed height
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    
    const context = canvas.getContext('2d');
    context.fillStyle = 'rgba(255, 255, 255, 0)'; // Transparent background
    context.fillRect(0, 0, canvas.width, canvas.height);
    
    context.font = '75px Arial';
    context.fillStyle = 'black';
    context.textAlign = 'center'; // Center horizontally
    context.textBaseline = 'middle'; // Center vertically
    context.fillText(`Step ${currentStepNumber}`, canvas.width / 2, canvas.height / 2);
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
    
    // Clear the old sprite
    if (stepTextSprite) {
        uiScene.remove(stepTextSprite);
    }
    
    // Create a new sprite
    stepTextSprite = new THREE.Sprite(new THREE.SpriteMaterial({
        map: texture,
        transparent: true,
        opacity: 1.0
    }));
    
    // Scaling and position of the sprite
    const orthoWidth = orthoCamera.right - orthoCamera.left;
    const orthoHeight = orthoCamera.top - orthoCamera.bottom;
    
    const scaleFactor = 0.3; // Width ratio
    const heightScaleFactor = 0.1; // Height ratio
    stepTextSprite.scale.set(orthoWidth * scaleFactor, orthoHeight * heightScaleFactor, 1);
    
    const xCenter = (orthoCamera.left + orthoCamera.right) ; // Center on the X-axis
    const yBottom = orthoCamera.bottom + (orthoHeight * 0.15); // Close to the bottom edge on the Y-axis
    
    stepTextSprite.position.set(xCenter, yBottom, 0);
    
    uiScene.add(stepTextSprite);
    
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
    // Clear the previous spheres before creating new ones
    if (spheres.length > 0) {
        spheres.forEach(sphere => {
            fixedObjectGroup.remove(sphere);
            sphere.geometry.dispose();
            sphere.material.dispose();
        });
        spheres = []; // Clear the array
    }
    
    createSphere(); // Create new spheres based on the latest data
    renderer.render(scene, camera);
    renderer.autoClearColor = false;
    renderer.render(uiScene, orthoCamera);
    renderer.autoClearColor = true;
    renderer2.render(scene2, camera2);
}





