const config  = require("./config.json");
const Discord  = require("discord.js");
const champ  = require("./champ.json");
const fetch = require("node-fetch");
const bot = new Discord.Client();


let prefix = config.prefix;
let token = config.token;
let apiLol = "?api_key="+config.keyLol;

let fetchLol = async (tableau, name) =>{
    let requete = 'https://euw1.api.riotgames.com/lol/summoner/v4/summoners/by-name/' + name + apiLol;
    let fetched = await fetch(requete);
    json = await fetched.json();
    await tableau.push(json);
    //console.log(tableau);
}  
let fetchLolChamp = async (tableau) =>{
    await tableau.push(champ);
    //console.log(tableau[0].data.JarvanIV);
} 
let fetchLolMasterise = async (tableau, encryptedSummonerId,argsNumber=5) =>{
    let requete = 'https://euw1.api.riotgames.com/lol/champion-mastery/v4/champion-masteries/by-summoner/' + encryptedSummonerId + apiLol;
    let fetched = await fetch(requete);
    json = await fetched.json();
    await tableau.push(json);
    await tableau.sort(function compare(a, b) {
        if (a.championPoints < b.championPoints)
           return -1;
        if (a.championPoints > b.championPoints )
           return 1;
        return 0;
      });
    tableau.reverse()
    //console.log(tableau);
    tableau[0].splice(argsNumber);
}  

