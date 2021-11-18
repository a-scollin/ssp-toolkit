
import React, { Component } from "react";
import PropTypes from "prop-types";
import ReactDOM from "react-dom";
import Moveable from "react-moveable";
import 'react-reflex/styles.css'
import { black } from "ansi-colors";

import {
    ReflexContainer,
    ReflexSplitter,
    ReflexElement
  } from 'react-reflex'


export default class TransformationTools extends Component {
  constructor(props) {
    super(props);
    this.state = {graphdata : props.graphdata, transform : props.transformationselection, options : <></>};
    this.GraphRef = React.createRef()
   console.log("INIT")
  
  }

componentDidMount(prevProps){
    console.log("Transform mount")
    console.log(prevProps)
    console.log(this.props)
    console.log(this.state)
}

  componentDidUpdate(prevProps){

console.log("tramsupdate")
console.log(prevProps)
console.log(this.props)
console.log(this.state)

    if(this.props.graphdata != null && this.props.transformationselection != prevProps.transformationselection){
      this.setState({graphdata : this.props.graphdata, transformationselection : this.props.transformationselection},() => {
        if (this.props.transformationselection != null){
            this.setup()
        }
    });
    }
     
  }

  setup(){

    var options = []

    for (var node in this.state.graphdata.modular_pkgs[this.state.transformationselection].graph){
        if (node.split("_{").length == 2){
            options.push(node)
        }

    }

    this.setState({options : options.map((key,index) => {
        return(<ReflexElement flex={0.8} key={key}>{key}</ReflexElement>)
    })})


}

  udpateGraph(){
      if(this.state.transformationselection != null){
        this.props.update(this.state.graphdata);
      }
      
  }

  render() {
  
      return (
        <ReflexContainer orientation="vertical"> 
        <ReflexElement flex={0.8}>
        <ReflexContainer orientation="vertical">
            {this.state.options}
        </ReflexContainer>
            </ReflexElement>
            <ReflexSplitter/>
            <ReflexElement className="panel panel--empty">  <button onClick={this.udpateGraph.bind(this)}>Save</button></ReflexElement>
          </ReflexContainer>
    
    
        

      );
   
}

}