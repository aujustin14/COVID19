var vueinst = new Vue({
    el: "#wrapper",

    data: {
        selected_tab: "Homepage",
        table_headers: ["Number", "Venue", "Address", "Date and Time"],
        table_rows: [],
        service: "Profile",
        inputted_code: {
            content: ""
        },
        logged_in_user: {
            first_name: "",
            last_name: "",
            dob: "",
            email: "",
            username: ""
        },
        current_user: {
            username: "",
            password: ""
        },
        login_status: {
            username: -1, // -1 = initial value, 0 = fine, 1 = empty, 2 = incorrect
            password: -1, // -1 = initial value, 0 = fine, 1 = empty, 2 = incorrect
            server: -1 // -1 = initial value, 0 = fine, 1 = error
        },
        new_user: {
            first_name: "",
            last_name: "",
            username: "",
            password: "",
            confirm_password: "",
            email: "",
            dob_day: "",
            dob_month: "",
            dob_year: ""
        },
        registration_status: {
            name: -1, // -1 = initial value, 0 = fine, 1 = empty, 2 = too long
            username: -1, // -1 = initial value, 0 = fine, 1 = empty, 2 = too short, 3 = too long, 4 = not unique
            password: -1, // -1 = initial value, 0 = fine, 1 = empty, 2 = not confirmed, 3 = too short
            email: -1, // -1 = initial value, 0 = fine, 1 = empty, 2 = not valid, 3 = not unique
            server: -1 // -1 = initial value, 0 = fine, 1 = error
        },
        map_markers: []
    },

    methods: {
        get_history: function() {
            var xhttp = new XMLHttpRequest();
            var _this = this;
            xhttp.onreadystatechange = function() {
                if (this.readyState == 4 && this.status == 200) {
                   // Typical action to be performed when the document is ready:
                    var data = JSON.parse(this.responseText);
                    _this.table_rows = [];

                    for (var i=0; i<data.length; i++) {
                        var single_item = {
                            number: i + 1,
                            name: data[i].name,
                            address: data[i].street_number + " " + data[i].street_name + ", "+data[i].city,
                            date: data[i].check_in_date
                        };

                        _this.table_rows.push(single_item);
                    }
                }
            };

            //specify the type of request and create a router
            xhttp.open("GET", "/users/history", true);
            xhttp.send();
        },

        submit_code: function() {
            var xhttp = new XMLHttpRequest();
            var _this = this;
            xhttp.onreadystatechange = function() {
                if (this.readyState == 4 && this.status == 200) {
                    // Typical action to be performed when the document is ready:
                    var data = this.responseText;
                    document.getElementById('check_in_help').innerHTML = data;
                }
            };

            //specify the type of request and create a router
            xhttp.open("POST", "/users/test_code", true);
            xhttp.setRequestHeader("Content-type", "application/json");
            xhttp.send(JSON.stringify(this.inputted_code));
        },

        get_markers: function() {
            var xhttp = new XMLHttpRequest();
            var _this = this;
            xhttp.onreadystatechange = function() {
                if (this.readyState == 4 && this.status == 200) {
                   // Typical action to be performed when the document is ready:
                    let markers = JSON.parse(this.responseText);
                    vueinst.map_markers = markers;

                    // for (var i=0; i<markers.length; i++)
                    for (let m of markers)
                        m.marker = new mapboxgl.Marker()
                            .setLngLat([m.longitude, m.latitude])
                            .addTo(map);
                    // markers: each item has id, longitude, latitude, marker (will be added to the page)
                    // vueinst.markers=markers;
                }
            };

            //specify the type of request and create a router
            xhttp.open("GET", "/retrieve_markers", true);
            xhttp.send();
        },

        // display the user profile
        user_profile: function() {
            var xhttp = new XMLHttpRequest();
            var _this = this;
            xhttp.onreadystatechange = function() {
                if (this.readyState == 4 && this.status == 200) {
                   // Typical action to be performed when the document is ready:
                    let user_data = JSON.parse(this.responseText);
                    _this.logged_in_user.first_name = user_data[0].first_name;
                    _this.logged_in_user.last_name = user_data[0].last_name;
                    _this.logged_in_user.dob = user_data[0].dob;
                    _this.logged_in_user.email = user_data[0].email;
                    _this.logged_in_user.username = user_data[0].username;
                }
            };

            //specify the type of request and create a router
            xhttp.open("GET", "/users/display_user_profile", true);
            xhttp.send();
        },

        // update the user data
        update_user_data: function() {
            var xhttp = new XMLHttpRequest();
            var _this = this;
            xhttp.onreadystatechange = function() {
                if (this.readyState == 4 && this.status == 200) {
                   // Typical action to be performed when the document is ready:
                    let data = this.responseText;
                    document.getElementById('edit_help').innerHTML = data;
                }
            };

            //specify the type of request and create a router
            xhttp.open("POST", "/users/modify_user_data", true);
            xhttp.setRequestHeader("Content-type", "application/json");
            xhttp.send(JSON.stringify(this.logged_in_user));
        },

        login: function() {
            var xhttp = new XMLHttpRequest();
            var _this = this;
            xhttp.onreadystatechange = function() {
                if (this.readyState == 4 && this.status == 200) {
                    // Typical action to be performed when the document is ready:
                    var data = JSON.parse(this.responseText);
                    _this.login_status = data;
                    window.location.href = data.redirect_path;
                }
            };

            //specify the type of request and create a router
            xhttp.open("POST", "/login_user", true);
            xhttp.setRequestHeader("Content-type", "application/json");
            xhttp.send(JSON.stringify(this.current_user));
        },

        register: function() {
            var xhttp = new XMLHttpRequest();
            var _this = this;
            xhttp.onreadystatechange = function() {
                if (this.readyState == 4 && this.status == 200) {
                    // Typical action to be performed when the document is ready:
                    var data = JSON.parse(this.responseText);
                    _this.registration_status = data;
                    window.location.href = data.redirect_path;
                }
            };

            //specify the type of request and create a router
            xhttp.open("POST", "/register_user", true);
            xhttp.setRequestHeader("Content-type", "application/json");
            xhttp.send(JSON.stringify(this.new_user));
        },
    }
});

