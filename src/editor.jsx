import React from "react";
import ReactDOM from "react-dom";
import AceEditor from "react-ace";

import ace from "ace-builds/src-noconflict/ace";
import "ace-builds/src-noconflict/mode-json";
import "ace-builds/src-noconflict/theme-github";
import 'brace/ext/searchbox';
import langTools from "ace-builds/src-noconflict/ext-language_tools"


var myCompleter ={
    getCompletions: function(editor, session, pos, prefix, callback) {
            var completions = [];
            ["\"expand\" : { ... }", "\"decompose\" : { ... }", "\"compose\" : { ... }"].forEach(function(w) {
    
                completions.push({
                    caption: w.split(":")[0],
                    value: w,
                    meta: "Transformation",
    
                });
            });
            callback(null, completions);
        }
    }


function MyAceComponent(props){

      var getLineNumber = props.getLineNumber
      var text = props.text
      var onSubmit = props.onSubmit

      console.log(props)

        var commands = [
          {
            name: "submit",
            bindKey: { win: "Ctrl-S", mac: "Command-S" },
            exec: (editor) => {
              console.log("bengbengbon")
              try {
              onSubmit(JSON.parse(editor.getValue()),false)
              } catch {
                alert("JSON is incorrectly formatted!")
              }
            } 
          },
          {
            name: "jump_to_selected",
            bindKey: { win: "Ctrl-J", mac: "Command-J" },
            exec: (editor) => {

              editor.resize(true);

              editor.gotoLine(getLineNumber(),0);
              
            }
          }
        ];
      
        return (
          <AceEditor
            mode="json"
            width="100%"
            height="100%"
            theme="textmate"
            editorProps={{ $blockScrolling: true }}
            value={text}
            commands={commands}
            setOptions={{
              enableLiveAutocompletion: true,
            }}
            highlightActiveLine={false}
            focus={true}
            minLines={1}
            maxLines={Infinity}
          />
        );
      };

      langTools.setCompleters([])
      langTools.addCompleter(myCompleter);


export default MyAceComponent;