const fs = require("fs");

const COLOR_RED = "#c21";
const COLOR_GREEN = "#3F3";
const COLOR_SELECTED = "#9fb";
const COLOR_LIGHT = "#ddd";
const COLOR_BLACK = "#000";

const projectsDir = __dirname + "/../projects/";

function loadProject(guid) {
    let project = {};
    project = JSON.parse(fs.readFileSync(projectsDir + guid + ".json"));
    return project;
}

function saveProject(project) {
    fs.writeFileSync(projectsDir + project.guid + ".json", JSON.stringify(project));
}

// Returns GUID of the newly created project
function createNewFromTemplate(name) {
    // Copy template project to new file
    let guid = crypto.randomUUID();
    fs.copyFileSync(projectsDir + "template.json", projectsDir + guid + ".json");

    // Set GUID in project file too
    let project = loadProject(guid);
    project.guid = guid;
    project.name = name;
    saveProject(project);

    return guid;
}

// Returns GUIDs of all available projects in the projects/ directory.
// Ignores the template project
function getProjects() {
    return fs.readdirSync(projectsDir).filter((p) => p != "template.json").map(x => x.split(".json")[0]);
}

function render(ctx, w, h, project) {
    ctx.clearRect(0, 0, w, h);

    //let boxes = {};  // {id: {x1, y1, x2, y2}, ...}

    ctx.translate(w / 2, h / 2);
    ctx.scale(project.zoom, project.zoom);
    ctx.translate(-w / 2, -h / 2);

    ctx.translate(project.x, project.y);

    // 0/0 is now the center of the canvas
    ctx.translate(w / 2, h / 2);

    // When creating a line check if hovering over another node
    // If so, mark that one differently to suggest a connection
    createLineToNode = null;
    if (createLineFromNode != null) {
        // Find node that we are hovering over
        let node = getNodeIDFromEventClick(mouse.x, mouse.y);
        if (node != null && createLineFromNode != node)
            createLineToNode = node;
    }

    // If showing available connection to node, check if there already is a connection
    // If null, the user is not creating a new connection using the SHIFT key.
    // If false, the connection doesn't exist yet.
    // If true, the connection does exist and will be removed
    let connectionExists = null;  // null | false | true
    if (createLineToNode != null) {
        connectionExists = false;
        project.data.connections.forEach((con) => {
            if (con.from == createLineFromNode && con.to == createLineToNode || con.from == createLineToNode && con.to == createLineFromNode)
                connectionExists = true;
        });
    }

    
    // Connection creation
    if (createLineFromNode !== null && connectionExists === null) {
        ctx.beginPath();
        let fromNode = project.data.nodes.filter(n => n.id == createLineFromNode)[0];
        let mousePos = getCanvasPosition(mouse.x, mouse.y);
        ctx.moveTo(fromNode.x, fromNode.y);
        ctx.lineTo(mousePos.x, mousePos.y);
        ctx.stroke();
    } else if (createLineFromNode !== null && connectionExists === false) {
        ctx.beginPath();
        let fromNode = project.data.nodes.filter(n => n.id == createLineFromNode)[0];
        let toNode = project.data.nodes.filter(n => n.id == createLineToNode)[0];
        ctx.moveTo(fromNode.x, fromNode.y);
        ctx.lineTo(toNode.x, toNode.y);
        ctx.strokeStyle = COLOR_GREEN;
        ctx.stroke();
    }

    // Draw connections
    project.data.connections.forEach((con) => {
        ctx.beginPath();
        
        let color = "#ccc";
        if (connectionExists === true && con.from == createLineFromNode && con.to == createLineToNode || con.from == createLineToNode && con.to == createLineFromNode) {
            color = "#f97";
        }
        ctx.strokeStyle = color;
        ctx.lineWidth = 3;

        let node1 = project.data.nodes.filter(n => n.id == con.from)[0];
        let node2 = project.data.nodes.filter(n => n.id == con.to)[0];

        ctx.moveTo(node1.x, node1.y);
        ctx.lineTo(node2.x, node2.y);

        ctx.stroke();
    });

    // Draw nodes
    project.data.nodes.forEach((node) => {

        // Background color of rectangle
        let color = "#ddd";
        if (node.id == createLineToNode && connectionExists === false) color = COLOR_GREEN;  // Color node green
        if (node.id == createLineToNode && connectionExists === true) color = COLOR_RED;   // Color node red (Connection will be removed)
        else if (selectedNodes.includes(node.id)) color = COLOR_SELECTED;

        // Draw rectangle with borders
        let border = 2;
        ctx.fillStyle = "#aaa";
        ctx.beginPath();
        ctx.roundRect(node.x - node.w / 2, node.y - node.h / 2, node.w, node.h, 10 + border);
        ctx.fill();

        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.roundRect(node.x - node.w / 2 + border, node.y - node.h / 2 + border, node.w - 2 * border, node.h - 2 * border, 10);
        ctx.fill();

        
        // Edit mode hint
        if (editingNodes.includes(node.id)) {
            let b = 5;
            ctx.fillStyle = "#aaa9";
            ctx.fillRect(node.x - node.w / 2 + b, node.y - node.h / 2 + b, node.w - 2 * b, node.h - 2 * b);
        }

        // Node text
        ctx.textAlign = "center";
        if (node.text === "") {
            ctx.fillStyle = "#888";
            ctx.font = "italic 15px Monospace";
            ctx.fillText("<Empty Node>", node.x, node.y, node.w - 15)
        } else {
            let split = node.text.split("\n");
            ctx.fillStyle = "#111";
            ctx.font = "15px Monospace";
            let lineHeight = 17;
            let yOffset = -(split.length * lineHeight / 2);
            split.forEach((line, i) => {
                ctx.fillText(line, node.x, node.y + yOffset + (i * lineHeight), node.w - 15)
            });
        }
        

        // NODE CENTER DOT
        /*ctx.beginPath();
        ctx.fillStyle = "black";
        ctx.arc(nodeCenterX, nodeCenterY, 5, 0, 2 * Math.PI);
        ctx.fill();*/
    });    


    /*let x1 = (w / 2 / project.zoom) + (project.x / project.zoom);
    let y1 = 0;
    let x2 = 0;
    let y2 = 0;

    x1 = Math.round(x1);
    y1 = Math.round(y1);
    x2 = Math.round(x2);
    y2 = Math.round(y2);*/

    let t = ctx.getTransform();
    canvasRect.x1 = -t.e / project.zoom;
    canvasRect.y1 = -t.f / project.zoom;
    canvasRect.x2 = canvasRect.x1 + (w / project.zoom);
    canvasRect.y2 = canvasRect.y1 + (h / project.zoom);

    //ctx.fillStyle = "red";
    //ctx.fillRect(canvasRect.x1 + 50, canvasRect.y1 + 50, canvasRect.x2 - canvasRect.x1 - 100, canvasRect.y2 - canvasRect.y1 - 100);

    ctx.resetTransform();
}

