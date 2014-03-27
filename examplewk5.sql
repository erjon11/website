USE examplewk5;

DROP TABLE IF EXISTS tblCustomer;
DROP TABLE IF EXISTS tblProduct;

CREATE TABLE tblCustomer (
    fname VARCHAR(20),
    lname VARCHAR(20),
    email VARCHAR(255),
    password VARCHAR(42),
    houseno VARCHAR(20),
    sname VARCHAR(20),
    city VARCHAR(255),
    pcode VARCHAR(42),
    PRIMARY KEY (email)
);

CREATE TABLE tblProduct (
    pname VARCHAR(20),
    descrip VARCHAR (250),
    price VARCHAR (10),
    image VARCHAR(30),
    PRIMARY KEY (pname)
);

INSERT INTO tblProduct VALUES
    ("Membership 30 days", "images/mebership1.png"),
    ("Membership 90 days", "images/membership2.png"),
    ("Membership 1 year", "images/membership3.png"),
    ("Membership 5 years", "images/membership4.png"),
    ("Membership4Life", "images/membership5.png");

CREATE TABLE tblOrder (
    orderid SMALLINT AUTO_INCREMENT;
    pname VARCHAR(20),
    email VARCHAR(255),
    qty SMALLINT,
    PRIMARY KEY (orderid)
    FOREIGN KEY (pname) REFERNCES tblProduct(pname),
    FOREIGN KEY (email) REFERNCES tblCustomer(email)
);
