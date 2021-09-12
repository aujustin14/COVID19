var express = require('express');
var router = express.Router();
var bcrypt = require('bcrypt');
const saltRounds = 10;

var user_id = 1;

const CLIENT_ID = '1056640990626-67ihmlsp4641f2gb9mjufede75hch3hi.apps.googleusercontent.com';
const {OAuth2Client} = require('google-auth-library');
const client = new OAuth2Client(CLIENT_ID);

router.post('/test_code', function(req, res, next) {
    var received_data = req.body;

    req.pool.getConnection(function(err, connection) { //start connection
        if (err) {
            res.sendStatus(500);
            return;
        }

        var query = "SELECT * FROM VENUES WHERE code = ?";
        connection.query(query, [received_data.content], function(err, rows, fields) {
            // connection.release(); // release connection
            if (err) {
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
                        res.sendStatus(500);
                        return;
                    }
                });
                res.send("Check in successful.");
            } else {
                res.send("Code is incorrect.");
            }
        });
    });
});

router.get('/history', function(req, res, next) {
    req.pool.getConnection(function(err, connection) { //start connection
        if (err) {
            res.sendStatus(500);
            return;
        }

        var query = "SELECT * FROM CHECK_IN INNER JOIN VENUES ON CHECK_IN.venue_id = VENUES.venue_id WHERE CHECK_IN.user_id = ?";
        connection.query(query, [req.session.user.user_id], function(err, rows, fields) {
            connection.release(); // release connection
            if (err) {
                res.sendStatus(500);
                return;
            }

            console.log(rows);
            res.send(rows); //send response
        });
    });
});

router.get('/display_user_profile', function(req, res, next) {
    req.pool.getConnection(function(err, connection) { //start connection
        if (err) {
            res.sendStatus(500);
            return;
        }

        var query = "SELECT * FROM USERS WHERE user_id = ?";
        connection.query(query, [req.session.user.user_id], function(err, rows, fields) {
            connection.release(); // release connection
            if (err) {
                res.sendStatus(500);
                return;
            }

            console.log(rows);
            res.send(rows); //send response
        });
    });
});

router.post('/modify_user_data', function(req, res, next) {
    var received_data = req.body;

    req.pool.getConnection(function(err, connection) { //start connection
        if (err) {
            res.sendStatus(500);
            return;
        }

        var query = "UPDATE USERS SET first_name = ?, last_name = ?, username = ?, email = ?, dob = ? WHERE user_id = ?";
        connection.query(query, [received_data.first_name, received_data.last_name, received_data.username, received_data.email, received_data.dob, req.session.user.user_id], function(err, rows, fields) {
            connection.release(); // release connection
            if (err) {
                res.sendStatus(500);
                return;
            }

            res.send("Edit successful."); //send response
        });
    });
});

router.post('/logout', function(req,res,next){
    var google = req.session.user.using_google;
    console.log(google);
    delete req.session.user;
    res.send(google);
});

// router.post('/login_user', function(req, res, next) {
//     var received_data = req.body;
//     var all_users = [];
//     // console.log(received_data);

//     // Check if the password was confirmed
//     if (received_data.password !== received_data.confirm_password) {
//         res.sendStatus(500);
//         console.log(0);
//         return;
//     }

//     // Get data for all users
//     req.pool.getConnection(function(err, connection) {
//         if (err) {
//             res.sendStatus(500);
//             console.log(1);
//             return;
//         }

//         var query = "SELECT * FROM USERS";
//         connection.query(query, function(err, rows, fields) {
//             connection.release();
//             if (err) {
//                 res.sendStatus(500);
//                 console.log(2);
//                 return;
//             }

//             all_users = rows;
//         });
//     });

//     // Check if the username and email are unique
//     for (var i = 0; i < all_users.length; i++) {
//         if (received_data.username === all_users[i].username || received_data.email === all_users[i].email) {
//             res.sendStatus(500);
//             console.log(3);
//             return;
//         }
//     }

//     // Format the date of birth
//     var dob = received_data.dob_year.toString() + "-" + received_data.dob_month.toString() + "-" + received_data.dob_day.toString();

