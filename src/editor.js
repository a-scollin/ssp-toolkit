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

langTools.setCompleters([])
langTools.addCompleter(myCompleter);

function TextEditor(props) {

  return (
<>      <AceEditor
        mode="json"
        theme="github"
        value={props.text}
        name="UNIQUE_ID_OF_DIV"
        editorProps={{ $blockScrolling: true }}
        setOptions={{
            enableLiveAutocompletion: true,
          }}
      />
 </>
  );
};

export default TextEditor;