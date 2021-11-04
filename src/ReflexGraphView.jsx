import React, { Component } from "react";

import {
  ReflexContainer,
  ReflexSplitter,
  ReflexElement
} from 'react-reflex'

import GraphView from "./GraphView";

export const ReflexGraphView = React.forwardRef((props,ref)=>{
    <ReflexElement ref={ref}  minSize="50" className="graph-container" id="divGraph">
        hf8aehf8
            <GraphView forwardedRef={ref.current} selected={props.selected} graphdata={props.graphdata}/>
    </ReflexElement>
  });
  

 