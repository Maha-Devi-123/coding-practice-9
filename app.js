const express = require("express");
const sqlite3 = require("sqlite3");
const { open } = require("sqlite");
const path = require("path");
const bcrypt = require("bcrypt");
const app = express();
app.use(express.json());

//database and server installation
const databasePath = path.join(__dirname, "userData.db");
let db;
const dbAndServerInstallation = async () => {
  try {
    db = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server is Running...!");
    });
  } catch (error) {
    console.log(error.message);
    process.exit(1);
  }
};
dbAndServerInstallation();

//API1
app.post("/register", async (request, response) => {
  const { username, name, password, gender, location } = request.body;
  const userNameInDB = `SELECT * FROM user WHERE username="${username}";`;
  const dbUser = await db.get(userNameInDB);

  if (dbUser === undefined) {
    if (password.length < 5) {
      response.status(400);
      response.send("Password is too short");
    } else {
      const hashedPassword = await bcrypt.hash(password, 10);
      const AddUserQuery = `INSERT INTO user(username,name,password, gender,location)
                VALUES ("${username}","${name}","${hashedPassword}", "${gender}","${location}");`;
      await db.run(AddUserQuery);
      response.send("User created successfully");
    }
  } else {
    response.status(400);
    response.send("User already exists");
  }
});

//API2
app.post("/login", async (request, response) => {
  const { username, password } = request.body;
  const userNameInDB = `SELECT * FROM user WHERE username="${username}";`;
  const dbUser = await db.get(userNameInDB);

  if (dbUser === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    const isPasswordCorrect = await bcrypt.compare(password, dbUser.password);
    if (isPasswordCorrect) {
      response.send("Login success!");
    } else {
      response.status(400);
      response.send("Invalid password");
    }
  }
});

//API3
app.put("/change-password", async (request, response) => {
  const { username, oldPassword, newPassword } = request.body;
  const userNameInDB = `SELECT * FROM user WHERE username="${username}";`;
  const dbUser = await db.get(userNameInDB);
  const CheckCurrentPassword = await bcrypt.compare(
    oldPassword,
    dbUser.password
  );
  if (CheckCurrentPassword) {
    if (newPassword.length < 5) {
      response.status(400);
      response.send("Password is too short");
    } else {
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      const queryTochangePassword = `UPDATE user 
      SET password="${hashedPassword}";`;
      await db.run(queryTochangePassword);

      response.send("Password updated");
    }
  } else {
    response.status(400);
    response.send("Invalid current password");
  }
});
module.exports = app;
