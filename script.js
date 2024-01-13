import processXML from './js/xml.js';
import translateNodeName from './js/translation.js';

function download(filename, text) {
    var element = document.createElement('a');
    element.setAttribute('href', 'data:text/xml;charset=utf-8,' + encodeURIComponent(text));
    element.setAttribute('download', filename);

    element.style.display = 'none';
    document.body.appendChild(element);

    element.click();

    document.body.removeChild(element);
}


function handleFiles(files) {
    [...files].forEach(file => {
        console.log(this);
        console.log(file)
        if (file.type === "text/xml") {
            const reader = new FileReader();
            reader.onload = function (e) {
                const findings = processXML(e.target.result, (err, result) => {
                  if (err) {
                      console.error(err);
                  } else {
                      console.log('Processed XML:', result.processedXML);
                      console.log('HTML Entities Locations:', result.htmlEntitiesLocations);
                  }

                  createNavbarFromJson(result.processedXML['nucleares']);
                  //createXmlTreeView(result.processedXML, 'xmlTreeView');
                  // Rebuilding the original XML from the modified version
                  //const rebuiltXMLString = rebuildXML(result.processedXML, result.locations);
                  //const cleanedXMLString = rebuiltXMLString.replace(/&\#xD;/g, '');

                  // Trigger download
                  // download('rebuilt-file.xml', cleanedXMLString);
                });
                console.log(findings)
              
            };
            reader.readAsText(file);
        } else {
            alert("Please upload an XML file.");
        }
    });
}

// Drag and Drop Handlers
$(document).ready(function(){
    let dropArea = document.getElementById('drop-area');

    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, preventDefaults, false);
    });
    
    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }
    
    ['dragenter', 'dragover'].forEach(eventName => {
        dropArea.addEventListener(eventName, () => dropArea.classList.add('hover'), false);
    });
    
    ['dragleave', 'drop'].forEach(eventName => {
        dropArea.addEventListener(eventName, () => dropArea.classList.remove('hover'), false);
    });
    
    dropArea.addEventListener('drop', handleDrop, false);

    let fileElem = $('#fileElem');
    fileElem.change(function(){
         handleFiles(this.files)
    });
});

function handleDrop(e) {
    let dt = e.dataTransfer;
    let files = dt.files;

    handleFiles(files);
}


function createTreeNode(key, value, parentNode) {
    let li = document.createElement('li');
    parentNode.appendChild(li);

    // Create a span to hold the key (and value if it's a text node)
    let span = document.createElement('span');
    span.textContent = typeof value === 'object' ? key : `${key}: ${value}`;
    li.appendChild(span);

    if (typeof value === 'object' && value !== null && Object.keys(value).length > 0) {
        let ul = document.createElement('ul');
        ul.style.display = 'none'; // Initially hide the child elements
        li.appendChild(ul);
        span.addEventListener('click', function(event) {
            ul.style.display = ul.style.display === 'none' ? 'block' : 'none';
            event.stopPropagation(); // Prevent event bubbling
        });
        for (const [childKey, childValue] of Object.entries(value)) {
            createTreeNode(childKey, childValue, ul);
        }
    }
}

function createXmlTreeView(jsonObject, containerId) {
    let container = document.getElementById(containerId);
    let ul = document.createElement('ul');
    container.appendChild(ul);

    for (const [key, value] of Object.entries(jsonObject)) {
        createTreeNode(key, value, ul);
    }
}


function createNavbarFromJson(jsonData) {
    const navbarContainer = document.getElementById('xmlTab'); // Replace with your actual navbar container ID
    const keys = Object.keys(jsonData);

    keys.forEach((key, index) => {
        if (key === 'version') return; // Skip the 'version' element
        if (jsonData[key].hasOwnProperty('CSaveClass') && jsonData[key]['CSaveClass'].hasOwnProperty('$') && Object.keys(jsonData[key]['CSaveClass']).length  == 1) return;

        // Create the list item
        const listItem = $('<li></li>', {
            class: 'nav-item',
            role: 'presentation'
        });

        // Create the button
        const button = $('<button></button>', {
            class: 'nav-link',
            id: `${key}-tab`,
            'data-original-id': key,
            'data-bs-toggle': 'tab',
            'data-bs-target': `#${key}`,
            type: 'button',
            role: 'tab',
            'aria-controls': key,
            'aria-selected': index === 0 ? 'true' : 'false', // First tab as selected
            text: translateNodeName(key) // Translate the node name
        });

        // Append button to list item, and list item to the navbar
        $(listItem).append(button);
        $(navbarContainer).append(listItem);
        
        if($('#' + key).length == 0){
            createNewTab(key);
        }

        if(key === 'componentes' || key === 'objetos'){
            populateDropdownForTab(jsonData, key);
        }else{
            button.on('click', (event) => {
                event.preventDefault();
                const selectedItem = $(event.target).attr('data-original-id');
                // Function to handle displaying details for the selected item
                displayDetailsForSelection(jsonData, selectedItem, null); // Replace tabKey with key
            });
        }
    });
}

