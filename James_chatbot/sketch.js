// This is an example written by Carrie Wang for the course: Chatbots for Art's Sake.

// It uses ITP/IMA's proxy server to send API calls to Replicate for accessing models, for usage limits and authentication, read the documentation here: https://itp-ima-replicate-proxy.web.app/

// It uses p5.js for the chat interface.
// Language model: gpt-4o-mini
// With session memory added.

// This is the url to itp/ima's proxy server, it contains the API key
// It's publically accessible, with usage limits 
const url = "https://itp-ima-replicate-proxy.web.app/api/create_n_get";
let authToken = ""; // logging in with your NYU credentials lets the proxy track your usage individually and gives you a higher limit, so you can experiment with the models more freely without hitting the shared quota. Leave this blank if you don't want to authenticate. To authenticate, follow instructions here: https://itp-ima-replicate-proxy.web.app/

//instructions on how to make the API call
let options = {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${authToken}`, // optional
  },
};

let systemPrompt; //variable for loading the prompt
let conversationHistory = []; //we'll start a variable where we save all conversation history to, so everytime we make an API call, the session memory persists

let myButton, myInput, myOutput; //interface variables
let myOutputText = "";

function preload() {
  systemPrompt = loadStrings("prompt.txt"); //load the prompt into the variable, loadStrings will make an array of text strings 
}

function setup() {
  //the first message in the conversation history is a System Prompt for the chatbot
  conversationHistory = [
    {
      role: "system",
      content: systemPrompt.join(" ") //change the prompt from an array to a string using join
    },
  ];

  myInput = createInput("Put your message here");
  myInput.position(50, 50);
  myInput.size(600);
  myInput.elt.style.fontSize = "20px";

  myButton = createButton("Submit");
  myButton.position(50, 100);
  myButton.mousePressed(chat); //go to the chat function when the button is pressed
  myButton.elt.style.fontSize = "20px";

  myOutput = createElement("p", "Talk to me."); //create a paragraph element and add some intro text
  myOutput.position(50, 150);
  myOutput.elt.style.fontSize = "20px";
  myOutput.elt.style.lineHeight = "30px";
}

//for easier use, go to the chat function also on ENTER key press
function keyPressed() {
  if (keyCode === ENTER) {
    chat();
  }
}

//a function to limit the user's input to 50 words to help control cost
function limitWords(text) {
  let words = text.trim().split(/\s+/);
  return words.slice(0, 50).join(" ");
}

//where the API call happens and where we save all the chat history so the bot has memory of what has been talked about within the session
function chat() {
  const inputValue = limitWords(myInput.value()); //save the user's input (limited to 50 words) into inputValue
  if (!inputValue || inputValue.length <= 0) {
    return; //if there's no input, return, do not continue
  }

  //add the user's message to the conversation history
  conversationHistory.push({ role: "user", content: inputValue });

  //you can play with the settings below
  options.body = JSON.stringify({
    model: "openai/gpt-4o-mini",  // find the name of the model you want to use on Replicate
    input: {
      messages: conversationHistory,
      temperature: 0.8, //(0 - 2) controls randomness. Lower temperature  = less random replies. 
      max_tokens: 50, //one token ~= 4 English characters. note that you should also instruct the model to answer in less than 50 tokens in the system prompt to avoid the response being cut off
      top_p: 1, //(0-1): controls diversity through sampling. 0.5 means half of the probable vocabulary is considered.
      frequency_penalty: 0, //(0-2): How much to penalize new tokens based on their existing frequency in the text so far. Decreases repetition.
      presence_penalty: 0.8, //(0-2): How much to penalize new tokens based on whether they appear in the text so far. Increases new topics.
      stop: [], //Up to four sequences where the API will stop generating further tokens.
    }
  });

  fetch(url, options) //fetch is JavaScript's built in method for making API calls
    .then((response) => {
      return response.json(); //turn received data into JSON
    })
    .then((response) => {
      console.log(response);

      if (response.output) {
        let generatedResponse = response.output.join("");

        //add the bot's message to the conversation history
        conversationHistory.push({ role: "system", content: generatedResponse });

        //construct the output text
        myOutputText +=
          "<br/>You: " + inputValue + "<br/>Bot: " + generatedResponse;
        myOutput.html(myOutputText); //add it to the html element myOutput
        myInput.value(""); //clear the input field
      }
    });
}