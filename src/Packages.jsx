import React, { Component } from "react";
import 'react-reflex/styles.css'
import {
    ReflexContainer,
    ReflexSplitter,
    ReflexElement
  } from 'react-reflex'
  
  import "react-reflex/styles.css";


export default class Packages extends Component {
  constructor(props) {
    super(props);
    this.state = {};
    this.GraphRef = React.createRef()
  }

  render() {
    return (
<ReflexContainer orientation="horizontal">
            <ReflexElement flex={0.2} minSize="100">
              <div className="video-panel">Video panel 1</div>
            </ReflexElement>
            <ReflexSplitter />
            <ReflexElement flex={0.2} minSize="100">
              <div className="video-panel">Video panel 2</div>
            </ReflexElement>
            <ReflexSplitter />
            <ReflexElement flex={0.2} minSize="100">
              <div className="video-panel">Video panel 3</div>
            </ReflexElement>
            <ReflexSplitter />
            <ReflexElement className="panel panel--empty">Empty</ReflexElement>
          </ReflexContainer>
    
    );}

}


