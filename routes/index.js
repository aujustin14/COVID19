var express = require('express');
var router = express.Router();
var bcrypt = require('bcrypt');
const saltRounds = 10;

const client_id = '1056640990626-67ihmlsp4641f2gb9mjufede75hch3hi.apps.googleusercontent.com';
const {OAuth2Client} = require('google-auth-library');
const client = new OAuth2Client(client_id);

router.get('/retrieve_markers', function(req, res, next) {
    req.pool.getConnection(function(err, connection) {
        if (err) {
            connection.release();
            res.sendStatus(500);
            return;
        }

        var query = "SELECT VENUES.longitude, VENUES.latitude FROM VENUES INNER JOIN HOTSPOTS ON VENUES.venue_id = HOTSPOTS.venue_id;";
        connection.query(query, function(err, rows, fields) {
            connection.release();
            if (err) {
                res.sendStatus(500);
                return;
            }

            console.log(rows);
            res.send(rows);
        });
    });
});

router.post('/log_in_user', function(req, res, next) {
    var received_data = req.body;
    console.log(received_data);
    var data_status = {
        username: 0, // 0 = fine, 1 = empty, 2 = incorrect
        password: 0, // 0 = fine, 1 = empty, 2 = incorrect
        server: 0, // 0 = fine, 1 = error
        redirect_path: "#"
    };

    // If the user logged in normally
    if ('username' in received_data) {
        // If the user has typed in their username and password
        if (received_data.username.length > 0 && received_data.password.length > 0) {
            // Start a connection to the database
            req.pool.getConnection(function(err, connection) {
                if (err) {
                    connection.release();
                    data_status.server = 1;
                    res.send(data_status);
                    return;
                }

                // Look for accounts with the inputted username
                var query = "SELECT * FROM USERS WHERE username = ?";
                connection.query(query, [received_data.username], function(err, rows, fields) {
                    connection.release();
                    if (err) {
                        data_status.server = 1;
                        res.send(data_status);
                        return;
                    }

                    // If an account is found
                    if (rows.length > 0) {
                        // Compare the inputted password with the signed up user's hashed password
                        bcrypt.compare(received_data.password, rows[0].password, function(err, result) {
                            // If both passwords are similar, log them in and redirect them to the users page
                            if (result) {
                                data_status.redirect_path = "/users.html";
                                var user_data = {
                                    user_id: rows[0].user_id,
                                    username: rows[0].username,
                                    using_google: false
                                }
                                req.session.user = user_data;
                                res.send(data_status);
                            // Else, inform the user their username or password is incorrect
                            } else {
                                data_status.password = 2;
                                res.send(data_status);
                            }
                        });
                    // Else, inform the user their username or password is incorrect
                    } else {
                        data_status.username = 2;
                        res.send(data_status);
                    }
                });
            });
        // Else, inform the user to input their username/password
        } else {
            if (received_data.username.length === 0) {
                data_status.username = 1;
            }
            if (received_data.password.length === 0) {
                data_status.password = 1;
            }
            res.send(data_status);
        }
    // Else, if the user logged in with Google
    } else if ('credential' in received_data) {
        async function verify() {
            const ticket = await client.verifyIdToken({
                idToken: received_data.credential,
                audience: client_id,
            });
            const payload = ticket.getPayload();

            // Start a connection to the database
            req.pool.getConnection(function(err, connection) {
                if (err) {
                    connection.release();
                    data_status.server = 1;
                    res.send(data_status);
                    return;
                }

                // Look for accounts with the user's Google email
                var query = "SELECT * FROM USERS WHERE email = ?";
                connection.query(query, [payload['email']], function(err, rows, fields) {
                    connection.release();
                    if (err) {
                        data_status.server = 1;
                        res.send(data_status);
                        return;
                    }

                    // If an account is found, log the user in
                    if (rows.length > 0) {
                        var user_data = {
                            user_id: rows[0].user_id,
                            username: rows[0].username,
                            email: payload['email'],
                            using_google: true
                        };
                        req.session.user = user_data;
                        res.redirect("/users.html");
                    // Else, redirect the user to the sign up with Google page
                    } else {
                        var user_data = {
                            first_name: payload['given_name'],
                            last_name: payload['family_name'],
                            email: payload['email'],
                            using_google: true
                        };
                        req.session.user = user_data;
                        res.redirect("sign_up_google.html");
                    }
                });
            });
        }
        verify().catch(console.error);
    } else {
        res.sendStatus(401);
    }
});

