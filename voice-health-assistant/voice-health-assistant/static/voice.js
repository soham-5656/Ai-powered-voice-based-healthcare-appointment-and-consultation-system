function speak(text){

const speech = new SpeechSynthesisUtterance(text);
speechSynthesis.speak(speech);

}

function startVoice(){

const recognition = new webkitSpeechRecognition();

recognition.lang="en-US";
recognition.start();

recognition.onresult=function(event){

let transcript = event.results[0][0].transcript;

document.getElementById("text").innerText = transcript;

sendMessage(transcript);

}

}

function sendMessage(message){

fetch("/analyze",{

method:"POST",

headers:{
"Content-Type":"application/json"
},

body:JSON.stringify({
user_id:"patient1",
message:message
})

})

.then(res=>res.json())

.then(data=>{

document.getElementById("result").innerText=data.response;

speak(data.response);

handleEmergency(data);

})

}

function handleEmergency(data){

if(data.force_ambulance){

showAmbulance();

return;

}

if(data.risk_level==="HIGH"){

document.getElementById("popup").style.display="block";

if(data.emotion==="PANIC"){

showAmbulance();

}else{

document.getElementById("assistBtn").style.display="block";

}

}

}

function showAmbulance(){

document.getElementById("popup").style.display="block";
document.getElementById("ambulanceBtn").style.display="block";

}

function callAmbulance(){

fetch("/call_ambulance",{
method:"POST"
})
.then(res=>res.json())
.then(data=>{

alert("🚑 Ambulance call triggered. You will receive the call.");

})

}

function callAssist(){

alert("Emergency assistance contacted.");

}

function shareLocation(){

navigator.geolocation.getCurrentPosition(function(position){

let lat = position.coords.latitude;
let lon = position.coords.longitude;

let link = "https://maps.google.com/?q="+lat+","+lon;

document.getElementById("location").innerHTML =
"Latitude: "+lat+
"<br>Longitude: "+lon+
"<br><a target='_blank' href='"+link+"'>View on Map</a>";

});

}