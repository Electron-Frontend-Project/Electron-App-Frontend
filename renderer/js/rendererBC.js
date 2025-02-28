const { ipcRenderer } = require('electron');

document.addEventListener('DOMContentLoaded', () => {
    const boundaryButton = document.getElementById('boundary');  // Boundary button
    const forcebc = document.getElementById("force-bc"); // the dialog
    const closeDialogButton = document.getElementById('closeDialog'); // close dialog
    const Submit = document.getElementById('bcSubmit'); // Submit button

    var fListsend = [];
    var forceDict = {};
    var bcDict = {};
    var bcListsend = [];
    var passListsend = [];
    const f = {};

    boundaryButton.addEventListener('click', async (event) => {
        event.preventDefault();
        console.log("Clicked boundary condition button!!");
        forcebc.show();
    });

    // Event listener for closing the dialog
    closeDialogButton.addEventListener('click', (event) => {
        event.preventDefault();
        forcebc.close();
    });

    // New array to hold IDs selected in handleSendButtonClickForce
    var selectedForceIDs = [];
    var selectedBCIDs = [];
    var selectedPassIDs = [];

    // Modify updateList to only show items not in selectedIDs
    function updateList(listContainerId, list) {
        const listContainer = document.getElementById(listContainerId);
        listContainer.innerHTML = ""; 
    
        list.forEach(elem => {
            const listItem = document.createElement("li");
            listItem.textContent = elem;
            const removeButton = document.createElement("button");
            removeButton.textContent = "Remove";
            removeButton.addEventListener("click", (event) => {
                event.preventDefault();
                list.splice(list.indexOf(elem), 1); // remove id from the list
                updateList(listContainerId, list); // update the list
                ipcRenderer.send('removed-sphere', elem); // send removed id
            });
            listItem.appendChild(removeButton);
            listContainer.appendChild(listItem);
        });
    }

    // Common function to clear selected IDs
    function clearSelectedIDs(list, selectedIDs, listContainerId) {
        selectedIDs.forEach(id => {
            const index = list.indexOf(id);
            if (index !== -1) {
                list.splice(index, 1); // remove id from the list
            }
        });
        selectedIDs.length = 0; // clear selected ids
    
        updateList(listContainerId, list);
    
        // send all ids
        ipcRenderer.send('removed-spheres', selectedIDs);
    }

    // **to get force components values**
    function forceComponents() {
        const xComponent = document.getElementById("x-com").value;
        const yComponent = document.getElementById("y-com").value;
        const zComponent = document.getElementById("z-com").value;

        const forceComponents = {
            x: parseFloat(xComponent) || 0,
            y: parseFloat(yComponent) || 0,
            z: parseFloat(zComponent) || 0,
        };
        console.log("xcom: ", forceComponents);
        forceDict = forceComponents;
        console.log("forceDict: ", forceDict);
    }

    // Common function to handle adding points (Force/BC/Passive)
    function addPoint(designVarId, list, listContainerId) {
        const designvar = document.getElementById(designVarId).innerHTML;
        const dArray = designvar.split(" ");
        const dValue = dArray[2];
        if (dValue != null && !list.includes(dValue)) {
            list.push(dValue);
            updateList(listContainerId, list); // Update the displayed list

            // Send the ID of the selected sphere to rendererD.js
            const selectedMeshID = document.getElementById(designVarId).textContent.split(": ")[1];
            console.log("Selected Mesh ID:", selectedMeshID); // Debug log
            ipcRenderer.send('selected-sphere', selectedMeshID);
        }
    }

    // **to get points id for Force**
    const addButtonF = document.getElementById('forcepointadd');
    addButtonF.addEventListener('click', () => {
        addPoint('design-var1', fListsend, 'list-container1');
    });

    // **to get points id for BC**
    const addButtonBC = document.getElementById('bcpointadd');
    addButtonBC.addEventListener('click', () => {
        addPoint('design-var1', bcListsend, 'list-container2');
    });

    // **to get points id for Passive**
    const addButtonPassive = document.getElementById('passivepointadd');
    addButtonPassive.addEventListener('click', () => {
        addPoint('design-var1', passListsend, 'list-container3');
    });

    // Common function to handle sending selected IDs (area)
    function handleSendButtonClick(buttonId, listContainerId, selectedIDs) {
        const listElementHTML = document.getElementById(buttonId).innerHTML;   
        const designVarListTemp = listElementHTML.split('<br>');
        const nonEmptyDesignVarListTemp = designVarListTemp.map(item => item.trim()).filter(item => item !== '');
    
        const uniqueDesignVarSetTemp = new Set(nonEmptyDesignVarListTemp);
        const uniqueDesignVarListTemp = Array.from(uniqueDesignVarSetTemp);
    
        console.log(`Seçilen ID'ler:`, uniqueDesignVarListTemp);
    
        // updated selectedIDs list
        selectedIDs.length = 0;  
        uniqueDesignVarListTemp.forEach(id => {
            if (!selectedIDs.includes(id)) {
                selectedIDs.push(id);
            }
        });
    
        console.log(`Güncellenmiş selectedIDs:`, selectedIDs);
        updateList(listContainerId, selectedIDs);  
    
        // total elements 
        document.getElementById(listContainerId).innerHTML = `<p>There are ${selectedIDs.length} selected particles.</p>`;
    }
    
    // **to clear all ids for force**
    const clearButtonAllF = document.getElementById('clearforce');
    clearButtonAllF.addEventListener('click', () => {
        clearSelectedIDs(fListsend, selectedForceIDs, 'list-container1');
    });

    // **to clear all ids for BC**
    const clearButtonAllBC = document.getElementById('clearbc');
    clearButtonAllBC.addEventListener('click', () => {
        clearSelectedIDs(bcListsend, selectedBCIDs, 'list-container2');
    });

    // **to clear all ids for Passive**
    const clearButtonAllPassive = document.getElementById('clearpassive');
    clearButtonAllPassive.addEventListener('click', () => {
        clearSelectedIDs(passListsend, selectedPassIDs, 'list-container3');
    });
  

    // **to get bc components values**
    function bcComponents() {
        let xCom = false;
        let yCom = false;
        let zCom = false;
        // for x, y, and z components
        const xCheckbox = document.getElementById('x-checkbox');
        const yCheckbox = document.getElementById('y-checkbox');
        const zCheckbox = document.getElementById('z-checkbox');

        if (xCheckbox.checked) {
            xCom = true;
        }
        if (yCheckbox.checked) {
            yCom = true;
        }
        if (zCheckbox.checked) {
            zCom = true;
        }

        const bcComponents = {
            x: xCom,
            y: yCom,
            z: zCom,
        };
        bcDict = bcComponents;
    }

    Submit.addEventListener('click', async (event) => {
        event.preventDefault();
        await new Promise(resolve => setTimeout(resolve, 100));
        handleSendButtonClick('forcelist', 'list-container1', selectedForceIDs);
        forceComponents();
        updateList('list-container1', fListsend); // Update the list before calling handleSendButtonClick()
        await new Promise(resolve => setTimeout(resolve, 100)); // wait for the list to be updated
        handleSendButtonClick('bclist', 'list-container2', selectedBCIDs);
        bcComponents();
        updateList('list-container2', bcListsend); // Update the list before calling handleSendButtonClick()
        await new Promise(resolve => setTimeout(resolve, 100)); // wait for the list to be updated
        handleSendButtonClick('passivelist', 'list-container3', selectedPassIDs);
        updateList('list-container3', passListsend);
    
        // Combine points for Force area
        const combinedPoints = [...fListsend, ...selectedForceIDs].filter(point => point !== null);
        f['points'] = combinedPoints;
        f['forcecomponents'] = forceDict;
        f['constcomponents'] = bcDict;    
        // Combine designVars for BC area
        const combinedDesignVars = [...bcListsend, ...selectedBCIDs].filter(varItem => varItem !== null);
        f['designVars'] = combinedDesignVars;
        // Combine designVars for Passive area
        const combinedPassive = [...passListsend, ...selectedPassIDs].filter(varItem => varItem !== null);
        f['passive'] = combinedPassive;
    
        console.log(f);
        ipcRenderer.send('send-BCparams', f);
    
        // **send total elements of force list message to screen**
        const countMessageF = document.createElement("p");
        countMessageF.textContent = `There are ${combinedPoints.length} selected particles.`;
        document.getElementById('list-container1').appendChild(countMessageF);
    
        // **send total elements of BC list message to screen**
        const countMessageBC = document.createElement("p");
        countMessageBC.textContent = `There are ${combinedDesignVars.length} selected particles.`;
        document.getElementById('list-container2').appendChild(countMessageBC);
    
        // **send total elements of passive list message to screen**
        const countMessagePass = document.createElement("p");
        countMessagePass.textContent = `There are ${combinedPassive.length} selected particles.`;
        document.getElementById('list-container3').appendChild(countMessagePass);
    });    
});