let fetchLolHistory = async (message,tableau, encryptedUserId,argsNumber=5) =>{
    let requete = 'https://euw1.api.riotgames.com/lol/match/v4/matchlists/by-account/' + encryptedUserId + apiLol;
    let fetched = await fetch(requete);
    json = await fetched.json();
    await tableau.push(json);
    //console.log(tableau)
    try{
    tableau[0].matches.splice(argsNumber);
    }
    catch{
        message.channel.send("User not Found")
        return;
    }
}  
let fetchLolHistoryGame = async (tableau,history) =>{
    await Promise.all(history.map(async (item) => {
        let requete = 'https://euw1.api.riotgames.com/lol/match/v4/matches/' + item.gameId + apiLol;
        let fetched = await fetch(requete);
        json = await fetched.json();
        await tableau.push(json);
    }));
    
    
}  
let renderMain = async (args,message) => {

    const champEnmbed = {
        color: Math.floor(Math.random() * 16777214) + 1,
        title: '',
        thumbnail: {
            url: '',
        },
        description : "",
        fields: [
            {
                name: 'Inline field title',
                value: 'Some value here',
                inline: true,
            },
            {
                name: 'Inline field title',
                value: 'Some value here',
                inline: true,
            },
        ],
    };

    let tableauChamp = [];
    let tableauMain = [];
    let tableauMasterise = [];
    
    await fetchLolChamp(tableauChamp);
    await fetchLol(tableauMain,args[0]);
    await fetchLolMasterise(tableauMasterise,tableauMain[0].id,args[1])

    if(tableauMain[0].status){
        return message.channel.send("Summoner not found");
    }
    message.channel.send(`name : ${tableauMain[0].name}, level ${tableauMain[0].summonerLevel}`);
    
    for (const value of Object.entries(tableauChamp[0])) {
        tableauMasterise[0].map(valeur => {
            if(value[1].key == valeur.championId){
                champEnmbed.color = Math.floor(Math.random() * 16777214) + 1;
                champEnmbed.title = `${value[1].name}`;
                champEnmbed.thumbnail.url = `${value[1].icon}`;
                champEnmbed.fields[0].name = `Mastery ${valeur.championLevel}`;
                champEnmbed.fields[0].value = `${valeur.championPoints} points`;
                champEnmbed.fields[1].name = valeur.tokensEarned ? "Chest granted :  :x:":" Chest granted : :white_check_mark:" ;
                valeur.championLevel == 7 ? champEnmbed.fields[1].value = "Every mastery token earned " : champEnmbed.fields[1].value = `${valeur.tokensEarned} mastery token earned`;
                message.channel.send({embed:  champEnmbed});
            }
        })
    }
    
    
}
let renderHistory = async (args,message) => {

    const champEnmbed = {
        color: Math.floor(Math.random() * 16777214) + 1,
        title: '',
        thumbnail: {
            url: '',
        },
        description : "",
        fields: [
            {
                name: 'Inline field title',
                value: 'Some value here',
                inline: true,
            },
            {
                name: 'Inline field title',
                value: 'Some value here',
                inline: true,
            },
            {
                name: 'Inline field title',
                value: 'Some value here',
                inline: true,
            },
            
        ],
    };

    let tableauChamp = [];
    let tableauMain = [];
    let tableauHistory = [];
    let tableauGame = [];
    let tableauId = [];

    await fetchLolChamp(tableauChamp);
    await fetchLol(tableauMain,args[0]);
    await fetchLolHistory(message,tableauHistory, tableauMain[0].accountId,args[1]);
    tableauHistory = tableauHistory[0].matches.sort(function (a, b) {
        return a.timestamp - b.timestamp;
    });

    tableauHistory.reverse()
    

    await fetchLolHistoryGame(tableauGame,tableauHistory);

    tableauGame.sort(function compare(a, b) {
        if (a.gameCreation < b.gameCreation)
           return -1;
        if (a.gameCreation > b.gameCreation )
           return 1;
        return 0;
      });
    
    tableauGame.reverse()


    if(tableauMain[0].status){
        return message.channel.send("Summoner not found");
    }
    let i = 0;
    let y  = -1;
    try {
    await Promise.all(tableauHistory.map(async (valeur) => {
        y++;
        
            await tableauGame[y].participantIdentities.map(item => {
                if(item.player.summonerName == args[0]){
                    tableauId.push(item.participantId);
                }
        })
        
        
}))
} catch (error) {
    return message.channel.send("Summoner not found");
}
    tableauHistory.map(valeur => {
        for (const value of Object.entries(tableauChamp[0])) {
                if(value[1].key == tableauGame[i].participants[tableauId[i] - 1].championId){
                    champEnmbed.color = tableauGame[i].participants[tableauId[i] - 1].stats.win == true ? 0x42D80E:0xD8300E;
                    champEnmbed.title = `${value[1].name}`;
                    champEnmbed.thumbnail.url = `${value[1].icon}`;
                    champEnmbed.fields[0].name = tableauGame[i].participants[tableauId[i] - 1].stats.win == true ? "Win  :green_circle:":`Defeat :red_circle: `;
                    champEnmbed.fields[0].value = `K/D/A : ${tableauGame[i].participants[tableauId[i] - 1].stats.kills}/${tableauGame[i].participants[tableauId[i] - 1].stats.deaths}/${tableauGame[i].participants[tableauId[i] - 1].stats.assists}`;
                    champEnmbed.fields[1].name = valeur.lane == "NONE" ? "Lane not found":`${valeur.lane}`;
                    champEnmbed.fields[1].value = `Role ${valeur.role.split("_")}`;
                    champEnmbed.fields[2].name = tableauGame[i].participants[tableauId[i] - 1].teamId == 200 ? "\t"+tableauGame[i].teams[1].dragonKills+" :dragon:" :  "\t"+tableauGame[i].teams[0].dragonKills+" :dragon:" ;
                    champEnmbed.fields[2].value = "\t" + tableauGame[i].participants[tableauId[i] - 1].stats.totalDamageDealtToChampions + " :crossed_swords:";
                    if(tableauGame[i].queueId == 420){
                        champEnmbed.description = "Ranked SOLO/DUO";
                    }
                    else if(tableauGame[i].queueId == 440){
                        champEnmbed.description = "Ranked Flex";
                    }
                    else{
                        champEnmbed.description = "Normal Game";
                    }

                    message.channel.send({embed:  champEnmbed});
                }
            }
            i++;
    })
}
let about = async (args,message) => {

    let champEnmbed = {
        color: 0x0099ff,
	title: 'Some title',
	description: 'Some description here',
	thumbnail: {
		url: 'https://i.imgur.com/wSTFkRM.png',
	},
	fields: [
		{
            name: 'Regular field title',
		},
	
		{
			name: 'Inline field title',
			value: 'Some value here',
			inline: true,
		},
		{
			name: 'Inline field title',
			value: 'Some value here',
			inline: true,
		},
		{
			name: 'Inline field title',
			value: 'Some value here',
			inline: true,
		},
	],
};

    let tableauChamp = [];
    
    await fetchLolChamp(tableauChamp);
    
    for (const value of Object.entries(tableauChamp[0])) {
            
        if(value[1].name.toLowerCase() == args[0].toLowerCase()){
                
            champEnmbed = {
                    color: 0x0099ff,
                title: value[1].name,
                description: value[1].description,
                thumbnail: {
                    url: value[1].icon,
                },
                fields: [
                    {
                        name: 'Tags:',
                        value: value[1].tags.map(element => element+' ').join(" "),
                    },
                    {
                        name: 'Attack damage',
                        value: value[1].stats.attackdamage+' :crossed_swords:',
                        inline: true,
                    },
                    {
                        name: 'HP',
                        value: value[1].stats.hp +' :drop_of_blood:',
                        inline: true,
                    },
                    {
                        name: 'Attack speed',
                        value: value[1].stats.attackspeed +' :bow_and_arrow: ',
                        inline: true,
                    },
                ],
               
            };
            message.channel.send({embed:  champEnmbed});

            }

    }
    
    
}
//start 
bot.once('ready', () => {
    console.log("ready");
})

