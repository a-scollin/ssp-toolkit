
import React, { Component } from "react";
import PropTypes from "prop-types";
import ReactDOM from "react-dom";
import {
  mxGraph,
  mxRubberband,
  mxKeyHandler,
  mxClient,
  mxUtils,
  mxEvent,
  mxConstants,
  mxEdgeStyle
} from "mxgraph-js";

import 'react-reflex/styles.css'

import { black } from "ansi-colors";

export default class GraphView extends Component {
  constructor(props) {
    super(props);
    this.state = {};
    this.GraphRef = React.createRef()
  }

  componentDidMount() {
    this.LoadGraph()
  }

  LoadGraph() {

    var container = ReactDOM.findDOMNode(this.GraphRef.current);

    // Checks if the browser is supported
    if (!mxClient.isBrowserSupported()) {
      // Displays an error message if the browser is not supported.
      mxUtils.error("Browser is not supported!", 200, false);
    } else {
      // Disables the built-in context menu
      mxEvent.disableContextMenu(container);

      // Creates the graph inside the given container
      var graph = new mxGraph(container);

      // Enables rubberband selection
      new mxRubberband(graph);



      // Gets the default parent for inserting new cells. This is normally the first
      // child of the root (ie. layer 0).
      var parent = graph.getDefaultParent();

      // Enables tooltips, new connections and panning
      graph.setPanning(true);
      graph.setTooltips(true);
      graph.setConnectable(true);
      graph.setEnabled(true);
      graph.setEdgeLabelsMovable(false);
      graph.setVertexLabelsMovable(false);
      graph.setGridEnabled(true);
      graph.setAllowDanglingEdges(false);

      // styling
      var style = graph.getStylesheet().getDefaultVertexStyle();
      style[mxConstants.STYLE_STROKECOLOR] = 'gray';
      style[mxConstants.STYLE_STROKE] = 'gray';
      style[mxConstants.STYLE_ROUNDED] = true;
      style[mxConstants.STYLE_FILLCOLOR] = 'white';
      style[mxConstants.STYLE_FONTCOLOR] = 'black';
      style[mxConstants.STYLE_FONTSIZE] = '12';
      style[mxConstants.STYLE_SPACING] = 4;

      // edge style
      style = graph.getStylesheet().getDefaultEdgeStyle();
      style[mxConstants.STYLE_STROKECOLOR] = '#0C0C0C';
      style[mxConstants.STYLE_LABEL_BACKGROUNDCOLOR] = 'white';
      style[mxConstants.STYLE_ROUNDED] = true;
      style[mxConstants.STYLE_FONTCOLOR] = 'black';
      style[mxConstants.STYLE_FONTSIZE] = '10';
      style[mxConstants.STYLE_STROKEWIDTH] = '1.25';
      style[mxConstants.STYLE_EDGE] = mxEdgeStyle.ElbowConnector;

      graph.getModel().beginUpdate();
      try {
        //mxGrapg component
        var doc = mxUtils.createXmlDocument();
        var node = doc.createElement("Node");
        node.setAttribute("ComponentID", "[P01]");

        var vx = graph.insertVertex(
          parent,
          null,
          node,
          240,
          40,
          150,
          30,
        );

        var v1 = graph.insertVertex(
          parent,
          null,
          "shape1",
          20,
          120,
          80,
          30,
        );
        var v2 = graph.insertVertex(parent, null, "shape2", 300, 120, 80, 30);
        var v3 = graph.insertVertex(parent, null, "shape3", 620, 180, 80, 30);
        var e1 = graph.insertEdge(
          parent,
          null,
          "",
          v1,
          v2,
        );
        var e2 = graph.insertEdge(parent, null, "Edge 2", v2, v3);
        var e3 = graph.insertEdge(parent, null, "Edge 3", v1, v3);

        //data
      } finally {
        // Updates the display
        graph.getModel().endUpdate();
      }

      // Enables rubberband (marquee) selection and a handler for basic keystrokes
      var rubberband = new mxRubberband(graph);
      var keyHandler = new mxKeyHandler(graph);
    }
  }
  render() {
    return (
<div ref={this.GraphRef} className="graph-container" id="divGraph" />);
}

}