import React, { cloneElement, Component } from "react";

import {
  ReflexContainer,
  ReflexSplitter,
  ReflexElement
} from 'react-reflex'


import "react-reflex/styles.css";

import { MathJax, MathJaxContext } from "better-react-mathjax";

import GraphView from "./GraphView";
import Packages from "./Packages";

import TransformationTools from "./TransformationTools";
import CodeEditor from "./uiComponents/CodeEditor.jsx";

import CustomTreeView from "./uiComponents/CustomTreeView"

import CustomIconButton from "./uiComponents/CustomIconButton";
import Stack from '@mui/material/Stack';
import Divider from '@mui/material/Divider';
import { useFormControlUnstyled } from "@mui/material";
import { resolveInput } from "./helpers/import_helper"


const pako = require('pako');

const saveFile = async (blob) => {
  const a = document.createElement('a');
  a.download = 'exported_project.json';
  a.href = URL.createObjectURL(blob);
  a.addEventListener('click', (e) => {
    setTimeout(() => URL.revokeObjectURL(a.href), 30 * 1000);
  });
  a.click();
};


export default class Builder extends Component {

  // Initalise the main component 

  constructor(props) {
    super(props);
    this.transform_type = null
    this.transform_node = null
    this.transform_basename = null
    this.state = {graphdata : new Object(null), tree_data : [], selected : null, transformation_base : {}, transformation_display : {}};    
 
  }


  updateEquivs(newEquivs){

    var newGraphdata = {...this.state.graphdata}

    newGraphdata["equivs"] = newEquivs

    this.setState({graphdata : newGraphdata})

  }

  // Function to be passed to graph view for invoking an expansion 

  triggerTransformation(type, cell_value) {

  
    if(this.transformation_type != null){
      if(!window.confirm("You haven't finsihed the transformation, progress will be lost - are you sure you want to perform another transformation?")){         
        return
       }
     }

        this.transform_type = type

        this.transform_node = cell_value
        
        this.setState({transformation_base : JSON.parse(JSON.stringify(this.state.graphdata.modular_pkgs[this.state.selected])), transformation_display : this.state.graphdata.modular_pkgs[this.state.selected]});
    
  }

  // For parsing in the json or xml files 


  onProjectUpload(event) {

    var file = event.target.files[0];
    resolveInput(file, (json_data) => {
      if(!json_data.hasOwnProperty("modular_pkgs")){
        alert("Not correctly formatted JSON, needs modular_pkgs.")
        return
      }
      if(Object.keys(this.state.graphdata).length !== 0){
        if(!window.confirm("This will overwrite the current project, are you sure you want to continue?\nIf you want to add a graph to the current project use the + button.")){
          return 
        }
      }
      this.setState({ graphdata: json_data }, function(){
        this.createSelectItems();
      });
    })

    this.projUpload.value = null

  }

  createProj(){
    alert("HERER")
    if(Object.keys(this.state.graphdata).length !== 0){
      if(!window.confirm("This will overwrite the current project, are you sure you want to continue?\nIf you want to add a graph to the current project use the + button.")){
        return 
      }
    }
    var graphname = window.prompt("Please enter a name for the initial graph:", "Graph name");
    this.setState({graphdata: JSON.parse("{ \"modular_pkgs\" : {\"" + graphname + "\" : {\"graph\":{},\"oracles\" :[[]]}}, \"monolithic_pkgs\" :{}}")}, function() {
      this.createSelectItems();
    })
    
  }
  


  onGraphUpload(event){

    var file = event.target.files[0];
    resolveInput(file, (json_data) => {
      
      this.setState((prevState) => { 
        let tree_data = [...prevState.tree_data]
        let graphdata = { ...prevState.graphdata };  

        if(json_data.hasOwnProperty("modular_pkgs")){

          for(var graphname in json_data.modular_pkgs){

            tree_data.push({title : graphname , graphname : graphname, number : {"expand" : {}, "decompose" : {}, "composition" : {}, "equiv" : {}}, children : []})
            graphdata.modular_pkgs[graphname] = json_data.modular_pkgs[graphname];                     // update the name property, assign a new value                 

          }

            return { graphdata, tree_data }

        }else{

        if(json_data.hasOwnProperty("graph")){

          var graphname = window.prompt("Please enter a name for the graph:", "Graph name");
          tree_data.push({title : graphname , graphname : graphname, number : {"expand" : {}, "decompose" : {}, "composition" : {}, "equiv" : {}}, children : []})
          graphdata.modular_pkgs[graphname] = json_data;                     // update the name property, assign a new value                 
          return { graphdata, tree_data };            

        }else{

          alert("Incorrectly formatted JSON, please ensure there is a \'graph\' key.")
          return

          }

        }
        
      });
    })
  }
  

