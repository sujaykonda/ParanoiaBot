// all require are here
const Discord = require('discord.js');
const save = require('./save');
var auth = require('./auth.json');
const client = new Discord.Client();
const ytdl = require('ytdl-core');

// this is all for loading a save and creating the settings dict
var guilds = [];
var settings = {};
var file = {};

// this is all tictactoe
var personToId = {};
var idToBoard = {};
var idToChannel = {};
var idToTurn = {};
var idToTurnNum = {};
var idToNextTurn = {};
var nextid = 0
var pendingRequests = {};
var timeouts = {};
var banAppeals = {};
var start = false;
// this is for voice connections when playing music
var Connections = {};

// this is streamOptions when playing music 
const streamOptions = { seek: 0, volume: 1 };

// finished is event that is called when 'save' is finished loading
save.on('finished', function(){

    // since save only takes in arrays we have to turn back the dict to an array
    var loadedSave = save.load
    for(var i = 0; i < loadedSave.length; i++){
        var loadingGuild = []
        for(var j = 1; j < loadedSave[i].length; j++){
            if(j == 5){
                var people = {}
                for(var k = 0; k < loadedSave[i][j].length; k++){
                    people[loadedSave[i][j][k][0]] = loadedSave[i][j][k][1]
                }
                loadingGuild.push(people)
            }
            else{
                if(loadedSave[i][j] == '-1'){
                    loadingGuild.push(-1)
                }else{
                    loadingGuild.push(loadedSave[i][j])
                }
            }
        }
        file[loadedSave[i][0]] = loadingGuild
    }
    start = true
})
// ready even is called when the bot boots up
client.on('ready', () => {
    while(!start){}
    // sets the presence of the bot
    client.user.setStatus('online');
    client.user.setPresence({
        game: {
            name: '[help]',
            type:'LISTENING'
        }
    });
    // gets all guilds and stores it in an arry
    guilds = client.guilds.array();

    // goes through the guilds and tries to match up the guilds to the save file dict
    for(var i = 0; i < guilds.length; i++){
        people = {}
        for(var j = 0; j < guilds[i].memberCount; j++){
            if(guilds[i].id in file && guilds[i].members.array()[j].id in file[guilds[i].id][4]){
                people[guilds[i].members.array()[j].id] = [parseInt(file[guilds[i].id][4][guilds[i].members.array()[j].id][0]), parseInt(file[guilds[i].id][4][guilds[i].members.array()[j].id][1])]; 
            }else{
                people[guilds[i].members.array()[j].id] = [0, 0];
            }
        }
        if(guilds[i].id in file){
            settings[guilds[i].id] = [file[guilds[i].id][0], file[guilds[i].id][1], file[guilds[i].id][2], file[guilds[i].id][3], people, file[guilds[i].id][5], file[guilds[i].id][6]]
        }
        else{
            settings[guilds[i].id] = [-1,-1,-1,-1, people,-1,-1]
        }
    }
    console.log(`Logged in as ${client.user.tag}!`);
});
function saveSettings(){
    var saveList = []
    var keys = Object.keys(settings)
    for(var key in keys){
        var guildList = [keys[key]]
        for(var i = 0; i < settings[keys[key]].length; i++){
            if(i == 4){
                var people = []
                var allpeople = Object.keys(settings[keys[key]][i])
                for(var person in allpeople){
                    people.push([allpeople[person], settings[keys[key]][i][allpeople[person]]])
                }
                guildList.push(people)
            }else{
                guildList.push(settings[keys[key]][i])
            }
        }
        saveList.push(guildList)
    }
    save.save(saveList)
}
function createEmbed(title, color, text){
    return (new Discord.RichEmbed()
    // Set the title of the field
    .setTitle(title)
    // Set the color of the embed
    .setColor(color)
    // Set the main content of the embed
    .setDescription(text))
}
function sendBoard(member, board, channel){
    string = '<@'+member+'>, Please play your move\n'
    allEmojis = {"x":'❌',"o":'⭕'," ":'⬛'}
    for(var i = 0; i < 3; i++){
        for(var j = 0; j < 3; j++){
            string += allEmojis[board[i][j]]
        }
        string +='\n'
    }  
    channel.send(string);
}
function checkWin(x, y, s, board, moveCount){
    //check col
    for(var i = 0; i < 3; i++){
        if(board[x][i] != s)
            break;
        if(i == 2){
            return(1)
        }
    }

    //check row
    for(var i = 0; i < 3; i++){
        if(board[i][y] != s)
            break;
        if(i == 2){
            return(1)
        }
    }

    //check diag
    if(x == y){
        //we're on a diagonal
        for(var i = 0; i < 3; i++){
            if(board[i][i] != s)
                break;
            if(i == 2){
                return(1)
            }
        }
    }

    //check anti diag (thanks rampion)
    if(x + y == 2){
        for(var i = 0; i < 3; i++){
            if(board[i][(2)-i] != s)
                break;
            if(i == 2){
                return(1)
            }
        }
    }

    //check draw
    if(moveCount == (Math.pow(3, 2) - 1)){
        return(2)
    }
    return(0)
}
String.prototype.shuffle = function () {
    var a = this.split(""),
        n = a.length;

    for(var i = n - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var tmp = a[i];
        a[i] = a[j];
        a[j] = tmp;
    }
    return a.join("");
}
client.on('guildCreate', (guild) =>{
    people = {}
    for(var j = 0; j < guild.memberCount; j++){
        people[guild.members.array()[j].id] = [0, 0]; 
    }
    settings[guild.id] = [-1,-1,-1,-1, people, -1, -1]
});
client.on('guildDelete', (guild) =>{
    delete settings[guild.id]
    saveSettings();
})
client.on('guildMemberAdd', (member) =>{
    settings[member.guild.id][4][member.id] = [0,0]
    saveSettings();
})
client.on('guildMemberRemove', (member) => {
    delete settings[member.guild.id][4][member.id]
    saveSettings();
})
client.on('guildBanAdd', (guild, user)=>{
    if(settings[guild.id][6] > 0){
        var dm = user.dmChannel
        if(!dm){
            user.createDM()
            dm = user.dmChannel
        }
        dm.send("You just got banned from " + guild.name + ' but they are letting you have a ban appeal. \n Please enter your ban appeal below in one message:')
        banAppeals[user.id] = guild.id
    }
})
client.on('message', message => {
    const guild = message.guild;
    if(message.author.id in banAppeals && message.channel.id == message.author.dmChannel.id){
        var banguild = client.guilds.get(banAppeals[message.author.id])
        var dmChannel = banguild.owner.user.dmChannel
        if(!dmChannel){
            banguild.owner.createDM().then(DMchannel => {DMchannel.send(message.content)})
        }else{
            dmChannel.send(message.content)
        }
    }
    if(guild && !message.author.bot){
        if(!(message.member.id in timeouts)){
            settings[guild.id][4][message.member.id][1] += 1
            timeouts[message.member.id] = 1;
            saveSettings();
            setTimeout(() =>{
                delete timeouts[message.member.id];
            }, 30000)
        }
        if(message.content.startsWith('[allow-ban-appeals]') && message.member.hasPermission('ADMINISTRATOR')){
            settings[guild.id][6] = 1
            message.reply(createEmbed('Success', 0x0000FF, 'People now have ban appeals'));
            saveSettings()
        }
        if(message.content.startsWith('[log]') && message.member.hasPermission('ADMINISTRATOR')){
            settings[guild.id][7] = message.channel.id
        }
        if(message.content.startsWith('[deny-ban-appeals]') && message.member.hasPermission('ADMINISTRATOR')){
            settings[guild.id][6] = -1
            message.reply(createEmbed('Success', 0x0000FF, 'People now dont have ban appeals'));
            saveSettings()
        }
        const user = message.mentions.users.first();
        var member = guild.member(user);
        if(message.content.startsWith('[stop]')){
            if(Connections[guild.id] != null){
                Connections[guild.id].disconnect();
                delete Connections[guild.id];
            } 
        }
        if(message.content.startsWith('[play]')){
            if(message.member.voiceChannel != null){
                if(ytdl.validateURL(message.content.slice(7).toString())){
                    message.member.voiceChannel.join()
                    .then(connection => {
                        Connections[guild.id] = connection;  
                        const stream = ytdl(message.content.slice(7).toString(), { filter : 'audioonly' });
                        const dispatcher = connection.playStream(stream,streamOptions);
                    })
                    .catch(console.error);
                }else{
                    message.reply(createEmbed('Error', 0xFF0000, 'Not a valid URL'))
                }
            }else{
                message.reply(createEmbed('Error', 0xFF0000, 'You are not in a voice channel'))
            }
        }
        if(message.content.startsWith('[volume-set]')){
            var num = parseFloat(message.content.slice(13))
            if(isNaN(num)){
                message.reply(createEmbed('Error', 0xFF0000, 'You did not give a valid number'))
            }else{
                streamOptions.volume = parseFloat(message.content.slice(13));
                message.reply(createEmbed('Success', 0x0000FF, 'You set the volume at: ' + num.toString()));
            }
        }
        if(message.content.startsWith('[thank-you]')){
            message.reply('You are welcome (no your really not, why are you thanking a bot).')
        }
        if(message.content.startsWith('[lol]')){
            message.channel.send('',{files: ['https://static.guim.co.uk/sys-images/Guardian/Pix/pictures/2014/5/28/1401294670825/LOL-003.jpg']})
            message.delete();
        }
        if(message.content.startsWith('[trollface]')){
            message.channel.send('',{files: ['https://i.kym-cdn.com/entries/icons/original/000/000/091/TrollFace.jpg']})
            message.delete();
        }
        if(message.content.startsWith('[announce]')){
            message.delete();
            message.channel.sendMessage('@everyone: ');
            message.channel.sendMessage(createEmbed('Announcement', 0x006400, message.content.slice(11)));
        }
        if(message.content.startsWith('[sotp]')){
            message.channel.sendMessage('stop'.shuffle());
            message.delete();
        }
        if(message.content.startsWith('[tictactoe]')){
            if(!user){
                member = guild.members.find('displayName', message.content.slice(12))
            }
            if (member === null){
                message.reply(createEmbed('Error', 0xFF0000, 'Invalid Member'));
            }
            else {
                message.channel.send('<@'+member.id+'>, '+message.member.displayName + ' challenged you to a tictactoe, y/n y for yes and n for no');
                pendingRequests[member.id] = message.member.id;
            }
        }
        if(message.content.toLowerCase() === 'y' && message.member.id in pendingRequests){
            personToId[message.member.id] = nextid.toString()
            personToId[pendingRequests[message.member.id]] = nextid.toString()
            var firstTurn = message.member.id;
            var nextTurn = pendingRequests[message.member.id];
            if(Math.random() > 0.5){
                firstTurn = pendingRequests[message.member.id];
                nextTurn = message.member.id;
            }
            idToBoard[nextid.toString()] = [[' ',' ',' '],[' ',' ',' '],[' ',' ',' ']]
            idToChannel[nextid.toString()] = message.channel.id;
            idToTurn[nextid.toString()] = firstTurn
            idToNextTurn[nextid.toString()] = nextTurn
            idToTurnNum[nextid.toString()] = 0; 
            nextid += 1
            delete pendingRequests[message.member.id]
            var id = personToId[message.member.id]
            sendBoard(idToTurn[id], idToBoard[id], message.channel)
        }
        if(message.content.toLowerCase() === 'n' && message.member.id in pendingRequests){
            delete pendingRequests[message.member.id]
        }
        if(message.member.id in personToId && idToTurn[personToId[message.member.id]] === message.member.id && idToChannel[personToId[message.member.id]] == message.channel.id){
            var msg = message.content
            var id = personToId[message.member.id]
            var currTurn = idToTurn[id];
            var turnToChar = {'0':'x', '1':'o'}
            if(msg.length == 2 && !isNaN(parseInt(msg[0])) && !isNaN(parseInt(msg[1])) && (idToBoard[id][parseInt(msg[1])-1][parseInt(msg[0])-1] === ' ')){
                idToBoard[id][parseInt(msg[1])-1][parseInt(msg[0])-1] = turnToChar[(idToTurnNum[id] % 2).toString()]
                result = checkWin(parseInt(msg[0])-1, parseInt(msg[1])-1, turnToChar[(idToTurnNum[id] % 2).toString()], idToBoard[id], idToTurnNum[id])
                if(result == 0){
                    idToTurn[id] = idToNextTurn[id]
                    idToNextTurn[id] = currTurn;
                    idToTurnNum[id] += 1; 
                    sendBoard(idToTurn[id], idToBoard[id], message.channel)
                }else if(result == 1){
                    message.reply(guild.members.get(currTurn).displayName + ' won the game')
                    delete personToId[message.member.id]
                    delete personToId[idToNextTurn[id]]
                    delete idToBoard[id]
                    delete idToTurn[id]
                    delete idToNextTurn[id]
                    delete idToTurnNum[id]
                    delete idToChannel[id]
                }else{
                    message.reply('Tie')
                    delete personToId[message.member.id]
                    delete personToId[idToNextTurn[id]]
                    delete idToBoard[id]
                    delete idToTurn[id]
                    delete idToNextTurn[id]
                    delete idToTurnNum[id]
                    delete idToChannel[id]
                }
            }else if(msg == 'stop'){
                message.reply('Stoped')
                delete personToId[message.member.id]
                delete personToId[idToNextTurn[id]]
                delete idToBoard[id]
                delete idToTurn[id]
                delete idToNextTurn[id]
                delete idToTurnNum[id]
            }else{
                message.reply('Please us the format like this: 32 to put it in the right middle slot or you place on a square that was already taken');
            }
        }
        if(message.content.startsWith('[typerole-allow]') && message.member.hasPermission('ADMINISTRATOR')){
            var newtyperole = message.mentions.roles.array();
            var typeroleChannel = message.channel;
            if(newtyperole.length === 0){
                message.reply(createEmbed('Error', 0xFF0000, 'Please specify a role'));
            }
            else{
                newtyperole = newtyperole[0]
                settings[guild.id][1] = newtyperole.id;
                settings[guild.id][2] = typeroleChannel.name;
                saveSettings();
                const embed = createEmbed('Success', 0x0000FF, 'You set a type role as ' + newtyperole.name + ' and the location as ' + typeroleChannel.name);
                message.reply(embed);
            }
        }
        if(message.content.startsWith('[typerole-deny]') && message.member.hasPermission('ADMINISTRATOR')){
            settings[guild.id][1] = -1;
            settings[guild.id][2] = -1;
            message.reply(createEmbed('Success', 0x0000FF, 'You turned off typerole'));
            saveSettings();
        }
        if(message.content.startsWith('[warn-channel]') && message.member.hasPermission('ADMINISTRATOR')){
            settings[guild.id][3] = message.channel.id;
            message.reply(createEmbed('Success', 0x0000FF, 'You set the warning channel as ' + message.channel.name))
            saveSettings();
        }
        if(message.content.startsWith('[warn-channel-off]')  && message.member.hasPermission('ADMINISTRATOR')){
            settings[guild.id][3] = -1;
            message.reply(createEmbed('Success', 0x0000FF, 'You turned removed the warn channel'));
            saveSettings();
        }
        if(message.content.startsWith('[demotion-allow]') && message.member.hasPermission('ADMINISTRATOR')){
            var warnNum = parseInt(message.content.slice(17))
            settings[guild.id][0] = warnNum;
            var abuserRole = message.mentions.roles.array();
            if(abuserRole.length === 0){
                const embed = createEmbed('Error', 0xFF0000, 'please specify role for the abuser');
                message.reply(embed);
            }else if (isNaN(warnNum)){
                const embed = createEmbed('Error', 0xFF0000, 'Please give a warning number');
                message.reply(embed);
            }else{
                settings[guild.id][5] = abuserRole[0].id
                const embed = createEmbed('Success', 0x0000FF, 'You set the abuser role as ' + abuserRole[0].name + ' and turned on demotion')
                saveSettings();
                message.reply(embed);
            }
        }
        if(message.content.startsWith('[demotion-deny]') && message.member.hasPermission('ADMINISTRATOR')){
            settings[guild.id][0] = -1;
            saveSettings();
            message.reply(createEmbed('Success', 0x0000FF, 'You turned off demotion'))
        }
        if(message.content.startsWith('[help]')){
            const embed = createEmbed('Help', 0x006400, 'Server Set Up: \n [allow-ban-appeals] \n [deny-ban-appeals] \n [typerole-allow] \n [typerole-deny] \n [warn-channel] \n [demotion-allow] \n [demotion-deny] \n Moderation: \n [warn] \n [kick] \n [ban] \n [unban] \n [mute] \n [unmute] \n [infractions-list] \n [reset-infractions-all] \n [reset-infractions] \n Fun: \n [sotp] \n [play] \n [stop] \n [games] \n Misc: \n [activity]');
            message.reply(embed);
        }
        if(message.content.startsWith('[games]')){
            message.reply(createEmbed('Games', 0x006400, '[tictactoe]'));
        }
        if(message.content.startsWith('[kick]') && message.member.hasPermissions('KICK_MEMBERS')){
                if(!user){
                    member = guild.members.find(val =>  val.displayName.toLowerCase() === message.content.slice(7).toLowerCase());
                }
                if (member === null){
                    message.reply(createEmbed('Error', 0xFF0000, 'Invalid Member'));
                }
                else {
                member.kick('Optional reason that will display in the audit logs').then(() => {
                    // We let the message author know we were able to kick the person
                    message.reply(createEmbed('Success', 0x0000FF, 'Successfully kicked ' + member.displayName));
                    }).catch(err => {
                        // An error happened
                        // This is generally due to the bot not being able to kick the member,
                        // either due to missing permissions or role hierarchy
                        message.reply(createEmbed('Error', 0xFF0000, 'Something Happened'));
                        // Log the error
                        console.error(err);
                    });
                }
        }
        if(message.content.startsWith('[ban]') && message.member.hasPermissions('BAN_MEMBERS')){
                if(!user){
                    member = guild.members.find(val =>  val.displayName.toLowerCase() === message.content.slice(6).toLowerCase());
                    
                }
                if (member === null){
                    message.reply(createEmbed('Error', 0xFF0000, 'Invalid Member'));
                }
                else {
                member.ban('Bad').then(() => {
                    // We let the message author know we were able to kick the person
                    message.reply(createEmbed('Success', 0x0000FF, 'Successfully banned ' + member.displayName));
                    }).catch(err => {
                        // An error happened
                        // This is generally due to the bot not being able to kick the member,
                        // either due to missing permissions or role hierarchy
                        message.reply(createEmbed('Error', 0xFF0000, 'Something Happened'));
                        // Log the error
                        console.error(err);
                    });
                    member.createDM();
                }
        }
        if(message.content.startsWith('[warn]') && message.member.hasPermission('MANAGE_ROLES_OR_PERMISSIONS')){
                if(!user){
                    member = guild.members.find(val =>  val.displayName.toLowerCase() === message.content.slice(7).toLowerCase());
                }
                if (member === null){
                    message.reply(createEmbed('Error', 0xFF0000, 'Invalid Member'));
                }
                else if (message.member.highestRole.comparePositionTo(member.highestRole)>0){
                    if(settings[guild.id][3] != -1){
                        guild.channels.find('id', settings[guild.id][3]).send('@everyone ' + member.displayName + ' is being warned');
                    }
                    settings[guild.id][4][member.id][0] += 1;
                    message.reply(createEmbed('Success', 0x0000FF, 'Successfully warned ' + member.displayName));
                    if(settings[guild.id][0] != -1 && settings[guild.id][4][member.id] >= parseInt(settings[guild.id][0])){
                        member.removeRole(member.highestRole.id);

                        if(member.roles.array()[0].id===guild.defaultRole.id && settings[guild.id][5] != -1){
                            member.addRole(settings[guild.id][5]);
                        }
                        settings[guild.id][4][member.id][0] = 0;
                    }
                    saveSettings();
                }
                else{
                    message.reply('Invalid Member');
                }
        }
        if(message.content.startsWith('[mute]') && message.member.hasPermission('MANAGE_ROLES_OR_PERMISSIONS')){
            if(!user){
                member = guild.members.find(val =>  val.displayName.toLowerCase() === message.content.slice(7).toLowerCase());
            }
            if (member === null){
                message.reply(createEmbed('Error', 0xFF0000, 'Invalid Member'));
            }
            else if (message.member.highestRole.comparePositionTo(member.highestRole)>0){
                if(!guild.roles.some(role => role.name === 'mute')){
                    guild.createRole({name: 'mute', permissions: ['READ_MESSAGES']})
                        .then(role => console.log(`Created new role with name ${role.name}`),console.log('lol'))
                        .catch(console.error);
                    message.reply(createEmbed('Create', 0x008000,'Created The Mute Role, Please Run Command Again To Mute'));
                }
                member.addRole(guild.roles.find('name', 'mute'));
                message.reply(createEmbed('Success', 0x0000FF,'Muted: ' + member.displayName))
            }
            else{
                message.reply(createEmbed('Error', 0xFF0000, 'Invalid Member'));
            }
        }
        if(message.content.startsWith('[unmute]') && message.member.hasPermission('MANAGE_ROLES_OR_PERMISSIONS')){
            if(!user){
                member = guild.members.find(val =>  val.displayName.toLowerCase() === message.content.slice(9).toLowerCase());
            }
            if (member === null){
                message.reply(createEmbed('Error', 0xFF0000, 'Invalid Member'));
            }else if(!member.roles.some(role => role.name === 'mute')){
                message.reply(createEmbed('Error', 0xFF0000, 'You specified a member without the mute role'))
            }else {
                member.removeRole(member.roles.find('name', 'mute'))
                message.reply(createEmbed('Success', 0x0000FF, 'Unmuted ' + member.displayName))
            }
        }
        if(message.content.startsWith('[unban]') && message.member.hasPermission('BAN_MEMBERS')){
            guild.fetchBans().then(bans => {
                var user = bans.find(val =>  val.username.toLowerCase() === message.content.slice(8).toLowerCase());
                if(user == null){
                    message.reply(createEmbed('Error', 0xFF0000, 'Invalid User'))
                }else{
                    guild.unban(user)
                    message.reply(createEmbed('Success', 0x0000FF, 'Unbanned ' + user.username))
                }
            }).catch(console.error);
        }
        if(message.content.startsWith('[reset-infractions-all]') && message.member.hasPermission('ADMINISTRATOR')){
                var people = {}
                for(var j = 0; j < guild.memberCount; j++){
                    people[guild.members.array()[j].id][0] = 0; 
                }
                settings[guild.id][4] = people
                saveSettings()
                message.reply(createEmbed('Success', 0x0000FF, 'Cleared all infractions'));
        }
        if(message.content.startsWith('[reset-infractions]') && message.member.hasPermission('ADMINISTRATOR')){
            if(!user){
                member = guild.members.find(val =>  val.displayName.toLowerCase() === message.content.slice(20).toLowerCase());
            }
            if (member === null){
                message.reply(createEmbed('Error', 0xFF0000, 'Invalid Member'));
            }
            else{
                settings[guild.id][4][member.id][0] = 0;
                saveSettings()
                message.reply(createEmbed('Success', 0x0000FF, 'Reseted warnings for ' + member.displayName));
            }
        }
        if(message.content.startsWith('[infractions-list]')){
            string = '\n'
            for(var i = 0; i < guild.memberCount; i++){
                string += guild.members.array()[i].displayName + ': ' + settings[guild.id][4][guild.members.array()[i].id][0] + "\n"
            }
            message.reply(createEmbed('Infractions', 0x0000FF, string));
        }
        if(!message.member.user.bot && message.channel.name === settings[guild.id][2]){
            var typerole = settings[guild.id][1];
            message.member.addRole(typerole);
            message.reply(createEmbed('Trusted',0x0000FF,'You got '+ guild.roles.get(typerole).name +'!'));
        }
        if(message.content.startsWith('[activity]')){
            string = '\n'
            for(var i = 0; i < guild.memberCount; i++){
                string += guild.members.array()[i].displayName + ': ' + settings[guild.id][4][guild.members.array()[i].id][1] + "\n"
            }
            message.reply(createEmbed('Activity', 0x0000FF, string));
        }
    }
});
client.login(auth.token)