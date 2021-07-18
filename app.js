const express = require("express");
const app = express();
app.use(express.json());
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const dbPath = path.join(__dirname, "covid19India.db");

let db = null;
const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server is running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};
initializeDBAndServer();

app.get("/states", async (request, response) => {
  const getStatesArray = `SELECT * FROM state 
    ORDER BY state_id;`;
  const getStates = await db.all(getStatesArray);
  response.send(
    getStates.map((eachData) => ({
      stateId: eachData.state_id,
      stateName: eachData.state_name,
      population: eachData.population,
    }))
  );
});

app.get("/states/:stateId", async (request, response) => {
  const { stateId } = request.params;
  const getStateObject = `SELECT * FROM state WHERE state_id = ${stateId};`;
  const getState = await db.get(getStateObject);
  response.send({
    stateId: getState.state_id,
    stateName: getState.state_name,
    population: getState.population,
  });
});

app.post("/districts", async (request, response) => {
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const createDistrictsData = `INSERT INTO district (district_name,state_id,cases,cured,active,deaths)
    VALUES ('${districtName}',${stateId},${cases},${cured},${active},${deaths});`;
  const district = await db.run(createDistrictsData);
  const districtId = district.lastID;
  response.send("District Successfully Added");
});

app.get("/districts/:districtId", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictObject = `SELECT * FROM district WHERE district_id=${districtId};`;
  const getDistrict = await db.get(getDistrictObject);
  response.send({
    districtId: getDistrict.district_id,
    districtName: getDistrict.district_name,
    stateId: getDistrict.state_id,
    cases: getDistrict.cases,
    cured: getDistrict.cured,
    active: getDistrict.active,
    deaths: getDistrict.deaths,
  });
});

app.delete("/districts/:districtId", async (request, response) => {
  const { districtId } = request.params;
  const deleteDistrictData = `DELETE FROM district WHERE district_id=${districtId};`;
  await db.run(deleteDistrictData);
  response.send("District Removed");
});

app.put("/districts/:districtId", async (request, response) => {
  const { districtId } = request.params;
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const updateDistrictData = `UPDATE district SET district_name='${districtName}',
    state_id = ${stateId},
    cases = ${cases},
    cured=${cured},
    active=${active},
    deaths=${deaths}
    WHERE 
    district_id =${districtId};`;
  const updateDistrict = await db.run(updateDistrictData);
  response.send("District Details Updated");
});

app.get("/states/:stateId/stats", async (request, response) => {
  const { stateId } = request.params;
  const getStatesDetails = `SELECT SUM(cases) AS TotalCases,
  SUM(cured) AS TotalCured,
  SUM(active) AS TotalActive,
   SUM(deaths) AS TotalDeaths
   FROM district WHERE state_id=${stateId};`;
  const stateDetails = await db.get(getStatesDetails);
  response.send({
    totalCases: stateDetails.TotalCases,
    totalCured: stateDetails.TotalCured,
    totalActive: stateDetails.TotalActive,
    totalDeaths: stateDetails.TotalDeaths,
  });
});

app.get("/districts/:districtId/details", async (request, response) => {
  const { districtId } = request.params;
  const getDistricts = `SELECT * FROM district INNER JOIN state WHERE district_id=${districtId};`;
  const district = await db.get(getDistricts);
  response.send({
    stateName: district.state_name,
  });
});

module.exports = app;