  createSelectItems() {
    let items = [];         
    var i = 0;
    for (var graphname in this.state.graphdata.modular_pkgs) {   
         items.push({title : graphname, number : {"expand" : {}, "decompose" : {}, "composition" : {}, "equiv" : {}}, graphname : graphname, children : []});   
         i++;
         //here I will be creating my options dynamically based on
         //what props are currently passed to the parent component

    }
    
    this.setState({tree_data : items, selected : items[0].graphname})

}  

updateGraphData(newGraphData, fin, transform_name=null){

if(fin){

  for(var element in this.state.tree_data) {
                
    if(this.matchSortableTreeElmSave(this.state.tree_data[element],newGraphData, transform_name)){
      return 
    }

  }

  var graphname = transform_name != null ? transform_name : this.state.selected + ' - ' + this.transform_type

  this.setState(prevState => {

    let tree_data = [...prevState.tree_data]
    let graphdata = { ...prevState.graphdata };  
    let transformation_base = {};
    let transformation_display = {};

    tree_data.push({'title' : graphname , 'graphname' : graphname, 'number' : {"expand" : {}, "decompose" : {}, "composition" : {}, "equiv" : {}}, 'children' : []})
    graphdata.modular_pkgs[graphname] = newGraphData;                     // update the name property, assign a new value                 

    this.transform_type = null
    this.transform_node = null

    return { graphdata, transformation_base, transformation_display, tree_data };                                 // return new object jasper object
    
  });

  return

}else{
  
  if(newGraphData.hasOwnProperty("modular_pkgs")){


    this.setState({graphdata : newGraphData})

  }else{

  this.setState({transformation_display : newGraphData})
  }
}

}

matchSortableTreeElmSave(element,newGraphData, transform_name){

  if (element.graphname == this.state.selected){

    var graphname = transform_name != null ? transform_name : this.state.selected + ' - ' + this.transform_type
    
    var number = element.number[this.transform_type]

    console.log('number')
    console.log(number)

    if(number.hasOwnProperty(graphname)){

      number = number[graphname]

      element.number[this.transform_type][graphname] += 1;
 
      graphname = graphname + '  (' + number.toString() + ') '

    }else{
      element.number[this.transform_type][graphname] = 1
    }

      element.children.push({title : graphname, graphname : graphname, number : {"expand" : {}, "decompose" : {}, "composition" : {}, "equiv" : {}}, children : []})
      
      this.setState(prevState => {

          
        let graphdata = { ...prevState.graphdata };  
        let transformation_base = {};
        let transformation_display = {};

        graphdata.modular_pkgs[graphname] = newGraphData;                     // update the name property, assign a new value                 

        this.transform_type = null
        
        return { graphdata, transformation_base, transformation_display };                                 // return new object jasper object
        
      });

      return true;
   
    }else{

      for(var child in element.children) {
        if(this.matchSortableTreeElmSave(element.children[child], newGraphData, transform_name)){
          return true;
        }

      }

    }

    return false;
  
  }

selectGraph(graphname){
  
  if(this.transform_type == null){

    this.setState({selected : graphname});
  }else if (!window.confirm("You haven't finsihed the transformation, progress will be lost - are you sure you want to change seleceted graph?")){
      return
    } else {

      this.transform_type = null

      this.setState({selected : graphname, transformation_base : {}, transformation_display : {}});
    }
  }


  lineNumberOfSelected(){
    
    var text = JSON.stringify(this.state.graphdata, null, '\t')


    var index = text.indexOf(this.state.selected); // => 18


    var tempString = text.substring(0, index);

    // Line number
    return tempString.split('\n').length;

  }

  updateSelected(newGraphData){
    this.setState(prevState =>{
      
      let graphdata = {...prevState.graphdata}
      
      graphdata.modular_pkgs[prevState.selected] = newGraphData

      if(prevState.transform_type !== null){

        let transformation_display = newGraphData

        let transformation_base = JSON.parse(JSON.stringify(newGraphData))

        return {graphdata, transformation_base, transformation_display}

      }

      return {graphdata}

    });
  }
 
