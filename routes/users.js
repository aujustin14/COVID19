var express = require('express');
var router = express.Router();
var bcrypt = require('bcrypt');
const saltRounds = 10;

var user_id = 1;

const CLIENT_ID = '1056640990626-67ihmlsp4641f2gb9mjufede75hch3hi.apps.googleusercontent.com';
const {OAuth2Client} = require('google-auth-library');
const client = new OAuth2Client(CLIENT_ID);

router.post('/check_code', function(req, res, next) {
    var received_data = req.body;
    var data_status = {
        code: 0, // 0 = fine, 1 = incorrect
        server: 0 // 0 = fine, 1 = error
    };

    req.pool.getConnection(function(err, connection) {
        if (err) {
            connection.release();
            data_status.server = 1;
            res.send(data_status);
            return;
        }

        var query = "SELECT * FROM VENUES WHERE code = ?";
        connection.query(query, [received_data.content], function(err, rows, fields) {
            if (err) {
                connection.release();
                res.sendStatus(500);
                return;
            }

            if (rows.length > 0) {
                var venue_id = rows[0].venue_id;
                var check_in_date = new Date;
                var query = "INSERT INTO CHECK_IN VALUES (null, ?, ?, ?)";
                connection.query(query, [req.session.user.user_id, venue_id, check_in_date], function(err, rows, fields) {
                    connection.release();
                    if (err) {
                        data_status.server = 1;
                        res.send(data_status);
                        return;
                    }
                });
            } else {
                data_status.code = 1;
            }
            res.send(data_status);
        });
    });
});

router.get('/get_user_history', function(req, res, next) {
    req.pool.getConnection(function(err, connection) {
        if (err) {
            connection.release();
            res.sendStatus(500);
            return;
        }

        var query = "SELECT * FROM CHECK_IN INNER JOIN VENUES ON CHECK_IN.venue_id = VENUES.venue_id WHERE CHECK_IN.user_id = ? ORDER BY check_in_id DESC";
        connection.query(query, [req.session.user.user_id], function(err, rows, fields) {
            connection.release();
            if (err) {
                res.sendStatus(500);
                return;
            }

            res.send(rows);
        });
    });
});

router.get('/find_user_data', function(req, res, next) {
    if (typeof req.session.user != "undefined" && "user_id" in req.session.user) {
        req.pool.getConnection(function(err, connection) {
            if (err) {
                connection.release();
                res.sendStatus(500);
                return;
            }

            var query = "SELECT * FROM USERS WHERE user_id = ?";
            connection.query(query, [req.session.user.user_id], function(err, rows, fields) {
                connection.release();
                if (err) {
                    res.sendStatus(500);
                    return;
                }

                res.send(rows);
            });
        });
    } else {
        res.sendStatus(401);
    }
});

