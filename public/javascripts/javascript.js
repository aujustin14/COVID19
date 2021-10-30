var vueinst = new Vue({
    el: "#wrapper",

    data: {
        selected_tab: "Homepage",
        table_headers: ["#", "Venue", "Address", "Date"],
        table_rows: [],
        profile_mode: 0, // 0 = view profile, 1 = edit profile, 2 = change password
        inputted_code: {
            content: ""
        },
        check_in_status: {
            code: -1, // -1 = initial value, 0 = fine, 1 = incorrect
            server: -1, // -1 = initial value, 0 = fine, 1 = error
        },
        logged_in_user: {
            first_name: "",
            last_name: "",
            username: "",
            email: "",
            dob_day: "",
            dob_month: "",
            dob_year: "",
        },
        edited_user: {
            first_name: "",
            last_name: "",
            username: "",
            email: "",
            dob_day: "",
            dob_month: "",
            dob_year: "",
            confirm_password: "",
        },
        edit_status: {
            name: -1, // -1 = initial value, 0 = fine, 1 = empty, 2 = too long
            username: -1, // -1 = initial value, 0 = fine, 1 = empty, 2 = too short, 3 = too long, 4 = not unique
            email: -1, // -1 = initial value, 0 = fine, 1 = empty, 2 = not valid, 3 = not unique
            dob: -1, // -1 = initial value, 0 = fine, 1 = empty
            password: -1, // -1 = initial value, 0 = fine, 1 = not confirmed
            server: -1, // -1 = initial value, 0 = fine, 1 = error
        },
        changed_password: {
            current_password: "",
            new_password: "",
            confirm_new_password: "",
        },
        change_status: {
            current_password: -1, // -1 = initial value, 0 = fine, 1 = empty, 2 = incorrect
            new_password: -1, // -1 = initial value, 0 = fine, 1 = empty, 2 = not confirmed, 3 = too short
            server: -1, // -1 = initial value, 0 = fine, 1 = error
        },
        current_user: {
            username: "",
            password: "",
        },
        log_in_status: {
            username: -1, // -1 = initial value, 0 = fine, 1 = empty, 2 = incorrect
            password: -1, // -1 = initial value, 0 = fine, 1 = empty, 2 = incorrect
            server: -1, // -1 = initial value, 0 = fine, 1 = error
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
            dob_year: "",
        },
        sign_up_status: {
            name: -1, // -1 = initial value, 0 = fine, 1 = empty, 2 = too long
            username: -1, // -1 = initial value, 0 = fine, 1 = empty, 2 = too short, 3 = too long, 4 = not unique
            password: -1, // -1 = initial value, 0 = fine, 1 = empty, 2 = not confirmed, 3 = too short
            email: -1, // -1 = initial value, 0 = fine, 1 = empty, 2 = not valid, 3 = not unique
            dob: -1, // -1 = initial value, 0 = fine, 1 = empty
            server: -1, // -1 = initial value, 0 = fine, 1 = error
        },
        map_markers: []
    },

    methods: {
        get_markers: function() {
            var xhttp = new XMLHttpRequest();
            var _this = this;
            xhttp.onreadystatechange = function() {
                if (this.readyState == 4 && this.status == 200) {
                    let markers = JSON.parse(this.responseText);
                    _this.map_markers = markers;

                    for (let m of markers)
                        m.marker = new mapboxgl.Marker()
                            .setLngLat([m.longitude, m.latitude])
                            .addTo(map);
                }
            };

            xhttp.open("GET", "/retrieve_markers", true);
            xhttp.send();
        },

        log_in: function() {
            var xhttp = new XMLHttpRequest();
            var _this = this;
            xhttp.onreadystatechange = function() {
                if (this.readyState == 4 && this.status == 200) {
                    var data = JSON.parse(this.responseText);
                    _this.log_in_status = data;
                    window.location.href = data.redirect_path;
                }
            };

            xhttp.open("POST", "/log_in_user", true);
            xhttp.setRequestHeader("Content-type", "application/json");
            xhttp.send(JSON.stringify(this.current_user));
        },

        sign_up: function() {
            var xhttp = new XMLHttpRequest();
            var _this = this;
            xhttp.onreadystatechange = function() {
                if (this.readyState == 4 && this.status == 200) {
                    var data = JSON.parse(this.responseText);
                    _this.sign_up_status = data;
                    window.location.href = data.redirect_path;
                }
            };

            xhttp.open("POST", "/sign_up_user", true);
            xhttp.setRequestHeader("Content-type", "application/json");
            xhttp.send(JSON.stringify(this.new_user));
        },

        sign_up_google: function() {
            var xhttp = new XMLHttpRequest();
            var _this = this;
            xhttp.onreadystatechange = function() {
                if (this.readyState == 4 && this.status == 200) {
                    var data = JSON.parse(this.responseText);
                    _this.sign_up_status = data;
                    window.location.href = data.redirect_path;
                }
            };

            xhttp.open("POST", "/sign_up_google_user", true);
            xhttp.setRequestHeader("Content-type", "application/json");
            xhttp.send(JSON.stringify(this.new_user));
        },

        submit_code: function() {
            var xhttp = new XMLHttpRequest();
            var _this = this;
            xhttp.onreadystatechange = function() {
                if (this.readyState == 4 && this.status == 200) {
                    var data = JSON.parse(this.responseText);
                    _this.check_in_status = data;
                }
            };

            xhttp.open("POST", "/users/check_code", true);
            xhttp.setRequestHeader("Content-type", "application/json");
            xhttp.send(JSON.stringify(this.inputted_code));
        },

        clear_inputted_code: function() {
            this.inputted_code.content = "";
        },

        reset_check_in_status: function() {
            this.check_in_status.code = -1;
            this.check_in_status.server = -1;
        },

        get_history: function() {
            var xhttp = new XMLHttpRequest();
            var _this = this;
            xhttp.onreadystatechange = function() {
                if (this.readyState == 4 && this.status == 200) {
                    var data = JSON.parse(this.responseText);
                    _this.table_rows = [];

                    for (var i = 0; i < data.length; i++) {
                        var single_item = {
                            number: i + 1,
                            name: data[i].name,
                            address: data[i].street_number + " " + data[i].street_name + ", "+ data[i].city,
                            date: data[i].check_in_date.substr(8, 2) + "/" + data[i].check_in_date.substr(5, 2) + "/" + data[i].check_in_date.substr(0, 4)
                        };

                        _this.table_rows.push(single_item);
                    }
                }
            };

            //specify the type of request and create a router
            xhttp.open("GET", "/users/get_user_history", true);
            xhttp.send();
        },

        get_user_data: function() {
            var xhttp = new XMLHttpRequest();
            var _this = this;
            xhttp.onreadystatechange = function() {
                if (this.readyState == 4 && this.status == 200) {
                    if (window.location.pathname.indexOf("users.html") === -1) {
                        window.location.href = "/users.html";
                    } else {
                        let received_data = JSON.parse(this.responseText);
                        _this.logged_in_user.first_name = _this.edited_user.first_name = received_data[0].first_name;
                        _this.logged_in_user.last_name = _this.edited_user.last_name = received_data[0].last_name;
                        _this.logged_in_user.username = _this.edited_user.username = received_data[0].username;
                        _this.logged_in_user.email = _this.edited_user.email = received_data[0].email;
                        _this.logged_in_user.dob_day = _this.edited_user.dob_day = received_data[0].dob.substr(8, 2);
                        _this.logged_in_user.dob_month = _this.edited_user.dob_month = received_data[0].dob.substr(5, 2);
                        _this.logged_in_user.dob_year = _this.edited_user.dob_year = received_data[0].dob.substr(0, 4);
                    }
                } else if (this.readyState == 4 && this.status >= 400) {
                    if (window.location.pathname !== "/" && window.location.pathname.indexOf("index.html") === -1) {
                        window.location.href = "/index.html";
                    }
                }
            };

            xhttp.open("GET", "/users/find_user_data", true);
            xhttp.send();
        },

        update_user_data: function() {
            var xhttp = new XMLHttpRequest();
            var _this = this;
            xhttp.onreadystatechange = function() {
                if (this.readyState == 4 && this.status == 200) {
                    var data = JSON.parse(this.responseText);
                    _this.edit_status = data;
                    if (data.name === 0 && data.username === 0 && data.email === 0 && data.dob === 0 && data.password === 0 && data.server === 0) {
                        _this.logged_in_user.first_name = _this.edited_user.first_name;
                        _this.logged_in_user.last_name = _this.edited_user.last_name;
                        _this.logged_in_user.username = _this.edited_user.username;
                        _this.logged_in_user.email = _this.edited_user.email;
                        _this.logged_in_user.dob_day = _this.edited_user.dob_day;
                        _this.logged_in_user.dob_month = _this.edited_user.dob_month;
                        _this.logged_in_user.dob_year = _this.edited_user.dob_year;
                        _this.edited_user.confirm_password = "";
                        _this.profile_mode = 0;
                    }
                }
            };

            xhttp.open("POST", "/users/save_updated_user_data", true);
            xhttp.setRequestHeader("Content-type", "application/json");
            xhttp.send(JSON.stringify(this.edited_user));
        },

        reset_edited_user: function() {
            this.edited_user.first_name = this.logged_in_user.first_name;
            this.edited_user.last_name = this.logged_in_user.last_name;
            this.edited_user.username = this.logged_in_user.username;
            this.edited_user.email = this.logged_in_user.email;
            this.edited_user.dob_day = this.logged_in_user.dob_day;
            this.edited_user.dob_month = this.logged_in_user.dob_month;
            this.edited_user.dob_year = this.logged_in_user.dob_year;
            this.edited_user.confirm_password = "";
        },

        reset_edit_status: function() {
            this.edit_status.name = -1;
            this.edit_status.username = -1;
            this.edit_status.email = -1;
            this.edit_status.dob = -1;
            this.edit_status.password = -1;
            this.edit_status.server = -1;
        },

        update_user_password: function() {
            var xhttp = new XMLHttpRequest();
            var _this = this;
            xhttp.onreadystatechange = function() {
                if (this.readyState == 4 && this.status == 200) {
                    var data = JSON.parse(this.responseText);
                    _this.change_status = data;
                    if (data.current_password === 0 && data.new_password === 0 && data.server === 0) {
                        _this.changed_password.current_password = "";
                        _this.changed_password.new_password = "";
                        _this.changed_password.confirm_new_password = "";
                        _this.profile_mode = 0;
                    }
                }
            };

            xhttp.open("POST", "/users/save_updated_user_password", true);
            xhttp.setRequestHeader("Content-type", "application/json");
            xhttp.send(JSON.stringify(this.changed_password));
        },

        reset_changed_password: function() {
            this.changed_password.current_password = "";
            this.changed_password.new_password = "";
            this.changed_password.confirm_new_password = "";
        },

        reset_change_status: function() {
            this.change_status.current_password = -1;
            this.change_status.new_password = -1;
            this.change_status.server = -1;
        },

        log_out: function() {
            var xhttp = new XMLHttpRequest();
            xhttp.onreadystatechange = function() {
                if (this.readyState == 4 && this.status == 200) {
                    window.location.href = "/index.html";
                }
            };

            xhttp.open("POST", "/users/log_out", true);
            xhttp.send();
        },
    }
});

mapboxgl.accessToken = 'pk.eyJ1IjoiYXVqdXN0aW4xNCIsImEiOiJja3Q0OWs0cTMwMTA4MnFudnV0NHJldW4xIn0.XedxOHoHgKor-GRMYn4YsQ';
const map = new mapboxgl.Map({
    container: 'map', // container ID
    style: 'mapbox://styles/mapbox/streets-v11', // style URL
    center: [106.70961683206141, 10.728857016728918], // starting position [lng, lat]
    zoom: 13 // starting zoom
});

if (window.location.pathname === "/" || window.location.pathname.indexOf("index.html") >= 0 || window.location.pathname.indexOf("users.html") >= 0) {
    vueinst.get_markers();
}
vueinst.get_user_data();
if (window.location.pathname.indexOf("users.html") >= 0) {
    vueinst.get_history();
}