  render() {



    if(this.state.graphdata.hasOwnProperty("modular_pkgs")){
    var transform = []

    if(this.transform_type != null){
      transform.push(<ReflexElement className="workboard" minSize="50" flex={0.5}> <GraphView allow_editing={false} selected={this.state.selected} triggerTransformationProp = {this.triggerTransformation.bind(this)} selected_graphdata={this.state.graphdata.modular_pkgs[this.state.selected]}/> </ReflexElement>)
      transform.push(<ReflexSplitter/>)
      transform.push(<ReflexElement className="workboard" minSize="50" flex={0.5}><GraphView allow_editing={false} selected={this.state.selected} triggerTransformationProp = {this.triggerTransformation.bind(this)} transform={true} selected_graphdata={this.state.transformation_display}/></ReflexElement>)
    }else{
      transform.push(<ReflexElement  flex={1} className="workboard" minSize="50">
      <GraphView allow_editing={true} selected={this.state.selected} update={this.updateSelected.bind(this)} triggerTransformationProp = {this.triggerTransformation.bind(this)} selected_graphdata={this.state.graphdata.modular_pkgs[this.state.selected]}/>
    </ReflexElement>)
    }



    var editor = [<CodeEditor text={JSON.stringify(this.state.graphdata.modular_pkgs[this.state.selected], null, '\t')} onSubmit={(newGraphData) => this.updateSelected(newGraphData)}  getLineNumber = {this.lineNumberOfSelected.bind(this)}/>]

    }else{
      var transform = <div></div>
      var editor = <div></div>
    }
    
    if(this.state.graphdata.hasOwnProperty('equivs')){
      var graphEquivs = this.state.graphdata['equivs']
    }else{
      var graphEquivs = []
    }    
    
    return (      
      <ReflexContainer style={{height:"100vh"}}orientation="horizontal">
        <ReflexElement flex={0.9} className="site-content">
          <ReflexContainer className="site-content" orientation="vertical">

            <ReflexElement className="video-panels" flex={0.20} minSize="100">
            <ReflexContainer orientation="horizontal">
                {/* <ReflexElement flex={0.5} className="video-panels" >
                <Packages graphdata={this.state.graphdata}/>
                </ReflexElement> */}
                <ReflexElement flex={1} className="video-panels" >
                  <>{editor}</>
                </ReflexElement>
              </ReflexContainer>
              
            </ReflexElement>

            <ReflexSplitter />
            
            <ReflexElement>
              <ReflexContainer>
                <>{transform}</>
              </ReflexContainer>
            </ReflexElement>
            
            <ReflexSplitter />
        
            <ReflexElement flex={0.2} className="video-panels" >
              <ReflexContainer orientation="horizontal">
                <ReflexElement flex={0.1} minSize="70">

                <Stack direction="row" spacing={1}>

                  <input type="file" style={{'display': 'none'}} ref={input => this.projUpload = input} onChange={this.onProjectUpload.bind(this)} id="proj_upload"/>
                  <CustomIconButton tip="Import project file" type={["import"]} func={() => this.projUpload.click()}/>
                  <CustomIconButton tip="Create new project file" type={["write"]} func={this.createProj.bind(this)}/>
                  <CustomIconButton tip="Export current project file" type={["export"]} func={() => saveFile(new Blob([JSON.stringify(this.state.graphdata, null, 2)], {type : 'application/json'}))}/>

                   </Stack>
                </ReflexElement>

                <ReflexSplitter/>
                
                <ReflexElement flex={0.9} minSize="100"> 
                <Stack direction="row" spacing={1}>
                <input type="file" style={{'display': 'none'}} ref={input => this.graphUpload = input} onChange={this.onGraphUpload.bind(this)} id="graph_upload"/>
                <CustomIconButton tip="Import graph" type={["add","import"]} func={Object.keys(this.state.graphdata).length !== 0 ? () => this.graphUpload.click() : () => alert("Please open a project file to add graphs.")}/>
                <CustomIconButton tip="Write new graph" type={["add","write"]} func={() => alert("not implemented yet!")}/> 
                </Stack>
                <Divider />
                <CustomTreeView tree_data={this.state.tree_data} select={this.selectGraph.bind(this)}/>
                </ReflexElement>
              </ReflexContainer>
            </ReflexElement>
        
          </ReflexContainer>
        </ReflexElement>
        
        <ReflexSplitter/>
        
        <ReflexElement className="video-panels">
          <TransformationTools update={this.updateGraphData.bind(this)} allGraphData={this.state.graphdata} updateEquivsProp={this.updateEquivs.bind(this)} equivs={graphEquivs} type={this.transform_type} node={this.transform_node} base={this.state.transformation_base}/>
        </ReflexElement>
      
      </ReflexContainer>
    );
  }
}


