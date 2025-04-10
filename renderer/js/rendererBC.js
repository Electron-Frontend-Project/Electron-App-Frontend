const { ipcRenderer } = require('electron');

document.addEventListener('DOMContentLoaded', () => {
    const boundaryButton = document.getElementById('boundary');  // Boundary button
    const forcebc = document.getElementById("force-bc"); // the dialog
    const closeDialogButton = document.getElementById('closeDialog'); // close dialog
    const Submit = document.getElementById('bcSubmit'); // Genel Submit button
    const SubmitForce = document.getElementById('SubmitForce'); // Submit Force button
    const SubmitBC = document.getElementById('SubmitBC'); // Submit BC button

    var forceDict = {}; // { id: { x: value, y: value, z: value }, ... }
    var bcDict = {};   // { id: { x: bool, y: bool, z: bool }, ... }
    var passListsend = []; // [id, id, ...]
    var fListsend = [];
    var bcListsend = [];

    let forceLast = '';
    let bcLast = '';

    // New array to hold IDs selected in handleSendButtonClickForce
    var selectedForceIDs = {};
    var selectedBCIDs = {};
    var selectedPassIDs = [];

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

    // Sürükleme ve boyutlandırma işlemleri
    let isResizing = false;
    let isDragging = false;
    let startX, startY, startWidth, startHeight, startLeft, startTop;

    forcebc.addEventListener("mousedown", (event) => {
        if (event.target.classList.contains("resize-handle")) {
            isResizing = true;
            startX = event.clientX;
            startY = event.clientY;
            startWidth = forcebc.offsetWidth;
            startHeight = forcebc.offsetHeight;
        } else {
            isDragging = true;
            startX = event.clientX - forcebc.offsetLeft;
            startY = event.clientY - forcebc.offsetTop;
        }
    });

    document.addEventListener("mousemove", (event) => {
        if (isResizing) {
            let newWidth = startWidth + (event.clientX - startX);
            let newHeight = startHeight + (event.clientY - startY);

            // Minimum ve maksimum boyutları koru
            newWidth = Math.max(200, Math.min(window.innerWidth * 0.8, newWidth));
            newHeight = Math.max(150, Math.min(window.innerHeight * 0.8, newHeight));

            forcebc.style.width = newWidth + "px";
            forcebc.style.height = newHeight + "px";
        }

        if (isDragging) {
            let newLeft = event.clientX - startX;
            let newTop = event.clientY - startY;

            // Ekran sınırlarını kontrol et
            const maxLeft = window.innerWidth - forcebc.offsetWidth;
            const maxTop = window.innerHeight - forcebc.offsetHeight;

            newLeft = Math.max(0, Math.min(newLeft, maxLeft));
            newTop = Math.max(0, Math.min(newTop, maxTop));

            forcebc.style.left = newLeft + "px";
            forcebc.style.top = newTop + "px";
        }
    });

    document.addEventListener("mouseup", () => {
        isResizing = false;
        isDragging = false;
    });


    function updateList(listContainerId, data, type) {
        const listContainer = document.getElementById(listContainerId);
        listContainer.innerHTML = ""; 
    
        if (type === 'passive') {
            // For passive lists, which are arrays
            data.forEach(elem => {
                const listItem = document.createElement("li");
                listItem.textContent = elem;
                const removeButton = document.createElement("button");
                removeButton.textContent = "Remove";
                removeButton.addEventListener("click", (event) => {
                    event.preventDefault();
                    data.splice(data.indexOf(elem), 1); // remove id from the list
                    console.log(`[PASSIVE] Removed ID:`, elem, 'Type:', typeof elem); 
                    updateList(listContainerId, data, type); // update the list
                    ipcRenderer.send('removed-sphere', elem); // send removed id
                    
                });
                listItem.appendChild(removeButton);
                listContainer.appendChild(listItem);
            });
        } else {
            // For force and BC dictionaries
            Object.keys(data).forEach(key => {
                const listItem = document.createElement("li");
                listItem.textContent = `${key}: ${JSON.stringify(data[key])}`;
            
                const removeButton = document.createElement("button");
                removeButton.textContent = "Remove";
                removeButton.addEventListener("click", (event) => {
                    event.preventDefault();
            
                    const actualID = key; // artık key = id
            
                    delete data[key];
                    console.log(`[${type.toUpperCase()}] Removed ID:`, actualID, 'Type:', typeof actualID);
            
                    updateList(listContainerId, data, type);
                    ipcRenderer.send('removed-sphere', actualID);
                });
            
                listItem.appendChild(removeButton);
                listContainer.appendChild(listItem);
            });
            
        }
    }
         

    function forceComponents(id, last) {
        const xComponent = document.getElementById("x-com").value;
        const yComponent = document.getElementById("y-com").value;
        const zComponent = document.getElementById("z-com").value;
    
        if (last === 'point') {
            // Point modunda, forceDict'e ekle
            forceDict[id] = {
                x: parseFloat(xComponent) || 0,
                y: parseFloat(yComponent) || 0,
                z: parseFloat(zComponent) || 0,
            };
            console.log("forceDict: ", forceDict);
        } else if (last === 'area') {
            // Area modunda, selectedForceIDs'e ekle
            if (Array.isArray(id)) {
                id.forEach(singleId => {
                    selectedForceIDs[singleId] = {
                        x: parseFloat(xComponent) || 0,
                        y: parseFloat(yComponent) || 0,
                        z: parseFloat(zComponent) || 0,
                    };
                });
            }
            console.log("selectedForceIDs (area): ", selectedForceIDs);
        }
    }

    // **to get bc components values**
    function bcComponents(id, last) {
        let xCom = false;
        let yCom = false;
        let zCom = false;
    
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
    
        if (last === 'point') {
            bcDict[id] = {
                x: xCom,
                y: yCom,
                z: zCom,
            };
            console.log("bcDict: ", bcDict);
        } else if (last === 'area') {
            if (Array.isArray(id)) {
                id.forEach(singleId => {
                    selectedBCIDs[singleId] = {
                        x: xCom,
                        y: yCom,
                        z: zCom,
                    };
                });
            }
            console.log("selectedBCIDs (area): ", selectedBCIDs);
        }
    }

    // **Reset input fields**
    function resetInputFields() {
        document.getElementById("x-com").value = "";
        document.getElementById("y-com").value = "";
        document.getElementById("z-com").value = "";
        document.getElementById('x-checkbox').checked = false;
        document.getElementById('y-checkbox').checked = false;
        document.getElementById('z-checkbox').checked = false;
    }

    SubmitForce.addEventListener('click', async (event) => {
      //  event.preventDefault();    
        console.log("SubmitForce button clicked.");
        console.log("forceLast value:", forceLast);
    
        if (forceLast === 'point') {
            event.preventDefault();
            const designvar = document.getElementById('design-var1').innerHTML;
            const dArray = designvar.split(" ");
            const dValue = dArray[2];
    
            if (dValue != null) {
                console.log("Assigning force values to ID:", dValue);
                forceComponents(dValue, forceLast);
                resetInputFields();
            } else {
                console.warn("dValue is null or undefined.");
            }
    
            updateList('list-container1', forceDict, 'force');
        } else if (forceLast === 'area') {
            event.preventDefault();
        
            await new Promise(resolve => setTimeout(resolve, 100));
            console.log("Selected Force IDs before update:", selectedForceIDs);
    
            // Update the list of selected IDs and assign force components
            selectedForceIDs = await handleSendButtonClick('forcelist', 'list-container1', selectedForceIDs, 'force', forceLast);
   
            console.log("Updated selectedForceIDs:", selectedForceIDs);
         //   updateList('list-container1', selectedForceIDs, 'force');
    
            resetInputFields();
        } else {
            console.error("Invalid forceLast value:", forceLast);
        }
    });

    // **Submit BC button event listener**
    SubmitBC.addEventListener('click', async (event) => {       
        console.log("SubmitBC button clicked.");
        if (bcLast === 'point') {
            event.preventDefault();
            const designvar = document.getElementById('design-var1').innerHTML;
            const dArray = designvar.split(" ");
            const dValue = dArray[2];
            if (dValue != null) {
                bcComponents(dValue, bcLast); // Assign BC values to the selected ID
                resetInputFields(); // Reset input fields
                console.log("BC values assigned to ID:", dValue);
            }
            updateList('list-container2', bcDict, 'bc');
        }  else if (bcLast === 'area') {
            event.preventDefault();       
            await new Promise(resolve => setTimeout(resolve, 100));
            console.log("Selected BC IDs before update:", selectedBCIDs);
            selectedBCIDs = await handleSendButtonClick('bclist', 'list-container2', selectedBCIDs, 'bc', bcLast);

            resetInputFields();

        } else {
            console.error("Invalid bcLast value:", bcLast);
        }
    });

    // **Genel Submit button event listener**
    Submit.addEventListener('click', async (event) => {
        event.preventDefault();
    
        // Store the current state of the lists before submitting
        const currentForceList = JSON.parse(JSON.stringify(forceDict));
        const currentBCList = JSON.parse(JSON.stringify(bcDict));
        const currentPassiveList = [...passListsend];
    
        // Perform the submit logic
        await new Promise(resolve => setTimeout(resolve, 100));
        const newPassiveIDs = await handleSendButtonClick('passivelist', 'list-container3', selectedPassIDs, 'passive');
     //   selectedPassIDs = [...selectedPassIDs, ...newPassiveIDs];
     selectedPassIDs = await handleSendButtonClick('passivelist', 'list-container3', selectedPassIDs, 'passive');
    
        // Update the UI with the preserved state
        setTimeout(() => {
            updateList('list-container1', forceDict, 'force');
            updateList('list-container2', bcDict, 'bc');
            updateList('list-container3', passListsend, 'passive');
        }, 100);
        
    
        // **Force verilerini birleştir**
        const mergedForce = {
            ...currentForceList, 
            ...selectedForceIDs // Assuming selectedForceIDs is defined and holds the selected IDs
        };
    
        console.log("bcDict:", currentBCList);
        console.log("selectedBCIDs:", selectedBCIDs);
    
        // **BC verilerini birleştir**
        const mergedBC = {
            ...currentBCList, 
            ...selectedBCIDs // Assuming selectedBCIDs is defined and holds the selected IDs
        };
        console.log("mergedBC:", mergedBC);
    
        // **Passive listeleri birleştir**
        const mergedPassive = [...new Set([
            ...currentPassiveList.map(item => (typeof item === "object" ? item.id : item)),
            ...selectedPassIDs.map(item => (typeof item === "object" ? item.id : item))
        ])];
    
        // **Hazırlanan veriyi gönder**
        const dataToSend = {
            force: mergedForce,
            bc: mergedBC,
            passive: mergedPassive,
        };
    
        ipcRenderer.send('send-BCparams', dataToSend);
    
        // **Toplam eleman sayısını ekrana yazdır**
        document.getElementById('list-container1').innerHTML += `<p>There are ${Object.keys(mergedForce).length} selected particles.</p>`;
        document.getElementById('list-container2').innerHTML += `<p>There are ${Object.keys(mergedBC).length} selected particles.</p>`;
        document.getElementById('list-container3').innerHTML += `<p>There are ${mergedPassive.length} selected particles.</p>`;
    });
    

    // Common function to handle adding points (Force/BC/Passive)
    function addPoint(designVarId, list, listContainerId, type) {
        const designvar = document.getElementById(designVarId).innerHTML;
        const dArray = designvar.split(" ");
        const dValue = dArray[2];
    
        if (dValue != null) {
            if (type === 'passive') {
                if (!list.includes(dValue)) {
                    list.push(dValue);
                    updateList(listContainerId, list, type);
                    ipcRenderer.send('selected-sphere', dValue);
                }
            } else {
                if (!Object.keys(list).includes(dValue)) {
                    list[dValue] = { id: dValue }; //  ID'yi key olarak koy, value içine de ID koy
                    updateList(listContainerId, list, type);
                    ipcRenderer.send('selected-sphere', dValue);
                }
            }
        }
    }
    

    // **to get points id for Force**
    const addButtonF = document.getElementById('forcepointadd');
    addButtonF.addEventListener('click', () => {
        forceLast = 'point';
        addPoint('design-var1', Object.keys(forceDict), 'list-container1', 'force');
    });

    // **to get points id for BC**
    const addButtonBC = document.getElementById('bcpointadd');
    addButtonBC.addEventListener('click', () => {
        bcLast = 'point';
        addPoint('design-var1', Object.keys(bcDict), 'list-container2', 'bc');
    });

    // **to get points id for Passive**
    const addButtonPassive = document.getElementById('passivepointadd');
    addButtonPassive.addEventListener('click', () => {
        addPoint('design-var1', passListsend, 'list-container3', 'passive');
    });

     // **to clear selected ids for force**
     const clearButtonSelectedF = document.getElementById('clearforce');
     clearButtonSelectedF.addEventListener('click', () => {
         clearSelectedIDs(fListsend, selectedForceIDs, 'list-container1');
     });
 
     // **to clear selected ids for BC**
     const clearButtonSelectedBC = document.getElementById('clearbc');
     clearButtonSelectedBC.addEventListener('click', () => {
         clearSelectedIDs(bcListsend, selectedBCIDs, 'list-container2');
     });
 
     // **to clear selected ids for Passive**
     const clearButtonSelectedPassive = document.getElementById('clearpassive');
     clearButtonSelectedPassive.addEventListener('click', () => {
         clearSelectedIDs(passListsend, selectedPassIDs, 'list-container3');
     });

    // **to get last for area in  Force**
    const addButtonareaF = document.getElementById('forceareaadd');   
    addButtonareaF.addEventListener('click', () => {
        forceLast = 'area';
    });

    // **to get last for area in  BC**
    const addButtonareaBC = document.getElementById('bcareaadd');
    addButtonareaBC.addEventListener('click', () => {
        bcLast = 'area';
    });



    // Common function to clear selected IDs
    function clearSelectedIDs(list, selectedIDs, listContainerId) {
        selectedIDs.forEach(id => {
            const index = list.indexOf(id);
            if (index !== -1) {
                list.splice(index, 1); // remove id from the list
            }
        });
        selectedIDs.length = 0; // clear selected ids
    
    //    updateList(listContainerId, list);   
        // send all ids
        ipcRenderer.send('removed-spheres', selectedIDs);
    }


    async function handleSendButtonClick(buttonId, listContainerId, selectedIDs, type, last) {
        return new Promise((resolve) => {
            const listElementHTML = document.getElementById(buttonId).innerHTML;
            const designVarListTemp = listElementHTML.split('<br>');
            const nonEmptyDesignVarListTemp = designVarListTemp.map(item => item.trim()).filter(item => item !== '');
            const uniqueDesignVarSetTemp = new Set(nonEmptyDesignVarListTemp);
            const uniqueDesignVarListTemp = Array.from(uniqueDesignVarSetTemp);
    
            console.log(`Seçilen ID'ler:`, uniqueDesignVarListTemp);
    
            let updatedIDs;
    
            // Eğer selectedIDs bir obje (dict) ise
            if (type === 'force') {
                updatedIDs = { ...selectedIDs }; // Mevcut ID'leri kopyala
                
                // Yeni ID'leri ekleyelim
                uniqueDesignVarListTemp.forEach(id => {
                    if (!updatedIDs.hasOwnProperty(id)) {
                        updatedIDs[id] = {
                            x: parseFloat(document.getElementById("x-com").value) || 0,
                            y: parseFloat(document.getElementById("y-com").value) || 0,
                            z: parseFloat(document.getElementById("z-com").value) || 0,
                        };
                    }
                });
    
                // **Silinmiş ID'leri kaldır**
                Object.keys(updatedIDs).forEach(id => {
                    if (!uniqueDesignVarListTemp.includes(id)) {
                        delete updatedIDs[id];
                    }
                });
            } else if (type === 'bc') {
                updatedIDs = { ...selectedIDs }; // Mevcut ID'leri kopyala
                let xCom = false;
                let yCom = false;
                let zCom = false;
    
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
                // Yeni ID'leri ekleyelim
                uniqueDesignVarListTemp.forEach(id => {
                    if (!updatedIDs.hasOwnProperty(id)) {
                        updatedIDs[id] = {
                            x: xCom,
                            y: yCom,
                            z: zCom,
                        };
                    }
                });
    
                // **Silinmiş ID'leri kaldır**
                Object.keys(updatedIDs).forEach(id => {
                    if (!uniqueDesignVarListTemp.includes(id)) {
                        delete updatedIDs[id];
                    }
                });
            } else if (type === 'passive') {
                updatedIDs = [...selectedIDs]; // Mevcut ID'leri kopyala
    
                // Yeni ID'leri ekleyelim
                uniqueDesignVarListTemp.forEach(id => {
                    if (!updatedIDs.some(item => item.id === id)) {
                        updatedIDs.push({
                            id: id
                        });
                    }
                });
    
                // **Silinmiş ID'leri listeden çıkar**
                updatedIDs = updatedIDs.filter(item => uniqueDesignVarListTemp.includes(item.id));
            }
    
            console.log(`Güncellenmiş selectedIDs:`, updatedIDs);
    
            // Yeni ID'leri hesapla
            let newIDs;
            if (Array.isArray(selectedIDs)) {
                newIDs = uniqueDesignVarListTemp.filter(id => 
                    !selectedIDs.some(item => item.id === id)
                );
            } else if (typeof selectedIDs === "object" && !Array.isArray(selectedIDs)) {
                newIDs = uniqueDesignVarListTemp.filter(id => 
                    !selectedIDs.hasOwnProperty(id)
                );
            } else {
                console.error("selectedIDs geçersiz bir türde:", typeof selectedIDs);
                newIDs = [];
            }
    
            // type'a göre ilgili fonksiyonu çağır
            if (type === 'force') {
                forceComponents(newIDs, last); // Sadece type 'force' ise forceComponents'i çağır
            } else if (type === 'bc') {
                bcComponents(newIDs, last); // Sadece type 'bc' ise bcComponents'i çağır
            }
    
      //      updateList(listContainerId, Array.isArray(updatedIDs) ? updatedIDs : Object.keys(updatedIDs));
    
            resolve(updatedIDs);
        });
    }
});