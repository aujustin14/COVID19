// // import bcrypt from 'bcryptjs';

// var vueinst = new Vue({
//     el: "#wrapper",

//     data: {
//         current_user: {
//             username: "",
//             password: ""
//         },
//         new_user: {
//             first_name: "",
//             last_name: "",
//             username: "",
//             password: "",
//             confirm_password: "",
//             email: "",
//             dob_day: "",
//             dob_month: "",
//             dob_year: ""
//         },
//         registration_status: {
//             name: -1, // -1 = initial value, 0 = fine, 1 = empty, 2 = too long
//             username: -1, // -1 = initial value, 0 = fine, 1 = empty, 2 = too short, 3 = too long, 4 = not unique
//             password: -1, // -1 = initial value, 0 = fine, 1 = empty, 2 = not confirmed, 3 = too short
//             email: -1, // -1 = initial value, 0 = fine, 1 = empty, 2 = not valid, 3 = not unique
//             server: -1 // -1 = initial value, 0 = fine, 1 = error
//         }
//     },

//     methods: {
//         login: function() {
//             var xhttp = new XMLHttpRequest();
//             var _this = this;
//             xhttp.onreadystatechange = function() {
//                 if (this.readyState == 4 && this.status == 200) {
//                     // Typical action to be performed when the document is ready:
//                     var data = JSON.parse(this.responseText);
//                     window.location.href=data.redirectPath;

//                 } else if(this.readyState == 4 && this.status >= 400) {
//                     alert("Login failed");
//                 }
//             };

//             //specify the type of request and create a router
//             xhttp.open("POST", "/login", true);
//             xhttp.setRequestHeader("Content-type", "application/json");
//             xhttp.send(JSON.stringify(this.user));
//         },

//         register: function() {
//             var xhttp = new XMLHttpRequest();
//             var _this = this;
//             xhttp.onreadystatechange = function() {
//                 if (this.readyState == 4 && this.status == 200) {
//                     // Typical action to be performed when the document is ready:
//                     var data = JSON.parse(this.responseText);
//                     _this.registration_status = data;
//                     console.log(_this.registration_status);
//                 }
//             };

//             //specify the type of request and create a router
//             xhttp.open("POST", "/users/register_user", true);
//             xhttp.setRequestHeader("Content-type", "application/json");
//             // this.new_user.password = this.encrypt_password(this.new_user.password);
//             // this.new_user.confirm_password = this.encrypt_password(this.new_user.confirm_password);
//             xhttp.send(JSON.stringify(this.new_user));
//         },
//     }
// });