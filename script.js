console.log("JS підключений");

const form = document.getElementById("registrationForm");

const registerDiv = document.querySelector(".register");
const loginDiv = document.querySelector(".login");
const forgotDiv = document.querySelector(".forgot");
const verifyDiv = document.querySelector(".verify");

const switchLogin = document.querySelector(".switch-login");
const switchRegister = document.querySelector(".switch-register");
const forgotBtn = document.querySelector(".forgot-password");

const backLoginBtns = document.querySelectorAll(".back-login");

/* ПЕРЕМИКАННЯ */

function showForm(formName){

registerDiv.classList.remove("active");
loginDiv.classList.remove("active");
forgotDiv.classList.remove("active");
verifyDiv.classList.remove("active");

if(formName==="register") registerDiv.classList.add("active");
if(formName==="login") loginDiv.classList.add("active");
if(formName==="forgot") forgotDiv.classList.add("active");
if(formName==="verify") verifyDiv.classList.add("active");

}

switchLogin.addEventListener("click", e=>{
e.preventDefault();
showForm("login");
});

switchRegister.addEventListener("click", e=>{
e.preventDefault();
showForm("register");
});

forgotBtn.addEventListener("click", e=>{
e.preventDefault();
showForm("forgot");
});

backLoginBtns.forEach(btn=>{
btn.addEventListener("click", e=>{
e.preventDefault();
showForm("login");
});
});


/* VALIDATION */

function showError(input,error,message){

error.textContent = message;
input.classList.add("input-error");

}

function clearError(input,error){

error.textContent="";
input.classList.remove("input-error");

}

function validateEmail(input,error){

clearError(input,error);

const emailRegex=/^[^\s@]+@[^\s@]+\.[^\s@]+$/;

if(input.value.trim()===""){
showError(input,error,"Введіть email");
return false;
}

if(!emailRegex.test(input.value)){
showError(input,error,"Некоректний email");
return false;
}

return true;

}

function validatePassword(input,error){

clearError(input,error);

if(input.value===""){
showError(input,error,"Введіть пароль");
return false;
}

if(input.value.length<6){
showError(input,error,"Мінімум 6 символів");
return false;
}

return true;

}

function validateUsername(input,error){

clearError(input,error);

if(input.value.trim()===""){
showError(input,error,"Введіть ім'я користувача");
return false;
}

if(input.value.length<3){
showError(input,error,"Мінімум 3 символи");
return false;
}

return true;

}


/* INPUTS */

const regEmail=document.getElementById("reg-email");
const regPassword=document.getElementById("reg-password");
const regUsername=document.getElementById("reg-username");

const loginEmail=document.getElementById("login-email");
const loginPassword=document.getElementById("login-password");

const forgotEmail=document.getElementById("forgot-email");


/* ERRORS */

const emailError=document.getElementById("email-error");
const passwordError=document.getElementById("password-error");
const usernameError=document.getElementById("username-error");

const loginEmailError=document.getElementById("login-email-error");
const loginPasswordError=document.getElementById("login-password-error");

const forgotEmailError=document.getElementById("forgot-email-error");


/* LIVE VALIDATION */

regEmail.addEventListener("input",()=>{
validateEmail(regEmail,emailError);
});

regPassword.addEventListener("input",()=>{
validatePassword(regPassword,passwordError);
});

regUsername.addEventListener("input",()=>{
validateUsername(regUsername,usernameError);
});

loginEmail.addEventListener("input",()=>{
validateEmail(loginEmail,loginEmailError);
});

loginPassword.addEventListener("input",()=>{
validatePassword(loginPassword,loginPasswordError);
});

forgotEmail.addEventListener("input",()=>{
validateEmail(forgotEmail,forgotEmailError);
});


/* SUBMIT */

form.addEventListener("submit", async e=>{

e.preventDefault();


/* REGISTER */

if(registerDiv.classList.contains("active")){

let valid=true;

if(!validateUsername(regUsername,usernameError)) valid=false;
if(!validateEmail(regEmail,emailError)) valid=false;
if(!validatePassword(regPassword,passwordError)) valid=false;

if(!valid) return;

alert("Реєстрація успішна");

/* тут можна додати fetch */

}


/* LOGIN */

else if(loginDiv.classList.contains("active")){

let valid=true;

if(!validateEmail(loginEmail,loginEmailError)) valid=false;
if(!validatePassword(loginPassword,loginPasswordError)) valid=false;

if(!valid) return;

alert("Вхід успішний");

}


/* FORGOT */

else if(forgotDiv.classList.contains("active")){

let valid=true;

if(!validateEmail(forgotEmail,forgotEmailError)) valid=false;

if(!valid) return;

showForm("verify");

}


/* VERIFY */

else if(verifyDiv.classList.contains("active")){

alert("Код підтверджено");

}

});


/* CODE AUTO MOVE */

const codeBoxes=document.querySelectorAll(".code-box");

codeBoxes.forEach((box,index)=>{

form.addEventListener("submit", async e=>{

e.preventDefault();


/* REGISTER */

if(registerDiv.classList.contains("active")){

let valid=true;

if(!validateEmail(regEmail,emailError)){
showError(regEmail,emailError,"Введіть email");
valid=false;
}

if(!validatePassword(regPassword,passwordError)){
showError(regPassword,passwordError,"Введіть пароль (мінімум 6 символів)");
valid=false;
}

if(!validateUsername(regUsername,usernameError)){
showError(regUsername,usernameError,"Введіть ім'я користувача");
valid=false;
}

if(!valid) return;

alert("Реєстрація успішна");

}


/* LOGIN */

else if(loginDiv.classList.contains("active")){

let valid=true;

if(!validateEmail(loginEmail,loginEmailError)){
showError(loginEmail,loginEmailError,"Введіть email");
valid=false;
}

if(!validatePassword(loginPassword,loginPasswordError)){
showError(loginPassword,loginPasswordError,"Введіть пароль");
valid=false;
}

if(!valid) return;

alert("Вхід успішний");

}


/* FORGOT PASSWORD */

else if(forgotDiv.classList.contains("active")){

let valid=true;

if(!validateEmail(forgotEmail,forgotEmailError)){
showError(forgotEmail,forgotEmailError,"Введіть email");
valid=false;
}

if(!valid) return;

alert("Код відправлено на вашу електронну пошту");

showForm("verify");

}


/* VERIFY CODE */

else if(verifyDiv.classList.contains("active")){

let code="";

codeBoxes.forEach(box=>{
code+=box.value;
});

if(code.length<4){
alert("Введіть код повністю");
return;
}

alert("Код підтверджено");

}

});
});