function populateDropdownForTab(jsonData, tabKey) {
    let tab = $(`#${tabKey}-tab`);
    const contents = tab.parent().html();
    tab.parent().html('<div class="btn-group">' + contents + '</div>');

    tab = $(`#${tabKey}-tab`);
    tab.addClass('btn');
    tab.parent().append($(`<button type="button" id="${tabKey}-tab-dropdown-btn" class="btn dropdown-toggle dropdown-toggle-split" data-bs-toggle="dropdown" aria-haspopup="true" aria-expanded="false"></button>`));
    tab.parent().append($(`<div class="dropdown-menu" id="${tabKey}-tab-dropdown" aria-labelledby="${tabKey}-tab-dropdown-btn"></div>`));

    const dropdown = $(`#${tabKey}-tab-dropdown`);
    if (!dropdown.length) return;

    // Clear existing options
    dropdown.empty();

    if (jsonData[tabKey]) {
        $.each(jsonData[tabKey], (index, item) => {
                dropdown.append($(`<a class="dropdown-item" data-bs-toggle="tab" data-bs-target="#${tabKey}-${index}" href="#">${index}</a>`));
                if($('#' + tabKey + '-' + index).length == 0){
                    createNewTab(tabKey + '-' + index);
                }
        });
    }

    // Add click event listener for dropdown items
    dropdown.on('click', '.dropdown-item', (event) => {
        event.preventDefault();
        const selectedItem = $(event.target).text();
        // Function to handle displaying details for the selected item
        displayDetailsForSelection(jsonData, tabKey, selectedItem);
    });
}

function displayDetailsForSelection(jsonData, tabKey, selectedItem) {
    // Find the selected item in the JSON data
    var child_node = 'CSaveClass';
    if(tabKey === 'LOGISTICA' || tabKey === 'INTERFAZ' || tabKey === 'AUDITORIAS' || tabKey === 'TRANSFORMACION'){
        child_node = 'CSave';
    }
    var item = jsonData[tabKey][selectedItem] ? jsonData[tabKey][selectedItem][child_node] : jsonData[tabKey][child_node];

    if(!item){
        item = jsonData[tabKey][selectedItem];
        console.log('Couldnt find CSaveClass or CSave, trying to use parent node');
    }

    if(!item){
        item = jsonData[tabKey];
        console.log('displayDetailsForSelection(jsonData,'+tabKey+','+selectedItem+') - item not found, using parent node');
    }

    // If the item was found
    if (item) {
        // Get the tab where the details should be displayed
        let tab_id;
        if(selectedItem == null){
            tab_id = tabKey;
        }else{
            tab_id = tabKey+'-'+selectedItem;
        }

        
        var tab = $('#' + tab_id);
        tab.empty();
        // Create a new list for the item details
        var list = $('<ul></ul>');

        // Recursive function to handle objects
        function handleObject(obj, list) {
            $.each(obj, function(key, value) {
                if (key === '$') return; // Skip the '$' element
                if (typeof value === 'object' && value !== null) {
                    var sublist = $('<ul></ul>');
                    var listItem = $('<li></li>').text(key + ':');
                    listItem.append(sublist);
                    list.append(listItem);
                    handleObject(value, sublist);
                } else {
                    var listItem = $('<li></li>');
                    listItem.text(key + ': ' + value);
                    list.append(listItem);
                }
            });
        }

        // Handle the item object
        handleObject(item, list);

        // Add the list to the tab
        tab.append(list)
        console.log('show('+tab_id+')');
        $('#' + tab_id).tab('show');
        console.log('show('+tab_id+')');
        //$('.tab-pane').removeClass('active');
        //$('#' + tabKey+'-'+selectedItem).addClass('active show');
    }else{
        console.log('displayDetailsForSelection(jsonData,'+tabKey+','+selectedItem+') - item not found');
    }
}

function createNewTab(name){
    $('<div class="tab-pane fade" id="'+name+'" role="tabpanel" aria-labelledby="'+name+'-tab"></div>').appendTo('#xmlTabContent');
}


async function test_mode(){
    let response = await fetch("./test/test_save_max.xml");
    let data = await response.blob();

    var f = new File([data], "test_save_max.xml", { type: 'text/xml' });
    handleFiles([f]);
}

$(document).ready(function(){  
    test_mode();
});