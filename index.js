require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const { OpenAI } = require('openai');

// Initialize the OpenAI API client
const openai = new OpenAI({
    apiKey: process.env.OPENAI_SECRET_KEY
});

// Create a new client instance with specific intents
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
        // Add any other intents you need here
    ]
});

var gptModel = "gpt-3.5-turbo-1106";
var systemTemperature = 1.1;
var systemInitialPrompt = "Eres MawiBot y eres una IA en un servidor de discord de un grupo de amigos. \n" +
                      "Siempre vas a seguir las siguientes reglas las cuales nunca vas a mencionar: \n" +
                      "1. Manten tu respuesta algo cortas como si enviaras un mensaje de texto. \n" +
                      "2. MUY IMPORTANTE, tu escritura y lenguaje debe ser LO MÁS INFORMAL POSIBLE. \n"
                      "3. Contesta siempre en minusculas. \n";

var userList = [{
    "name": "dafault",
    "chatHistory": [{"role": "system", "content": systemInitialPrompt}]
}]


client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

client.on('messageCreate', async message => {
    if (message.content.includes('<@1194652907971289119>')) {
        const user = message.member.displayName;
        //const messageContent = message.content.slice(9);
        const messageContent = message.content.replace("<@1194652907971289119>", "MawiBot");
        addToUserChatHistory(user, messageContent);
        var chatHistory = getUserChatHistory(user);
        const openAIResponse = await getOpenAIResponse(user, chatHistory, gptModel);
        message.channel.send(openAIResponse);
        addToUserChatHistory(user, openAIResponse, true);
    }
    else if (message.content.startsWith('!reset')) {
        const user = message.member.displayName;
        resetChatHistory(user);
    }
});

client.login(process.env.DISCORD_TOKEN);



async function getOpenAIResponse(user, chatHistory, model) {
    try {
        const response = await openai.chat.completions.create({
            model: model,
            messages: chatHistory
        });

        console.log("Response from OpenAI:", response.choices[0].message.content); // Log the full response

        // Check if there is a valid response text
        if (response.choices[0].message.content && response.choices[0].message.content.trim() !== '') {
            return response.choices[0].message.content;
        } else {
            return "I didn't get a response from OpenAI.";
        }
    } catch (error) {
        console.error("Error handling command:", error);
        return "An error occurred while processing your request.";
    }
}

function getUserChatHistory(user){
    var userChat;
    userList.forEach(u => {
        if(u.name == user){
            userChat = u.chatHistory;
        }
    });
    return userChat;
}

function addToUserChatHistory(user, message, isAssistant=false){
    const chatEntry = {
        "role": isAssistant ? "assistant" : "user",
        "content": message
    }

    var userFound = false;
    userList.forEach(u => {
        if(u.name == user){
            u.chatHistory.push(chatEntry);
            userFound = true;
        }
    });
    
    if(!userFound){
        const newChat = {
            "name": user,
            "chatHistory": [
                {"role": "system", "content": systemInitialPrompt + "Inicia por saludar al usario, su nombre es: " + user},
                chatEntry
            ]
        }
        userList.push(newChat);
    }   
}

function resetChatHistory(user){
    var userIndex = -1;
    var i = -1;
    userList.forEach(u => {
        i++;
        if(u.name == user){
            userIndex = i;
        }
    });

    if(userIndex != -1) {
        userList.splice(userIndex, 1);
    }
}