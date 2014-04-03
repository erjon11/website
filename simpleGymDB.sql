USE simpleGym;
DROP TABLE IF EXISTS tblOrder;
DROP TABLE IF EXISTS tblCustomer;
DROP TABLE IF EXISTS tblProduct;
DROP TABLE IF EXISTS tblBlog;

CREATE TABLE tblCustomer (
    fistName VARCHAR(20),
    lastName VARCHAR(20),
    houseNumber VARCHAR(20),
    streetName VARCHAR(20),
    city VARCHAR(255),
    postCode VARCHAR(42),
    email VARCHAR(255),
    password VARCHAR(42),
    PRIMARY KEY (email)
);

CREATE TABLE tblProduct (
    productName VARCHAR(20),
    description VARCHAR (250),
    price VARCHAR (10),
    image VARCHAR(30),
    PRIMARY KEY (productName)
);

INSERT INTO tblProduct VALUES
    ("Membership 30 days", "what it sounds like" , "30" , "images/mebership1.png"),
    ("Membership 90 days", "what it sounds like" , "80" , "images/membership2.png"),
    ("Membership 1 year", "what it sounds like" , "1000" , "images/membership3.png"),
    ("Membership 5 years","what it sounds like" , "4000" , "images/membership4.png"),
    ("Membership4Life","what it sounds like" , "100000" , "images/membership5.png");

CREATE TABLE tblOrder (
    orderId smallint AUTO_INCREMENT,
    productName VARCHAR(20),
    email VARCHAR(255),
    quantity SMALLINT,
    PRIMARY KEY (orderId),
    FOREIGN KEY (productName) REFERENCES tblProduct(productName),
    FOREIGN KEY (email) REFERENCES tblCustomer(email)
);

CREATE TABLE tblBlog (
    email VARCHAR(255),
    _date VARCHAR(20),
    _time VARCHAR(20),
    subject VARCHAR(50),
    message VARCHAR(1000),
    PRIMARY KEY (email)
);

CREATE TABLE tblFeedback (
    id smallint AUTO_INCREMENT,
    name VARCHAR(25),
    _date VARCHAR(10),
    _time VARCHAR(20),
    message VARCHAR(1000),
    rating VARCHAR(5),
    PRIMARY KEY (id)
);
    