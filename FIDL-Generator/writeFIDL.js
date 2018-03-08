var fs = require('fs')

module.exports = {
    writeFIDL: function (fidlString, FIDLfileName) {
        fs.writeFile("./Gen/" + FIDLfileName + '.fidl', fidlString, function (err) {
            if (err) {
                return console.log(err)
            }
            console.log(colors.yellow(FIDLfileName + '.fidl has been generated in \"Gen\" folder.'));
            require('./fidlGen').startTypesProcess();
        })
    },
    writeTypesFIDL: function (fidlTypesString, FIDLtypesFileName) {
        var fs = require('fs')
        fs.writeFile("./Gen/" + FIDLtypesFileName + '.fidl', fidlTypesString, function (err) {
            if (err) {
                return console.log(err)
            }
            console.log(colors.yellow(FIDLtypesFileName + '.fidl has been generated in \"Gen\" folder.'));
            waitKey();
        })
    }
}

var colors = require('colors/safe');

var dir = './Gen';

if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
}

function waitKey() {
    require('./fidlGen').waitKey();
}