var fs = require('fs')
var readline = require('readline')
var saveFile = 'saveFile.txt'
var prevlayer = 1
var rl = readline.createInterface({
    input: fs.createReadStream(saveFile)
});
var loadedSave = [];
var events = require('events');
var eventEmitter = new events.EventEmitter();
function saveR(variable, layer, string){
    var type = typeof variable;
    if(Array.isArray(variable)){
        for(var i = 0; i < variable.length; i++){
            string = (saveR(variable[i], layer + 1, string))
            if(Array.isArray(variable[i])){
                string.push('%')
            }
        } 
        return(string)
    }else if(type == 'number'){
        string.push('i'.repeat(layer) + '|' + variable.toString())
        return(string)
    }else if(type == 'string'){
        string.push('i'.repeat(layer) + '|' + variable)
        return(string)
    }
}
function processLine(line){
    var split = line.indexOf('|')
    if(split > -1){
        var val = line.slice(split+1)
        var layer = line.slice(0,split)
        var string = 'loadedSave'
    
        if(prevlayer < split){
            for(var i = (split-prevlayer)+1; i < split; i++){
                string += '['+ eval(string + '.length - 1').toString() +']'
            }
            stringVal = 'val'
            for(var i = 0; i < split - prevlayer; i++){
                stringVal = '['+stringVal+']'
            }
            eval(string+'.push('+stringVal+')');
        }else{
            for(var i = 1; i < split; i++){
                string += '['+ eval(string + '.length - 1').toString() +']'
            }
            eval(string+'.push(val)');
        }
        prevlayer = split
    }else{
        prevlayer = prevlayer-1
    }
}
rl.on('line', processLine);
rl.on('close', function(){
    eventEmitter.emit('finished')
});
exports.save = function(variable){
    listString = saveR(variable, 0, [])
    string = ''
    for(var i = 0; i < listString.length; i++){
        string += listString[i] + '\r\n'
    }
    fs.writeFile(saveFile, string, function(err){
        if (err) throw err;
    });
} 
exports.on = function(string, func){
    eventEmitter.on(string, func)
}
// exports.restartLoad = function(){
//     eventEmitter.emit('restart')
//     rl = readline.createInterface({
//         input: fs.createReadStream(saveFile)
//     });
// }
exports.load = loadedSave