function insideBox(x1, y1, x2, y2, px, py) {
    return x1 < px && px < x2 && y1 < py && py < y2;
}

function getCanvasPosition(px, py) {
    // Relative click position (0 - 1)
    let relX = (px / canvas.width);
    let relY = (py / canvas.height);

    // Calculated
    let ex = canvasRect.x1 + relX * (canvasRect.x2 - canvasRect.x1);
    let ey = canvasRect.y1 + relY * (canvasRect.y2 - canvasRect.y1);

    return {x: ex, y: ey};
}

function getNodeIDFromEventClick(x, y) {
    let pos = getCanvasPosition(event.clientX, event.clientY);
    let clickedOnNode = project.data.nodes.filter((node) => {
        return insideBox(node.x - node.w / 2, node.y - node.h / 2, node.x + node.w / 2, node.y + node.h / 2, pos.x, pos.y);
    })[0];

    return clickedOnNode == undefined ? null : clickedOnNode.id;
}

function selectNode(nodeId, additive) {
    editingNodes = [];
    
    if (additive) {
        if (selectedNodes.includes(nodeId)) {
            // Already selected, deselect it
            selectedNodes = selectedNodes.filter(id => id !== nodeId);
        } else {
            // Additively select it
            selectedNodes.push(nodeId);
        }
    } else {
        // Select only this node
        selectedNodes = [nodeId];
    }
}