router.post('/sign_up_user', function(req, res, next) {
    var received_data = req.body;
    var data_status = {
        name: 0, // 0 = fine, 1 = empty, 2 = too long
        username: 0, // 0 = fine, 1 = empty, 2 = too short, 3 = too long, 4 = not unique
        password: 0, // 0 = fine, 1 = empty, 2 = not confirmed, 3 = too short
        email: 0, // 0 = fine, 1 = empty, 2 = not valid, 3 = not unique
        dob: 0, // 0 = fine, 1 = empty
        server: 0, // 0 = fine, 1 = error
        redirect_path: "#"
    };

    // If the user signed up normally
    if ('username' in received_data) {
        // Validate the full name
        if (received_data.first_name.length === 0 || received_data.last_name.length === 0) {
            data_status.name = 1;
        } else if (received_data.first_name.length > 50 || received_data.last_name.length > 50) {
            data_status.name = 2;
        }

        // Validate the username
        if (received_data.username.length === 0) {
            data_status.username = 1;
        } else if (received_data.username.length < 6) {
            data_status.username = 2;
        } else if (received_data.username.length > 50) {
            data_status.username = 3;
        }

        // Validate the password
        if (received_data.password.length === 0) {
            data_status.password = 1;
        } else if (received_data.password.length < 8) {
            data_status.password = 2;
        } else if (received_data.password !== received_data.confirm_password) {
            data_status.password = 3;
        }

        // Validate the email
        if (received_data.email.length === 0) {
            data_status.email = 1;
        } else if (!(received_data.email.includes("@")) || !(received_data.email.includes("."))) {
            data_status.email = 2;
        }

        // Validate the date of birth
        if (received_data.dob_day.length === 0) {
            data_status.dob = 1;
        }
        if (received_data.dob_month.length === 0) {
            data_status.dob = 1;
        }
        if (received_data.dob_year.length === 0) {
            data_status.dob = 1;
        }

        // Check if there are any errors in the sign up form
        if (data_status.name != 0 || data_status.username != 0 || data_status.password != 0 || data_status.email != 0 || data_status.dob != 0) {
            res.send(data_status);
            return;
        }

        // Start a connection to the database
        req.pool.getConnection(function(err, connection) {
            if (err) {
                connection.release();
                data_status.server = 1;
                res.send(data_status);
                return;
            }

            // Check for duplicate usernames
            var query = "SELECT username FROM USERS WHERE username = ?";
            connection.query(query, [received_data.username], function(err, rows, fields) {
                if (err) {
                    connection.release();
                    data_status.server = 1;
                    res.send(data_status);
                    return;
                }

                // If there are duplicate usernames, inform the user
                if (rows.length > 0) {
                    data_status.username = 4;
                }

                // Check for duplicate emails
                var query = "SELECT email FROM USERS WHERE email = ?";
                connection.query(query, [received_data.email], function(err, rows, fields) {
                    if (err) {
                        connection.release();
                        data_status.server = 1;
                        res.send(data_status);
                        return;
                    }

                    // If there are duplicate emails, inform the user
                    if (rows.length > 0) {
                        data_status.email = 3;
                    }

                    // Format the date of birth
                    var dob = received_data.dob_year.toString() + "-" + received_data.dob_month.toString() + "-" + received_data.dob_day.toString();

                    // Hash the password
                    bcrypt.hash(received_data.password, saltRounds, function(err, hash) {
                        var hashed_password = hash;

                        // Insert the new user data into the database and redirect the user to the log in page
                        var query = "INSERT INTO USERS VALUES (null, ?, ?, ?, ?, ?, ?)";
                        connection.query(query, [received_data.first_name, received_data.last_name, received_data.username, hashed_password, received_data.email, dob], function(err, rows, fields) {
                            connection.release();
                            if (err) {
                                data_status.server = 1;
                                res.send(data_status);
                                return;
                            }

                            data_status.redirect_path = "/log_in.html";
                            res.send(data_status);
                        });
                    });
                });
            });
        });
    // Else, if the user signed up with Google
    } else if ('credential' in received_data) {
        async function verify() {
            const ticket = await client.verifyIdToken({
                idToken: received_data.credential,
                audience: client_id,
            });
            const payload = ticket.getPayload();

            // Start a connection to the database
            req.pool.getConnection(function(err, connection) {
                if (err) {
                    connection.release();
                    data_status.server = 1;
                    res.send(data_status);
                    return;
                }

                // Check for pre-existing users with the user's Google email
                var query = "SELECT * FROM USERS WHERE email = ?";
                connection.query(query, [payload['email']], function(err, rows, fields) {
                    connection.release();
                    if (err) {
                        data_status.server = 1;
                        res.send(data_status);
                        return;
                    }

                    // If the user has already signed up before with their Google email, log them in instead
                    if (rows.length > 0) {
                        var user_data = {
                            user_id: rows[0].user_id,
                            username: rows[0].username,
                            email: payload['email'],
                            redirect_path: "/users.html",
                            using_google: true
                        };
                        req.session.user = user_data;
                        res.redirect("/users.html");
                    // Else, redirect them to the sign up with Google page
                    } else {
                        var user_data = {
                            first_name: payload['given_name'],
                            last_name: payload['family_name'],
                            email: payload['email'],
                            using_google: true
                        };
                        req.session.user = user_data;
                        res.redirect("sign_up_google.html");
                    }
                });
            });
        }
        verify().catch(console.error);
    } else {
        res.sendStatus(401);
    }
});

