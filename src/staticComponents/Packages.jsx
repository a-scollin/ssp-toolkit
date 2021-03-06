import React, { Component } from "react";
import 'react-reflex/styles.css'
import {
    ReflexContainer,
    ReflexSplitter,
    ReflexElement
  } from 'react-reflex'
  
  import "react-reflex/styles.css";

import { MathJax, MathJaxContext } from "better-react-mathjax";

import Tex2SVG from "react-hook-mathjax";
import { ThemeConsumer } from "react-bootstrap/esm/ThemeProvider";
import { isCompositeComponentWithType } from "react-dom/test-utils";

const PCODE = {
    "@bin" : "{0, 1}",
    "@bot": "\\bot",
    "@neq" : "\\neq",
    "@gets" : "\\leftarrow",
    "@sample" : "\\leftarrow",
    "@>" : "\\indent;", // an indent
    "@assert": "\\textbf{assert }",
    "@if" : "\\textbf{if }",
    "@then" : "\\textbf{then }",
    "@else" : "\\textbf{else }",
    "@for" : "\\textbf{for }",
    "@do" : "\\textbf{do }",
    "@return" : "\\textbf{return }"
};



export default class Packages extends Component {
  constructor(props) {
    super(props);
    this.state = {graphdata : props.graphdata, listItems : <ReflexElement flex={0.5}><div> {''} </div></ReflexElement>};
    this.GraphRef = React.createRef()
    this.config = {
        loader: { load: ["[tex]/html"] },
        tex: {
          packages: { "[+]": ["html"] },
          inlineMath: [
            ["$", "$"]
          
          ],
          displayMath: [
            ["$$", "$$"]

          ]
          
        },
        displayAlign: "left", 
        inlineAlign: "left"
      };
  }


  componentDidMount(prevProps){
    console.log("CODEMOUNT")
    console.log(this.state)
    if (this.state.graphdata != {}){
    this.LoadCode();
      }

  }


  componentDidUpdate(prevProps){

      if ( prevProps.graphdata != this.props.graphdata ){
        this.setState({graphdata : this.props.graphdata}, () => {
            this.LoadCode();
        })
        
      }
  }

  LoadCode(){

    if(this.state.graphdata.hasOwnProperty("monolithic_pkgs")){

        var code = {}

        for(var pack in this.state.graphdata.monolithic_pkgs){
            
            code[pack] = {}

            for(var fun in this.state.graphdata.monolithic_pkgs[pack]) {
                if (fun == 'oracles'){
                
                    for (var oracle in this.state.graphdata.monolithic_pkgs[pack][fun]){
                        
                        code[pack][oracle] = this.FormatCode(this.state.graphdata.monolithic_pkgs[pack][fun][oracle].code)
                       
                    }
                
                }else{
                    code[pack][fun] = this.FormatCode(this.state.graphdata.monolithic_pkgs[pack][fun].code)
                
                }
                
            }
            }

            var codeItems = Object.keys(code).map((key, index) => {
                return(
                <div key={key}>
                    <h1>{key}</h1>
                    <hr/>
                    <MathJaxContext config={this.config} key={key+"context"}>
                {Object.keys(code[key]).map((key1,index1) => {
                    return(<><h2>{key1}</h2><hr/><MathJax dynamic>$${'\\displaylines{' + code[key][key1] + '}'}$$</MathJax><hr/></>)  
                })}
                </MathJaxContext>
                </div>
                )
            });
               
            this.setState({listItems : codeItems})
        }
    }

    FormatCode(code){
        var lines = code.split(";")
        for (var line in lines){
            var tokens = lines[line].split(" ");

            for(var token in tokens){
                if (tokens[token] in PCODE){
                    tokens[token] = PCODE[tokens[token]]
                }
            }
            lines[line] = tokens.join(" ")

        }

        

        return lines.join("\\\\")
        
    }
  

  render() {

    if(Object.keys(this.state.graphdata).length != 0){
        var text = JSON.stringify(this.state.graphdata, null, '\t') 
    }else{
        var text = "Load a file!"
    }
    

    return (

        <>
            {this.state.listItems}
            </>
    
    );}

}