function createNode(x, y) {
    return {
        id: Math.floor(Math.random() * 9999999999999999),
        x: x,
        y: y,
        text: "",
        w: 160,
        h: 120
    };
}

function addKeyHint(key, text) {
    let a = document.createElement("div");
    a.className = "tooltip";

    let aKey = document.createElement("p");
    aKey.className = "tooltip__key";
    aKey.innerText = key;

    let aText = document.createElement("p");
    aText.className = "tooltip__text";
    aText.innerText = text;

    a.appendChild(aKey);
    a.appendChild(aText);
    document.getElementById("tooltips").appendChild(a);
}


// Show modal
let projects = getProjects();
projects.forEach((id) => {
    let proj = JSON.parse(fs.readFileSync(projectsDir + id + ".json"));

    let el = document.createElement("p");
    el.className = "projects__project";
    el.innerText = proj.name;
    el.setAttribute("guid", proj.guid);

    el.addEventListener("click", (event) => {
        // Hide modal
        document.getElementById("modal").style.visibility = "hidden";
        modalIsOpen = false;

        // Load project
        let guid = event.target.getAttribute("guid");
        project = loadProject(guid);
        rerender();
    });

    document.getElementById("projects").appendChild(el);
});

document.getElementById("create-btn").addEventListener("click", (event) => {
    // Create project with given name
    let name = document.getElementById("create-name").value;
    let guid = createNewFromTemplate(name);
    project = loadProject(guid);
    rerender();

    // Hide modal
    document.getElementById("modal").style.visibility = "hidden";
    modalIsOpen = false;
});

var modalIsOpen = true;

addKeyHint("r", "Reset View");
addKeyHint("e", "Edit selected nodes");
addKeyHint("n", "Create new node");
addKeyHint("SHIFT", "Connect Nodes");
addKeyHint("DELETE", "Delete Nodes");

var project = null;

var canvas = document.getElementById("canvas");
var ctx = canvas.getContext("2d");
var canvasRect = {
    x1: null,
    y1: null,
    x2: null,
    y2: null
};

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

var mouse = {x: null, y: null};
var isDraggingView = false;
var isDraggingNode = false;
var dragStart = {x: null, y: null};
var distanceDragged = null;  // For checking if node is dragged or clicked
var selectDragThreshold = 10;  // If below this value, the node should be selected
var defaultZoom = 1;

var saveInterval = setInterval(() => {
    // Check if something changed
    if (!modalIsOpen && project !== null && JSON.stringify(loadProject(project.guid)) != JSON.stringify(project)) {
        saveProject(project);
        console.log("saved");
    }
}, 1000);

var createLineFromNode = null;  // null | "nodeID"
var createLineToNode = null;    // null | "nodeID"

var editingNodes = [];  // nodeIDs that are currently edited

var selectedNodes = [];  // List of node IDs

var rerender = () => {
    render(ctx, canvas.clientWidth, canvas.clientHeight, project);
};

canvas.addEventListener("mousedown", (event) => {
    // Drag view with middle mouse button
    if (event.button == 1) {
        isDraggingView = true;
        dragStart.x = event.clientX;
        dragStart.y = event.clientY;
    } else if (event.button == 0) {
        if (createLineFromNode !== null && createLineToNode !== null) {
            // Check if that connection already exists
            let connectionExists = project.data.connections.filter(con => (con.from === createLineFromNode && con.to === createLineToNode || con.from === createLineToNode && con.to === createLineFromNode)).length === 1;
            if (connectionExists) {
                // Remove connection from nodes
                project.data.connections = project.data.connections.filter((con) => {
                    return !(con.from === createLineFromNode && con.to === createLineToNode || con.from === createLineToNode && con.to === createLineFromNode);
                });
            } else {
                // Create new connection between nodes
                project.data.connections.push({
                    from: createLineFromNode,
                    to: createLineToNode
                });
            }
        }

        isDraggingNode = true;
        dragStart.x = event.clientX;
        dragStart.y = event.clientY;
        
        rerender();
    }
});

canvas.addEventListener("mouseup", (event) => {
    // Stop dragging
    if (isDraggingView) {
        isDraggingView = false;
    
    } else if (isDraggingNode) {
        // Check if dragged just a tiny bit, because then it is a SELECT
        if (distanceDragged < selectDragThreshold) {
            let node = getNodeIDFromEventClick(event.clientX, event.clientY);
            selectNode(node, event.ctrlKey);
            rerender();
        }

        isDraggingNode = false;
        distanceDragged = 0;
    }
});

