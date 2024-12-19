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
       
    // Modify updateList to only show items not in selectedIDs
    function updateList(listContainerId, list, selectedIDs) {
        const listContainer = document.getElementById(listContainerId);
        // Clear existing list
        listContainer.innerHTML = "";
    
        // Create a list of elems and remove buttons
        for (const elem of list) {
            // Skip items in selectedIDs
            if (selectedIDs && selectedIDs.includes(elem)) { // Check if selectedIDs is defined
                continue; // Skip this iteration if the item is in selectedIDs
            }
    
            const listItem = document.createElement("li");
            listItem.textContent = elem;
    
            // Create remove button
            const removeButton = document.createElement("button");
            removeButton.textContent = "Remove";
            removeButton.addEventListener("click", (event) => {
                event.preventDefault();
                // Remove the element from the list
                const removedID = elem;
                list.splice(list.indexOf(removedID), 1); // Remove from list
                updateList(listContainerId, list, selectedIDs); // Update the displayed list
                ipcRenderer.send('removed-sphere', removedID); // Send removeID to main
            });
            listItem.appendChild(removeButton);
    
            listContainer.appendChild(listItem);
        }
    }

   // Common function to clear selected IDs
    function clearSelectedIDs(list, selectedIDs, listContainerId) {
        selectedIDs.forEach(id => {
            const index = list.indexOf(id);
            if (index !== -1) {
                list.splice(index, 1); // Remove ID from the list
            }
        });
        selectedIDs.length = 0; // Clear the selected IDs array

        // Update the list
        updateList(listContainerId, list);

        // Send removed IDs to ipcRenderer
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

    // Common function to handle adding points (Force/BC)
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

    // **to get points id for force**
    const addButtonF = document.getElementById('forcepointadd');
    addButtonF.addEventListener('click', () => {
        addPoint('design-var1', fListsend, 'list-container1');
    }); 

    // **to get points id for BC**
    const addButtonBC = document.getElementById('bcpointadd');
    addButtonBC.addEventListener('click', () => {
        addPoint('design-var1', bcListsend, 'list-container2');
    });

     // Common function to handle sending selected IDs (area)
    function handleSendButtonClick(buttonId, listContainerId, selectedIDs) {
        const listElementHTML = document.getElementById(buttonId).innerHTML;
        const designVarListTemp = listElementHTML.split('<br>');
        const nonEmptyDesignVarListTemp = designVarListTemp.map(item => item.trim()).filter(item => item !== ''); // Filter out empty elements
        const uniqueDesignVarSetTemp = new Set(nonEmptyDesignVarListTemp);
        const uniqueDesignVarListTemp = Array.from(uniqueDesignVarSetTemp);

        uniqueDesignVarListTemp.forEach(id => {          
            // Add to selectedIDs
            if (!selectedIDs.includes(id)) {
                selectedIDs.push(id);
            }
        });

        // Send the updated list to ipcRenderer
        ipcRenderer.send('selected-sphere', selectedIDs); 

        // Update the list container with the total count of selected IDs
        const listContainer = document.getElementById(listContainerId);
        listContainer.innerHTML = ""; // Clear existing content if needed
        
    }
    
    // **to clear  area ids for force**
    const clearButtonF = document.getElementById('clearselectedforce');
    clearButtonF.addEventListener('click', () => {
        clearSelectedIDs(fListsend, selectedForceIDs, 'list-container1');    
    });
    
    // **to clear area id for BC**
    const clearButtonBC = document.getElementById('clearselectedbc');
    clearButtonBC.addEventListener('click', () => {
        clearSelectedIDs(bcListsend, selectedBCIDs, 'list-container2');    
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
        handleSendButtonClick('forcelist', 'list-container1',  selectedForceIDs);
        forceComponents();
        updateList('list-container1', fListsend); // Update the list before calling handleSendButtonClick()
        await new Promise(resolve => setTimeout(resolve, 100)); // wait for the list to be updated        
        handleSendButtonClick('bclist', 'list-container2', selectedBCIDs);
        bcComponents();
        updateList('list-container2', bcListsend); // Update the list before calling handleSendButtonClick()
        // Combine points for force area
        const combinedPoints = [...fListsend, ...selectedForceIDs].filter(point => point !== null);
        f['points'] = combinedPoints;
        f['forcecomponents'] = forceDict;
        f['constcomponents'] = bcDict;
        // Combine designVars for BC area
        const combinedDesignVars = [...bcListsend, ...selectedBCIDs].filter(varItem => varItem !== null);
        f['designVars'] = combinedDesignVars;
        console.log(f);
        ipcRenderer.send('send-BCparams', f);

        // **send total elements of force list message to screen**
        const countMessageF = document.createElement("p");
        countMessageF.textContent = `There are ${combinedPoints.length} selected particles.`;
        document.getElementById('list-container1').appendChild(countMessageF);

        // **send total elements of force list message to screen**
        const countMessageBC = document.createElement("p");
        countMessageBC.textContent = `There are ${combinedDesignVars.length} selected particles.`;
        document.getElementById('list-container2').appendChild(countMessageBC);
    });
});