//les messages :
bot.on("message",(message) =>{
    if(!message.content.startsWith(prefix) ||message.author.bot) return;
    
    // retire le prefix et espace chaque argument
    let args = message.content.slice(prefix.length).split(" ");
    // premiere element du tableau donc le prefix 
    let commands = args.shift().toLowerCase();
    console.log('1 user more')
    if (commands === "help"){
        const exampleEmbed = {
            color: 0x0099ff,
            title: "LeagueOfLegendStats",
            description: 'Thanks to this bot you can see the history of the games to share it with your friends or laugh about the huge number of defeats your friends have, but also have the statistics of the summoner champions , information about the champions and finally, a command to delete messages.',
            thumbnail: {
                url: 'https://cdn.iconscout.com/icon/free/png-512/league-3-569469.png',
            },
            fields: [
                {
                    name: 'Information about champions',
                    value: prefix+'about [champion name]',
                    inline: true,
                },
                {
                    name: 'Game history of summoner',
                    value: prefix+'history [summoner name(type "-" for space)] [number of games (default 5)]',
                    inline: true,
                },
                {
                    name: 'Champions statistics of summoner',
                    value: prefix+'stat [summoner name(type "-" for space)] [number of champions (default 5)]',
                    inline: true,
                },
                {
                    name: 'Clear message',
                    value: prefix+'clear [message number]',
                    inline: true,
                },
            ],
        };
        
        message.channel.send({ embed: exampleEmbed });
    }
    if (commands === "stat"){
        if(args.length < 1)
        {
           return message.channel.send("Not valid command , try "+prefix +"help for know about the command");
        }
        try{
            renderMain(args,message)
        }
        catch(error){
            message.channel.send("Error for get information about this account , try another summoner name");
        }
        }
    if(commands == "history"){
        if(args.length < 1)
        {
           return message.channel.send("Not valid command , try "+prefix +"help for know about the command");
        }
        try{
	    args[0].replace("-"," ");
            renderHistory(args,message)
        }

        catch(error){
            message.channel.send("Not valid command , try "+prefix +"help for know about the command");
        }
        }
    if(commands == "clear"){
        if(args.length < 1)
        {
           return message.channel.send("Not valid command , try "+prefix +"help for know about the command");
        }
        try{
            message.channel.bulkDelete(args[0])
        }
        catch(error){
            message.channel.send("Not valid command , try "+prefix +"help for know about the command");
        }
        }
    if(commands == "about"){
        if(args.length < 1)
        {
           return message.channel.send("Not valid command , try "+prefix +"help for know about the command");
        }
        try{
	    args[0].replace("-"," ");
            about(args,message)
        }
        catch(error){
            message.channel.send("Not valid command , try "+prefix +"help for know about the command");
        }
    }
})


bot.login(token);
