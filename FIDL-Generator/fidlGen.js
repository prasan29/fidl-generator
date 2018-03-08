'use strict'

var colors = require('colors/safe');

var exceltojson;
var xlsxtojson = require("xlsx-to-json-lc");
var xlstojson = require("xls-to-json-lc");

var xlsFileName;
var destFileName;
var enumStructSheetName;

var resultString = '';

intro();
letsStart();

function intro() {
    var header = colors.yellow('MAL FIDL Generator');
    var introText = `
    ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    |                                                                           |
    |\t\t\t\t${header}\t\t\t\t|
    |                                                                           |
    ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    `
    console.log(introText);
}

function validate(fileName, sheetName, fidlFileName, enumStructName) {
    if (fileName !== undefined) {
        if ((fileName.split('.')[fileName.split('.').length - 1] === 'xlsx') ||
            (fileName.split('.')[fileName.split('.').length - 1] === 'xls')) {
            if (sheetName !== undefined) {
                xlsFileName = fileName;
                destFileName = fidlFileName;
                enumStructSheetName = enumStructName;
                init(fileName, sheetName, fidlFileName);
            } else {
                console.log(colors.red('Provided sheet name is wrong!'));
                waitKey();
                return;
            }
        } else {
            console.log(colors.red('Provided wrong format of XLS(xls or xlsx)'));
            waitKey();
            return;
        }
    }
    /* else {
           console.log(colors.red('Provided wrong file name!'));
           waitKey();
           return;
       } */
}

function init(fileName, sheetName, fidlFileName) {
    if (fileName.split('.')[fileName.split('.').length - 1] === 'xlsx') {
        exceltojson = xlsxtojson;
    } else {
        exceltojson = xlstojson;
    }
    extractJson(fileName, sheetName, fidlFileName);
}

function extractJson(fileName, sheetName, fidlFileName) {
    try {
        exceltojson({
            input: "./XLS_FILES/" + fileName,
            output: null,
            sheet: sheetName,
            lowerCaseHeaders: true
        }, function (err, result) {
            if (err) {
                console.error(err);
                waitKey();
            } else {
                // console.log(result);
                parseMethod(result);
                //   console.log(resultString);
                if (resultString !== '') {
                    require('./writeFIDL').writeFIDL(resultString, fidlFileName);
                } else {
                    console.log(colors.inverse.red('Error occurred while generating FIDL!'));
                    waitKey();
                }
            }
        });
    } catch (e) {
        console.log(colors.inverse.red('No such file found in ' + e.path));
        waitKey();
    }
}

function parseMethod(result) {
    // console.log(result)
    if (result !== null) {
        resultString += `
/* Author : TCS
 * Description : 
 * Change History :
 * Version	 			Changes Done
 * Initial	 			Draft version
 */
package org.aivievo    // Please include your module name in the package

// Please include import statement as per your module

interface cls_${destFileName} {
    version {
        major 1
        minor 0
    }`
        result.forEach(function (element) {
            {
                if (element["key"] !== undefined) {
                    if (element["key"] !== '') {
                        fidlGenerator(element["key"]);
                    }
                } else {
                    console.log(colors.inverse.red('Sheet not found or \"key\" keyword not found in the Sheet!'));
                    process.exit();
                }
            }
        })
        resultString += `
}`
    }
}

function fidlGenerator(apiSignature) {
    // console.log(apiSignature);
    if (!apiSignature.startsWith('attribute')) {
        let openMethodName = /^void/.exec(apiSignature);
        let open = /(\()/.exec(apiSignature);
        let close = /(\))/.exec(apiSignature);
        if (openMethodName) {
            openMethodName = /^void/.exec(apiSignature).index;
            resultString += `

    <**
    @description:
    **>
    method ${apiSignature.slice(openMethodName + 5, open.index)} {`
            if (open) {
                open = /(\()/.exec(apiSignature).index;
                close = /(\))/.exec(apiSignature).index;

                var inParams = ''
                var outParams = ''

                var paramArray = format(apiSignature.slice(open + 1, close))

                paramArray.forEach(function (element) {
                    // console.log(element)
                    if (element.startsWith(' out') || element.startsWith('out')) {
                        outParams += `
            ${element.replace('out ','')}`
                    } else {
                        inParams += `
            ${element}`
                    }
                })

                if (inParams !== '') {
                    resultString += `
        in {${inParams}
        }`;
                }

                if (outParams !== '') {
                    resultString += `
        out {${outParams}
        }`
                }
            }
            resultString += `
    }`
        }
    } else if (apiSignature.startsWith('attribute')) {
        resultString += `
    ${apiSignature}`
    } else if (apiSignature.startsWith('broadcast')) {
        //Broadcast
    } else {
        console.log('Omitted: ' + apiSignature)
    }
}

function format(params) {
    var paramsArray = params.split(',')
    paramsArray.forEach(function (element) {
        if (element.startsWith(' '))
            element.trim()
        // console.log(element.replace(' out ', ''))
    })
    return paramsArray
}

function letsStart() {
    // validate('AIVIEvo_MAL_API_SMARTPHONE_V1.0.0.xls', 'Smartphone_API', 'Smartphone')
    var prompt = require('prompt');
    var schema = {
        properties: {
            fileName: {
                description: colors.bold.cyan('Enter XLS file name(.xls/.xlsx format)'),
                required: true
            },
            sheetName: {
                description: colors.bold.cyan('Enter API sheet name'),
                required: true
            },
            enumStructSheetName: {
                description: colors.bold.cyan('Enter the Enum and Structs sheet name'),
                required: true
            },
            fidlDestName: {
                description: colors.bold.cyan('Enter a destination file'),
                type: 'string',
                required: true
            }
        }
    }

    prompt.message = '';
    prompt.delimiter = colors.cyan(':-');
    prompt.start();

    prompt.get(schema, function (err, result) {
        validate(result.fileName, result.sheetName, result.fidlDestName, result.enumStructSheetName);
    });
}

function waitKey() {
    require('./fidlGen').waitKey();
}

function extractTypesJSON() {
    require('./typesGen').extractTypesJson(xlsFileName, enumStructSheetName, destFileName);
}

module.exports = {
    waitKey: function () {
        const readline = require('readline');

        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        rl.question(colors.inverse.white('Press \"Enter\" key to exit... '), (answer) => {
            rl.close();
        });
    },
    startTypesProcess: function () {
        extractTypesJSON();
    }
}