mapboxgl.accessToken = 'pk.eyJ1IjoiYXVqdXN0aW4xNCIsImEiOiJja3Q0OWs0cTMwMTA4MnFudnV0NHJldW4xIn0.XedxOHoHgKor-GRMYn4YsQ';
    const map = new mapboxgl.Map({
        container: 'map', // container ID
        style: 'mapbox://styles/mapbox/streets-v11', // style URL
        center: [106.70961683206141, 10.728857016728918], // starting position [lng, lat]
        zoom: 12 // starting zoom
    });

function onSignIn(googleUser) {
    var profile = googleUser.getBasicProfile();
    console.log('ID: ' + profile.getId()); // Do not send to your backend! Use an ID token instead.
    console.log('Name: ' + profile.getName());
    console.log('Image URL: ' + profile.getImageUrl());
    console.log('Email: ' + profile.getEmail()); // This is null if the 'email' scope is not present.
    var id_token = {token: googleUser.getAuthResponse().id_token};
    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
        if (this.readyState == 4 && this.status < 400) {
           // Typical action to be performed when the document is ready:
            var data = JSON.parse(this.responseText);
            window.location.href = data.redirect_path;
        } else if (this.readyState == 4 && this.status >= 400) {
            alert("Login failed");
        }
    };

    //specify the type of request and create a router
    xhttp.open("POST", "/login_user", true);
    xhttp.setRequestHeader("Content-type", "application/json");
    xhttp.send(JSON.stringify(id_token));
}

function signOut() {
    var auth2 = gapi.auth2.getAuthInstance();
    auth2.signOut().then(function () {
        console.log('User signed out.');
        window.location.href = "/index.html";
    });
}

function logout() {
    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
           // Typical action to be performed when the document is ready:
            var data = this.responseText;
            if (data === "true") {
                signOut();
            } else {
                window.location.href = "/index.html";
            }

        }
    };

    //specify the type of request and create a router
    xhttp.open("POST", "/users/logout", true);
    xhttp.send();
}

vueinst.get_markers();