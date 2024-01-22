import express from "express";
import bodyParser from "body-parser";
import pg from "pg";

const app = express();
const port = 3000;

const db = new pg.Client({
  user: "postgres",
  host: "localhost",
  database: "World",
  password: "63789",
  port: 5432,
});
db.connect();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

let countries = [];
async function checkVisited(id) {
  // console.log("ID is" + id);
  const result = await db.query(
    "SELECT country_code FROM visited_countries WHERE user_id = $1",
    [id]
  );
  // console.log(result);
  let countries = [];
  result.rows.forEach((country) => {
    countries.push(country.country_code);
  });
  // console.log(countries);
  return countries;
}
app.get("/", async (req, res) => {
  const users_object = await db.query("SELECT * FROM users");
  // console.log(users_object);
  // console.log(users_object);
  // console.log(users_object.rows);
  users_object.rows.forEach((user) => {
    console.log(user.id);
    console.log(user.name);
    console.log(user.color);
  });
  console.log(countries);

  res.render("index.ejs", {
    countries: countries,
    users: users_object.rows,
    total: countries.length,
    color: "teal",
  });
});
app.post("/add", async (req, res) => {
  const input = req.body["country"].toLowerCase();
  // console.log(input);
  const result1 = await db.query(
    "SELECT country_code FROM countries WHERE LOWER(country_name) LIKE $1",
    [`%${input}%`]
  );
  console.log("Country code" + result1.rows[0].country_code);
  const userid = req.body["userId"];
  const countryid = result1.rows[0].country_code;
  console.log(userid);
  console.log(countryid);
  try {
    await db.query(
      "INSERT INTO visited_countries (user_Id, country_code) VALUES ($1, $2)",
      [userid, countryid]
    );
  } catch (error) {
    const users_object = await db.query("SELECT * FROM users");
    const result = await checkVisited(userid);

    const colorObject = await db.query(
      "SELECT color FROM users WHERE id = $1",
      [userid]
    );
    const color = colorObject.rows[0].color;
    res.render("index2.ejs", {
      userId: userid,
      countries: result,
      users: users_object.rows,
      total: result.length,
      color: color,
      error: "The country has already been added.",
    });
  }
  const users_object = await db.query("SELECT * FROM users");
  const result = await checkVisited(userid);

  const colorObject = await db.query("SELECT color FROM users WHERE id = $1", [
    userid,
  ]);
  const color = colorObject.rows[0].color;
  res.render("index2.ejs", {
    userId: userid,
    countries: result,
    users: users_object.rows,
    total: result.length,
    color: color,
  });
});

app.post("/user", async (req, res) => {
  res.render("new.ejs");
});

app.post("/new", async (req, res) => {
  try {
    const color = req.body["color"] || "teal";
    const name = req.body["name"];

    if (!name) {
      throw new Error("Name is required");
    }

    await db.query("INSERT INTO users (color, name) VALUES ($1, $2)", [
      color,
      name,
    ]);
    res.redirect("/");
  } catch (error) {
    console.log(error.message);
    res.render("new.ejs", { error: error.message });
  }
});

app.post("/currentuser", async (req, res) => {
  const users_object = await db.query("SELECT * FROM users");
  users_object.rows.forEach((user) => {
    // console.log("USER:", user);
  });
  const id = req.body["user"];

  const colorObject = await db.query("SELECT color FROM users WHERE id = $1", [
    id,
  ]);
  const color = colorObject.rows[0].color;
  // console.log("Color " + color);

  console.log("User ID " + id);
  const result1 = await checkVisited(id);
  console.log(result1);
  console.log(result1.length);
  res.render("index2.ejs", {
    userId: id,
    countries: result1,
    users: users_object.rows,
    total: result1.length,
    color: color,
  });
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
