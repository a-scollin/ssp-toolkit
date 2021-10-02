window.onload = function() {

    var container = document.getElementById('graphview')

    var model = new mxGraphModel();

    var graph = new mxGraph(container, model)

    // Gets the default parent for inserting new cells. This
    // is normally the first child of the root (ie. layer 0).
    var parent = graph.getDefaultParent();

    // Adds cells to the model in a single step
    model.beginUpdate();
    try {
        var v1 = graph.insertVertex(parent, null, 'Hello,', 20, 20, 80, 30);
        var v2 = graph.insertVertex(parent, null, 'World!', 200, 150, 80, 30);
        var e1 = graph.insertEdge(parent, null, '', v1, v2);
    } finally {
        // Updates the display
        model.endUpdate();
    }
    alert("Yo")
}