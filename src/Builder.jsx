import React, { Component } from "react";

import {
  ReflexContainer,
  ReflexSplitter,
  ReflexElement
} from 'react-reflex'

import {
  mxWindow
} from 'mxgraph-js';

import "react-reflex/styles.css";


import GraphView from "./GraphView";
import Packages from "./Packages";

export default class Builder extends Component {
  constructor(props) {
    super(props);
    this.state = {graphdata : null};    
  }

  onChange(event) {
    var file = event.target.files[0];
    var reader = new FileReader();
    reader.onload = (event) => {
      // The file's text will be printed here
      
    try {
        var json_data = JSON.parse(event.target.result);
    } catch (e) {
        alert("Please enter a JSON file");
        return;
    }
    
    this.setState({ graphdata: json_data });
    
    };
  
    reader.readAsText(file);
  }

  render() {

    return (      
      <ReflexContainer className="site-content" orientation="vertical">
      
      <ReflexElement className="video-panels" flex={0.15} minSize="100">
      <form>
  <label>
    Graph input:
    <input type="file" onChange={this.onChange.bind(this)} name="graph_file" />
  </label>
  <input type="submit" value="Reset" />
</form>
  </ReflexElement>
  <ReflexSplitter />
        <ReflexElement className="workboard" minSize="50">
          <GraphView graphdata={this.state.graphdata}/>
        </ReflexElement>
        <ReflexSplitter />
        <ReflexElement className="video-panels" flex={0.15} minSize="100">
<Packages/>        
</ReflexElement>
        
      </ReflexContainer>

    );
  }
}


