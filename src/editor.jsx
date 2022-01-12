import React from "react";
import ReactDOM from "react-dom";
import AceEditor from "react-ace";

import ace from "ace-builds/src-noconflict/ace";
import "ace-builds/src-noconflict/mode-json";
import "ace-builds/src-noconflict/theme-github";
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


const MyAceComponent = ({ text, onSubmit }) => {
        const commands = [
          {
            name: "submit",
            bindKey: { win: "Ctrl-S", mac: "Command-S" },
            exec: (editor) => {
              console.log(editor)
              onSubmit(JSON.parse(editor.getValue()),false)
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