router.post('/sign_up_google_user', function(req, res, next) {
    var received_data = req.body;
    var data_status = {
        username: 0, // 0 = fine, 1 = empty, 2 = too short, 3 = too long, 4 = not unique
        password: 0, // 0 = fine, 1 = empty, 2 = not confirmed, 3 = too short
        dob: 0, // 0 = fine, 1 = empty
        server: 0, // 0 = fine, 1 = error
        redirect_path: "#"
    };

    // Validate the username
    if (received_data.username.length === 0) {
        data_status.username = 1;
    } else if (received_data.username.length < 6) {
        data_status.username = 2;
    } else if (received_data.username.length > 50) {
        data_status.username = 3;
    }

    // Validate the password
    if (received_data.password.length === 0) {
        data_status.password = 1;
    } else if (received_data.password !== received_data.confirm_password) {
        data_status.password = 2;
    } else if (received_data.password.length < 8) {
        data_status.password = 3;
    }

    // Validate the date of birth
    if (received_data.dob_day.length === 0) {
        data_status.dob = 1;
    }
    if (received_data.dob_month.length === 0) {
        data_status.dob = 1;
    }
    if (received_data.dob_year.length === 0) {
        data_status.dob = 1;
    }

    // Check if there are any errors in the sign up form
    if (data_status.username != 0 || data_status.password != 0 || data_status.dob != 0) {
        res.send(data_status);
        return;
    }

    // Start a connection to the database
    req.pool.getConnection(function(err, connection) {
        if (err) {
            connection.release();
            data_status.server = 1;
            res.send(data_status);
            return;
        }

        // Check for duplicate usernames
        var query = "SELECT username FROM USERS WHERE username = ?";
        connection.query(query, [received_data.username], function(err, rows, fields) {
            if (err) {
                connection.release();
                data_status.server = 1;
                res.send(data_status);
                return;
            }

            // If there are duplicate usernames, inform the user
            if (rows.length > 0) {
                data_status.username = 4;
            }

            // Format the date of birth
            var dob = received_data.dob_year.toString() + "-" + received_data.dob_month.toString() + "-" + received_data.dob_day.toString();

            // Hash the password
            bcrypt.hash(received_data.password, saltRounds, function(err, hash) {
                var hashed_password = hash;

                // Insert the new user data into the database and redirect the user to the log in page
                var query = "INSERT INTO USERS VALUES (null, ?, ?, ?, ?, ?, ?)";
                connection.query(query, [req.session.user.first_name, req.session.user.last_name, received_data.username, hashed_password, req.session.user.email, dob], function(err, rows, fields) {
                    connection.release();
                    if (err) {
                        data_status.server = 1;
                        res.send(data_status);
                        return;
                    }

                    data_status.redirect_path = "/log_in.html";
                    res.send(data_status);
                });
            });
        });
    });
});

module.exports = router;
