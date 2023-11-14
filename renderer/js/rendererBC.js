const { ipcRenderer } = require('electron');

document.addEventListener('DOMContentLoaded', () => {
    
    const boundaryButton = document.getElementById('boundary');  // Boundary button
    const force = document.getElementById("force"); // apply force button
    const bc = document.getElementById("bc"); // apply bc button
    const modal1 = document.querySelector(".modal1");
    const modal2 = document.querySelector(".modal2");
    const forcebc = document.getElementById("force-bc"); // the dialog
    const closeBtn1 = document.querySelector(".close-btn1")
    const closeBtn2 = document.querySelector(".close-btn2")
    const closeDialogButton = document.getElementById('closeDialog'); // close dialog
  // const forcepointadd = document.getElementById('forcepointadd'); // add button force
  // const bcpointadd = document.getElementById('bcpointadd'); // add button for bc
    var fdictionarysend = {};
    var bdictionarysend = {};
    const forceSend = document.getElementById('forceSend');
    const bcSend = document.getElementById('bcSend');
    var forceDict = {};
    var bcDict = {};
    var forceDictsend = {};
    var bcDictsend = {};
    var forcesend = {};
    var bcsend = {};

      
    boundaryButton.addEventListener('click', async () => {
        console.log("Clicked boundary con button!!");
        forcebc.show();              
    });
    force.addEventListener('click', async () => {
        modal1.style.display = "block"
    });
    closeBtn1.onclick = function(){
        modal1.style.display = "none"
    }
    bc.addEventListener('click', async () => {
        modal2.style.display = "block"
    });
    closeBtn2.onclick = function(){
        modal2.style.display = "none"
    }
    // Event listener for closing the dialog
    closeDialogButton.addEventListener('click', () => {
        forcebc.close();
    });
    
    function addButtonClickListener(buttonId, designVarId, strainId, displacementId, listContainerId, dictionary, dictsend, pointSubmit) {
        const button = document.getElementById(buttonId);
        const pointSub = document.getElementById(pointSubmit);
           
        button.addEventListener('click', async () => {
            const designvar = document.getElementById(designVarId).innerHTML;
            const strain = document.getElementById(strainId).innerHTML;
            const disp = document.getElementById(displacementId).innerHTML;
    
            const dArray = designvar.split(" ");
            const sArray = strain.split(" ");
            const disArray = disp.split(" ");
    
            const dValue = dArray[2];
            const sValue = sArray[2];
            const disValue = disArray.slice(1, 4);
    
            if (dValue != null && !dictionary.hasOwnProperty(dValue)) {
                dictionary[dValue] = {
                    strain: sValue,
                    displacement: disValue
                };
                updateList(listContainerId, dictionary); // Update the displayed list
                if (buttonId == 'forcepointadd'){
                    fdictionarysend = dictionary;
                }else {
                    bdictionarysend = dictionary;
                }                
            }
            console.log('send ', fdictionarysend);       
            
            pointSub.addEventListener('click', async () => {
                if (pointSubmit == 'forcepointSub'){
                    forcesend = fdictionarysend;
                }else {
                    bcsend = bdictionarysend;
                }    
                console.log('bsend: ',bcsend);
                console.log('fsend: ', forcesend);
            }); 
        });   
    }
    
    function updateList(listContainerId, dictionary) {
        const listContainer = document.getElementById(listContainerId);
    
        // Clear existing list
        listContainer.innerHTML = "";
    
        // Create a list of keys and remove buttons
        for (const key in dictionary) {
            if (dictionary.hasOwnProperty(key)) {
                const listItem = document.createElement("li");
                listItem.textContent = key;
    
                const removeButton = document.createElement("button");
                removeButton.textContent = "Remove";
                removeButton.addEventListener("click", () => {
                    // Remove the element from the dictionary
                    delete dictionary[key];
                    updateList(listContainerId, dictionary); // Update the displayed list
                });
    
                listItem.appendChild(removeButton);
                listContainer.appendChild(listItem);
            }
        }
    }

    // Function to handle force component submission
    function addForceComponentListener(submitButtonId, forceDict) {
        const submitButton = document.getElementById(submitButtonId);

        submitButton.addEventListener('click', async () => {
            const xComponent = document.getElementById("x-com").value;
            const yComponent = document.getElementById("y-com").value;
            const zComponent = document.getElementById("z-com").value;

            const forceComponents = {
                x: parseFloat(xComponent) || 0,
                y: parseFloat(yComponent) || 0,
                z: parseFloat(zComponent) || 0,
            };
            console.log("xcom: ", forceComponents);
            
            forceDictsend = forceComponents
            updateList('list-container1', forceDict);

            // send forceDictsend for components
        });
    }

    function addBCComponentListener(addButtonId, submitButtonId, bcDict, bcdictsend) {
        const addButton = document.getElementById(addButtonId);
        const submitButton = document.getElementById(submitButtonId);

        let xCom = false;
        let yCom = false;
        let zCom = false;

        // for x, y, and z components
        const xComponentButton = document.getElementById('x-btn');
        const yComponentButton = document.getElementById('y-btn');
        const zComponentButton = document.getElementById('z-btn');

        xComponentButton.addEventListener('click', () => {
            xCom = !xCom;
        });

        yComponentButton.addEventListener('click', () => {
            yCom = !yCom;
        });

        zComponentButton.addEventListener('click', () => {
            zCom = !zCom;
        });

        addButton.addEventListener('click', () => {
            const bcComponents = {
                x: xCom,
                y: yCom,
                z: zCom,
            };

            bcDictsend = bcComponents;
            updateList('list-container2', bcDict);
            console.log('bcComp: ', bcComponents);

            // send bcDictsend 
        });
    }

    // for design domain part: design-var1, strain-energy1, displacement1
    addButtonClickListener('forcepointadd', 'design-var1', 'strain-energy1', 'displacement1', 'list-container1', forceDict, forceDictsend, 'forcepointSub');
    addButtonClickListener('bcpointadd', 'design-var1', 'strain-energy1', 'displacement1', 'list-container2', bcDict, bcDictsend, 'bcpointSub');
    
    // Add listeners for force and bc component submissions
    addForceComponentListener('forceFSubmit', forceDict);
    addBCComponentListener('bccomadd','bcFSubmit', bcDict);

    forceSend.addEventListener('click', async () => {
        const f = {bc: 'force'};
        f['points'] = fdictionarysend;
        f['components'] = forceDictsend; 
      
        console.log('BC: ', f['bc']);
        console.log('points:  ', f['points']);
        console.log('componenets: ', f['components']);
        console.log(f);
        const data = f;

        ipcRenderer.send('send-BCparams', f);

    });

    bcSend.addEventListener('click', async () => {
        const b = {bc: 'bc'};
        b['points'] = bdictionarysend;
        b['components'] = bcDictsend; 
        console.log('BC: ', b['bc']);
        console.log('points:  ', b['points']);
        console.log('componenets: ', b['components'])
        console.log(b);
        ipcRenderer.send('send-BCparams', b);

    });
});


