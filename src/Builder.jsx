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

import {
  ReflexContainer,
  ReflexSplitter,
  ReflexElement
} from 'react-reflex'

import 'react-reflex/styles.css'

import GraphView from "./GraphView";

import { black } from "ansi-colors";

export default class Builder extends Component {
  constructor(props) {
    super(props);
    this.state = {};

  }

  render() {
    return (

      <ReflexContainer orientation="vertical" >

<ReflexElement className="left-pane"  >
            
        
        <ReflexContainer orientation="horizontal" >

          <ReflexElement className="header" >
            <p>Yoyoyoy</p>
          </ReflexElement>

          <ReflexSplitter />

          <ReflexElement className="header">
            <p>Yeyeyeye</p>
          </ReflexElement>
        </ReflexContainer>

        </ReflexElement>

        <ReflexElement className="middle-pane">
          <div class='pane-content'>
            <GraphView />
          </div>
        </ReflexElement>

        <ReflexSplitter propagate={true} />

        <ReflexElement className="right-pane" >
          <div class='pane-content'>
            <input id='json-input' type='file' />
          </div>
        </ReflexElement>

      </ReflexContainer>




    );
  }
}


