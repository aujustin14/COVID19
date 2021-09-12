CREATE DATABASE COVID19;

CREATE TABLE USERS(
    user_id INT UNIQUE AUTO_INCREMENT,
    first_name VARCHAR(50),
    last_name VARCHAR(50),
    username VARCHAR(50) UNIQUE,
    password VARCHAR(200),
    email VARCHAR(100) UNIQUE,
    dob DATE,
    PRIMARY KEY(user_id)
);

INSERT INTO USERS VALUES (null, "John", "Doe", "JohnDoe12", "asdf1234", "johndoe@example.com", "1990-01-13");
INSERT INTO USERS VALUES (null, "Jane", "Doe", "JaneDoe34", "zxcv5678", "janedoe@example.com", "2000-02-14");

CREATE TABLE VENUES(
    venue_id INT UNIQUE AUTO_INCREMENT,
    name VARCHAR(50),
    street_number VARCHAR(10),
    street_name VARCHAR(100),
    city VARCHAR(100),
    longitude DOUBLE(180, 8),
    latitude DOUBLE(180, 8),
    code VARCHAR(50),
    PRIMARY KEY(venue_id),
    CHECK (longitude >= -180 AND longitude <= 180),
    CHECK (latitude >= -90 AND latitude <= 90)
);

INSERT INTO VENUES VALUES (null, "Starbucks", "14-2", "Green Street", "Ho Chi Minh City", 106.70816126504353, 10.726304887208627, "1qaz");
INSERT INTO VENUES VALUES (null, "KOI The", "18-5", "Brown Street", "Ho Chi Minh City", 106.71041012418094, 10.722521155333268, "2wsx");
INSERT INTO VENUES VALUES (null, "Domino's Pizza", "15-6", "White Street", "Ho Chi Minh City", 106.7089307697438, 10.725290293313712, "3edc");

CREATE TABLE HOTSPOTS(
    hotspot_id INT UNIQUE AUTO_INCREMENT,
    venue_id INT,
    PRIMARY KEY(hotspot_id),
    FOREIGN KEY(venue_id) REFERENCES VENUES(venue_id)
);

INSERT INTO HOTSPOTS VALUES (null, 1);
INSERT INTO HOTSPOTS VALUES (null, 2);

CREATE TABLE CHECK_IN(
    check_in_id INT UNIQUE AUTO_INCREMENT,
    user_id INT,
    venue_id INT,
    check_in_date DATETIME,
    PRIMARY KEY(check_in_id),
    FOREIGN KEY(user_id) REFERENCES USERS(user_id),
    FOREIGN KEY(venue_id) REFERENCES VENUES(venue_id)
);

INSERT INTO CHECK_IN VALUES (null, 1, 1, "2000-01-13");
INSERT INTO CHECK_IN VALUES (null, 1, 2, "2001-02-14");
INSERT INTO CHECK_IN VALUES (null, 2, 1, "2002-03-15");
INSERT INTO CHECK_IN VALUES (null, 2, 2, "2003-04-16");