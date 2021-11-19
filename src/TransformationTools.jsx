
import React, { Component } from "react";
import PropTypes from "prop-types";
import ReactDOM from "react-dom";
import Moveable from "react-moveable";
import 'react-reflex/styles.css'
import { black } from "ansi-colors";
import Slider from '@mui/material/Slider';

import {
    ReflexContainer,
    ReflexSplitter,
    ReflexElement
  } from 'react-reflex'
import { ThemeProvider } from "react-bootstrap";


export default class TransformationTools extends Component {
  constructor(props) {
    super(props);
    this.state = {graphdata : null, selection : null, type : null, options : []};
    this.GraphRef = React.createRef()
    this.valdict = {}
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

    if(this.props.graphdata != null && this.props.transformationselection != prevProps.transformationselection && this.props.transformationselection != null){
        if (this.props.transformationselection[1] == 'expand'){
      this.setState({graphdata : this.props.graphdata, selection : this.props.transformationselection[0], type : this.props.transformationselection[1]},() => {
        if (this.props.transformationselection != null){
            this.setup()
        }
    });} else if (this.props.transformationselection[1] == 'decompose'){
        console.log("Here")
        console.log(this.props.transformationselection)
        this.setState({graphdata : this.props.graphdata, selection : this.props.transformationselection[0], type : this.props.transformationselection[1], in_edges : this.props.transformationselection[2], out_edges : this.props.transformationselection[3], decomp : this.props.transformationselection[4]},() => {
            if (this.props.transformationselection != null){
                this.setup()
            }
        });
    }

    }
     
  }

decompose(event){
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
    
    
        var subGraph = json_data;

        if(!subGraph.hasOwnProperty("oracles") || !subGraph.hasOwnProperty("graph")){        
            alert("Please ensure subgraph file is correct!")
            return
        }

        if(subGraph.oracles.length != this.state.in_edges) {
            alert("Please ensure in_edges match") 
            return
        }

        var out = 0;
        for(var node in subGraph.graph){
            for(var edge in subGraph.graph[node]){
                if (subGraph.graph[node][edge][0] == ""){
                    out++;
                }
            }
        }

        if (out != this.state.out_edges){
            alert("Please ensure out_edges match") 
            return
        }

        var newGraph = JSON.parse(JSON.stringify(this.state.graphdata));

        for(var edge in newGraph.modular_pkgs[this.state.selection].oracles){
            if (newGraph.modular_pkgs[this.state.selection].oracles[edge][0] == this.state.decomp) {
                for (var subedge in subGraph.oracles) {
                    if (subGraph.oracles[subedge][1] == newGraph.modular_pkgs[this.state.selection].oracles[edge][1]){
                        
                        newGraph.modular_pkgs[this.state.selection].oracles[edge][0] = subGraph.oracles[subedge][0]
                    }
                }
            }
        }

        

                for (var edge in newGraph.modular_pkgs[this.state.selection].graph[this.state.decomp]){
                    console.log(newGraph.modular_pkgs[this.state.selection].graph[this.state.decomp][edge])
                    for( var subgraph in subGraph.graph){
                        for( var subedge in subGraph.graph[subgraph]){
                            if (subGraph.graph[subgraph][subedge][1] == newGraph.modular_pkgs[this.state.selection].graph[this.state.decomp][edge][1]){

                                subGraph.graph[subgraph][subedge][0] = newGraph.modular_pkgs[this.state.selection].graph[this.state.decomp][edge][0]

                            } 
                        }
                        
                    }
                    
                
            
        }

        delete newGraph.modular_pkgs[this.state.selection].graph[this.state.decomp]; 

        for(var subgraph in subGraph.graph){
            newGraph.modular_pkgs[this.state.selection].graph[subgraph] = subGraph.graph[subgraph]

        }

        this.setState({graphdata : newGraph}, ()=>{
        this.udpateGraph(false)
    })


    };
  
    reader.readAsText(file);
}

  setup(){

    var options = []

    if (this.state.type == "expand"){

        for (var node in this.state.graphdata.modular_pkgs[this.state.selection].graph){
            if (node.split("_{").length == 2){
                options.push(<ReflexElement flex={0.8} key={node}>{node}
                <div key={node} reference={node} className="boxpad">
                <Slider style={{opacity : 1}}
  aria-label="Temperature"
  defaultValue={30}
  valueLabelDisplay="auto"
  step={1}
  marks
  min={1}
  max={10}
  name={node}
  onChange={ (e, val) => this.expand(e.target)}  />
</div>
                </ReflexElement>)
                options.push(<ReflexSplitter/>)
            }
        }

        options.pop()

        console.log("HERE")
        console.log(options)


        this.setState({options : options});
        
    }else if (this.state.type == "decompose"){
        options.push(<ReflexElement flex={0.8} key={node}>{node}
                  <form>
  <label>
    Subgraph input:
    <input type="file" onChange={this.decompose.bind(this)} name="graph_file" />
  </label>
  <input type="submit" value="Reset" />
</form>
            </ReflexElement>)

            this.setState({options : options})
    }

}

expand(target){
    

    if(!this.valdict.hasOwnProperty(target.name)){
        this.valdict[target.name] = target.value
    }
    
    if(this.valdict[target.name] != target.value){
        this.valdict[target.name] = target.value

        var newGraph = this.state.graphdata;


        for(var node in newGraph.modular_pkgs[this.state.selection].graph){
            if(node == target.name){


                console.log(node)

                break 
            }
        }

    this.setState({graphdata : newGraph}, ()=>{
        this.udpateGraph(false)
    })
    
}
    
}

  udpateGraph(fin=true){
      if(this.state.selection != null){
        this.props.update(this.state.graphdata,fin);
        if (fin){
        this.setState({graphdata : null, selection : null, type : null, options : []});
        this.valdict = {};
    }
}
      
  }

  render() {

    var save_tool =  this.state.selection != null ? <button onClick={this.udpateGraph.bind(this)}>Save</button> : <></>
  
      return (
        <ReflexContainer orientation="vertical"> 
        <ReflexElement flex={0.8}>
        <ReflexContainer orientation="vertical">
            {this.state.options}
        </ReflexContainer>
            </ReflexElement>
            <ReflexSplitter/>
            <ReflexElement className="panel panel--empty">{save_tool}</ReflexElement>
          </ReflexContainer>
    
    
        

      );
   
}

}