canvas.addEventListener("mousemove", (event) => {
    mouse.x = event.clientX;
    mouse.y = event.clientY;

    if (createLineFromNode != null) {
        rerender();
    }

    if (isDraggingView) {
        project.x += (event.clientX - dragStart.x) / project.zoom;
        project.y += (event.clientY - dragStart.y) / project.zoom;

        dragStart.x = event.clientX;
        dragStart.y = event.clientY;
        rerender();
    } else if (isDraggingNode) {
        let dx = (event.clientX - dragStart.x) / project.zoom;
        let dy = (event.clientY - dragStart.y) / project.zoom;
        dragStart.x = event.clientX;
        dragStart.y = event.clientY;

        distanceDragged += Math.sqrt(Math.pow(event.clientX - dragStart.x, 2) + Math.pow(event.clientY - dragStart.y, 2));

        project.data.nodes.forEach((node) => {
            if (selectedNodes.includes(node.id)) {
                node.x += dx;
                node.y += dy;
            }
        });

        rerender();
    }

    let pos = getCanvasPosition(event.clientX, event.clientY);
    //console.log(pos);
});

canvas.addEventListener("wheel", (event) => {
    const minZoom = 0.05;
    const maxZoom = 2;

    project.zoom += -event.deltaY / 1000;
    if (project.zoom < minZoom) project.zoom = minZoom;
    else if (project.zoom > maxZoom) project.zoom = maxZoom;
    
    rerender();
});

window.addEventListener("keydown", (event) => {
    if (modalIsOpen) return;

    // Write node text
    if (editingNodes.length > 0) {
        if (event.key == "Escape") {
            editingNodes = [];
        } else {
            project.data.nodes.forEach((node) => {
                if (editingNodes.includes(node.id)) {
                    // Add text to nodes that are currently being edited
                    if (event.key == "Backspace") {
                        node.text = node.text.substr(0, node.text.length - 1);
                    } else if (event.key == "Enter") {
                        node.text += "\n";
                    } else if (event.key.length == 1) {
                        node.text += event.key;
                    }
                }
            });
        }
    
    // Shortcut keys
    } else {
        if (event.repeat) return;

        // Reset view
        if (event.key == "r") {
            // Calculate average positions
            let nNodes = project.data.nodes.length;
            project.x = -project.data.nodes.map((n) => n.x).reduce((a, b) => a + b) / nNodes;
            project.y = -project.data.nodes.map((n) => n.y).reduce((a, b) => a + b) / nNodes;

            // Zoom out till all nodes are visible
            project.zoom = 2;
            while (true) {
                rerender();
                let nVisible = project.data.nodes.filter((n) => insideBox(canvasRect.x1, canvasRect.y1, canvasRect.x2, canvasRect.y2, n.x, n.y)).length;
                let allFit = nVisible == nNodes;
                if (allFit) {
                    project.zoom -= project.zoom / 4;
                    break;
                }
                project.zoom -= 0.05;
            }
        
        // Create connection between two nodes
        } else if (event.key == "Shift") {
            if (selectedNodes.length == 1) {
                createLineFromNode = selectedNodes[0];
            }
        
        // Edit node(s)
        } else if (event.key == "e") {
            editingNodes = selectedNodes;
        
        // Create new node
        } else if (event.key == "n") {
            let pos = getCanvasPosition(mouse.x, mouse.y);
            project.data.nodes.push(createNode(pos.x, pos.y));
        
        // Remove node
        } else if (event.key == "Delete") {
            // Remove nodes
            project.data.nodes = project.data.nodes.filter((n) => {
                return !selectedNodes.includes(n.id);
            });

            // Remove connections
            project.data.connections = project.data.connections.filter((con) => {
                return !(selectedNodes.includes(con.from) || selectedNodes.includes(con.to));
            });

            selectedNodes = [];
        }
    }

    rerender();
});

window.addEventListener("keyup", (event) => {
    if (modalIsOpen) return;
    
    if (event.key == "Shift") {
        createLineFromNode = null;
        rerender();
    }
});