//     // Hash the password and insert the new user data into the database
//     bcrypt.hash(received_data.password, saltRounds, function(err, hash) {
//         var hashed_password = hash;
//         req.pool.getConnection(function(err, connection) {
//             if (err) {
//                 res.sendStatus(500);
//                 console.log(4);
//                 return;
//             }

//             var query = "INSERT INTO USERS VALUES (null, ?, ?, ?, ?, ?, ?)";
//             connection.query(query, [received_data.first_name, received_data.last_name, received_data.username, hashed_password, received_data.email, dob], function(err, rows, fields) {
//                 connection.release();
//                 if (err) {
//                     res.sendStatus(500);
//                     console.log(5);
//                     return;
//                 }

//                 res.sendStatus(200);
//             });
//         });
//     });
// });

router.post('/register_user', function(req, res, next) {
    var received_data = req.body;
    var all_usernames = [];
    var all_emails = [];
    var data_status = {
        name: 0, // 0 = fine, 1 = empty, 2 = too long
        username: 0, // 0 = fine, 1 = empty, 2 = too short, 3 = too long, 4 = not unique
        password: 0, // 0 = fine, 1 = empty, 2 = not confirmed, 3 = too short
        email: 0, // 0 = fine, 1 = empty, 2 = not valid, 3 = not unique
        server: 0 // 0 = fine, 1 = error
    };

    // Get all usernames
    req.pool.getConnection(function(err, connection) {
        if (err) {
            data_status.server = 1;
            console.log(1);
            res.send(data_status);
            return;
        }

        var query = "SELECT username FROM USERS";
        connection.query(query, function(err, rows, fields) {
            connection.release();
            if (err) {
                data_status.server = 1;
                console.log(2);
                res.send(data_status);
                return;
            }

            console.log(rows);
            all_usernames = rows;
        });
    });

    // Get all emails
    req.pool.getConnection(function(err, connection) {
        if (err) {
            data_status.server = 1;
            console.log(1);
            res.send(data_status);
            return;
        }

        var query = "SELECT email FROM USERS";
        connection.query(query, function(err, rows, fields) {
            connection.release();
            if (err) {
                data_status.server = 1;
                console.log(3);
                res.send(data_status);
                return;
            }

            all_emails = rows;
        });
    });

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
    } else if (received_data.username in all_usernames) {
        data_status.username = 4;
    }
    // console.log(all_usernames);
    // console.log(all_usernames.includes(received_data.username));

    // Validate the password
    if (received_data.password.length === 0) {
        data_status.password = 1;
    } else if (received_data.password !== received_data.confirm_password) {
        data_status.password = 2;
    } else if (received_data.password.length < 8) {
        data_status.password = 3;
    }

    // Validate the email
    if (received_data.email.length === 0) {
        data_status.email = 1;
    } else if (!(received_data.email.includes("@")) || !(received_data.email.includes("."))) {
        data_status.email = 2;
    } else if (received_data.email in all_emails) {
        data_status.email = 3;
    }

    // Check if there are any errors in the registration form
    if (data_status.name != 0 || data_status.username != 0 || data_status.password != 0 || data_status.email != 0) {
        res.send(data_status);
        return;
    }

    // Format the date of birth
    var dob = received_data.dob_year.toString() + "-" + received_data.dob_month.toString() + "-" + received_data.dob_day.toString();

    // Hash the password and insert the new user data into the database
    bcrypt.hash(received_data.password, saltRounds, function(err, hash) {
        var hashed_password = hash;
        req.pool.getConnection(function(err, connection) {
            if (err) {
                data_status.server = 1;
                console.log(4);
                res.send(data_status);
                return;
            }

            var query = "INSERT INTO USERS VALUES (null, ?, ?, ?, ?, ?, ?)";
            connection.query(query, [received_data.first_name, received_data.last_name, received_data.username, hashed_password, received_data.email, dob], function(err, rows, fields) {
                connection.release();
                if (err) {
                    data_status.server = 1;
                    console.log(5);
                    res.send(data_status);
                    return;
                }

                res.send(data_status);
            });
        });
    });
});

module.exports = router;