router.post('/save_updated_user_data', function(req, res, next) {
    var received_data = req.body;
    var data_status = {
        name: 0, // 0 = fine, 1 = empty, 2 = too long
        username: 0, // 0 = fine, 1 = empty, 2 = too short, 3 = too long, 4 = not unique
        email: 0, // 0 = fine, 1 = empty, 2 = not valid, 3 = not unique
        dob: 0, // 0 = fine, 1 = empty
        password: 0, // 0 = fine, 1 = not confirmed
        server: 0 // 0 = fine, 1 = error
    };

    // Validate the full name
    if (received_data.first_name.length === 0) {
        data_status.name = 1;
    } else if (received_data.first_name.length > 50 || received_data.first_name.length > 50) {
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

    // Validate the confirm password
    if (received_data.confirm_password.length === 0) {
        data_status.password = 1;
    }

    // Check if there are any errors in the edit form
    if (data_status.name != 0 || data_status.username != 0 || data_status.email != 0 || data_status.dob != 0 || data_status.password != 0) {
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
        var query = "SELECT username FROM USERS WHERE username = ? AND user_id != ?";
        connection.query(query, [received_data.username, req.session.user.user_id], function(err, rows, fields) {
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
            var query = "SELECT email FROM USERS WHERE email = ? AND user_id != ?";
            connection.query(query, [received_data.email, req.session.user.user_id], function(err, rows, fields) {
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

                // Get the current user's account
                var query = "SELECT * FROM USERS WHERE user_id = ?";
                connection.query(query, [req.session.user.user_id], function(err, rows, fields) {
                    if (err) {
                        connection.release();
                        data_status.server = 1;
                        res.send(data_status);
                        return;
                    }

                    // If the account is found
                    if (rows.length > 0) {
                        // Compare the inputted password with the current user's hashed password
                        bcrypt.compare(received_data.confirm_password, rows[0].password, function(err, result) {
                            // If both passwords are similar
                            if (result) {
                                // Format the date of birth
                                var dob = received_data.dob_year.toString() + "-" + received_data.dob_month.toString() + "-" + received_data.dob_day.toString();

                                // Insert the updated user data into the database
                                var query = "UPDATE USERS SET first_name = ?, last_name = ?, username = ?, email = ?, dob = ? WHERE user_id = ?";
                                connection.query(query, [received_data.first_name, received_data.last_name, received_data.username, received_data.email, dob, req.session.user.user_id], function(err, rows, fields) {
                                    connection.release();
                                    if (err) {
                                        data_status.server = 1;
                                        res.send(data_status);
                                        return;
                                    }

                                    res.send(data_status);
                                });
                            // Else, inform the user they didn't confirm their password
                            } else {
                                connection.release();
                                data_status.password = 1;
                                res.send(data_status);
                            }
                        });
                    }
                });
            });
        });
    });
});

router.post('/save_updated_user_password', function(req, res, next) {
    var received_data = req.body;
    var data_status = {
        current_password: 0, // 0 = fine, 1 = empty, 2 = incorrect
        new_password: 0, // 0 = fine, 1 = empty/similar to current, 2 = not confirmed, 3 = too short
        server: 0 // 0 = fine, 1 = error
    };

    // Validate the current password
    if (received_data.current_password.length === 0) {
        data_status.current_password = 1;
    }

    // Validate the new password
    if (received_data.new_password.length === 0 || received_data.new_password === received_data.current_password) {
        data_status.new_password = 1;
    } else if (received_data.new_password.length < 8) {
        data_status.new_password = 2;
    } else if (received_data.new_password !== received_data.confirm_new_password) {
        data_status.new_password = 3;
    }

    // Check if there are any errors in the edit form
    if (data_status.current_password != 0 || data_status.new_password != 0) {
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

        // Get the current user's account
        var query = "SELECT * FROM USERS WHERE user_id = ?";
        connection.query(query, [req.session.user.user_id], function(err, rows, fields) {
            if (err) {
                connection.release();
                data_status.server = 1;
                res.send(data_status);
                return;
            }

            // If the account is found
            if (rows.length > 0) {
                // Compare the inputted password with the current user's hashed password
                bcrypt.compare(received_data.current_password, rows[0].password, function(err, result) {
                    // If both passwords are similar
                    if (result) {
                        // Hash the password
                        bcrypt.hash(received_data.new_password, saltRounds, function(err, hash) {
                            var hashed_password = hash;

                            // Insert the new user data into the database and redirect the user to the log in page
                            var query = "UPDATE USERS SET password = ? WHERE user_id = ?";
                            connection.query(query, [hashed_password, req.session.user.user_id], function(err, rows, fields) {
                                connection.release();
                                if (err) {
                                    data_status.server = 1;
                                    res.send(data_status);
                                    return;
                                }

                                res.send(data_status);
                            });
                        });
                    // Else, inform the user their current password is incorrect
                    } else {
                        connection.release();
                        data_status.current_password = 2;
                        res.send(data_status);
                    }
                });
            }
        });
    });
});

router.post('/log_out', function(req, res, next){
    delete req.session.user;
    res.sendStatus(200);
});

module.exports = router;
