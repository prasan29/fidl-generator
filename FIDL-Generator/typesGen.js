module.exports = {
    extractTypesJson: function (xlsFileName, sheetName, destFileName) {
        // console.log(xlsFileName + '\n' + sheetName + '\n' + destFileName);
        checkFile(xlsFileName, sheetName, destFileName + 'Types')
    }
}

var globalDestFileName;
var colors = require('colors/safe');

var exceltojson;
var xlsxtojson = require("xlsx-to-json-lc");
var xlstojson = require("xls-to-json-lc");

var resultString = '';

function checkFile(xlsFileName, sheetName, destFileName) {
    if (xlsFileName.split('.')[xlsFileName.split('.').length - 1] === 'xlsx') {
        exceltojson = xlsxtojson;
    } else {
        exceltojson = xlstojson;
    }
    extractJSON(xlsFileName, sheetName, destFileName);
}

function extractJSON(xlsFileName, sheetName, destFileName) {
    exceltojson({
        input: "./XLS_FILES/" + xlsFileName,
        output: null,
        sheet: sheetName,
        lowerCaseHeaders: true
    }, function (err, result) {
        if (err) {
            console.err(err)
            waitKey()
        } else {
            // console.log(result)
            globalDestFileName = destFileName
            parseMethod(result)

            if (resultString !== '' && resultString.length > 10) {
                // console.log(resultString);
                require('./writeFIDL').writeTypesFIDL(resultString, destFileName)
            } else {
                console.log('Error occurred while generating the ' + destFileName + '.fidl');
            }
        }
    })
}

function parseMethod(result) {
    if (result !== null) {
        resultString += `
/* Author : TCS
* Description : 
* Change History :
* Version	 			Changes Done
* Initial	 			Draft version
*/
package org.aivievo    // Include your module name in the package

typeCollection ${globalDestFileName} {
    version {
        major 1
        minor 0
    }`
        result.forEach(function (element) {
            {
                // console.log(element["key"]);
                if (element["key"] !== undefined) {
                    if (element["key"] !== '') {
                        fidlGenerator(element["key"]);
                    }
                } else {
                    console.log(colors.inverse.red('\"Data Structures\" sheet not found or \"key\" not found in the Sheet!'));
                    // waitKey();
                    // resultString = ''
                    process.exit();
                    // return;
                }
            }
        })
        resultString += `
}`
    }
}

function fidlGenerator(typesString) {
    if (typesString.startsWith('enum')) {

        let openEnum = /^enum/.exec(typesString)
        let openBrace = /(\{)/.exec(typesString)
        let closeBrace = /(\})/.exec(typesString)

        resultString += `

    <**
    @description:
    **>
    enumeration ${typesString.slice(openEnum.index + 5, openBrace.index)} {`
        let enumValues = typesString.slice(openBrace.index + 1, closeBrace.index)
        let enumValuesArray = enumValues.split(',')
        enumValuesArray.forEach(function (element) {
            // console.log(element.trim())
            resultString += `
        ${element.trim()}`
        })
        resultString += `
    }`

    } else if (typesString.startsWith('struct')) {
        let structName = typesString.slice(/(\})/.exec(typesString).index + 1, /(\;)/.exec(typesString).index)
        let structValue = typesString.slice(/(\{)/.exec(typesString).index + 1, /(\})/.exec(typesString).index)
        resultString += `

    <**
    @description:
    **>
    struct ${structName} {
        ${format(structValue)}
    }`
    } else {
        if ('Enums and Structs' !== typesString)
            console.log('Omitted: ' + typesString);
    }
    // console.log(typesString)
}

function format(structValue) {
    let str = `
        `
    let stArray = structValue.split('\n')
    stArray.forEach(function (element, index) {
        // console.log(index)
        if (element !== '') {
            if (index !== 0) {
                str += `
        ${element}`
            } else {
                str += `${element}`
            }
        }
        // console.log('->: ' + str)
    })
    return str.trim();
}

function waitKey() {
    require('./fidlGen').waitKey();
}