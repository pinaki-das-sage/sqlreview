/**
 * @author Pinaki Das <pinaki.das@sage.com>
 * @copyright 2022 Intacct Corporation All, Rights Reserved
 */

'use strict'

$(document).ready(function() {
    validationManager.showLoading();
    $('body').on("click", '[name=bValidate]', function() {
        let $sqlText = codeMirrorEditor.getCode();
        validationManager.validate($sqlText);
    });

    $('body').on("click", '[name=bPaste]', function() {
        navigator.clipboard.readText().then(text => {
            codeMirrorEditor.setCode(text);
        }).catch(err => {
        });
    });

    var codeMirrorEditor = CodeMirror.fromTextArea('validationInput', {
        parserfile: "parseplsql.js",
        stylesheet: "external/codemirror/css/plsqlcolors.css",
        path: "external/codemirror/js/",
        textWrapping: true,
    });

    validationManager.hideLoading();
});