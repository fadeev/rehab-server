const sql = require('mssql')

const config = {
  user: "rehab_user",
  password: "rehab_pass",
  server: 'tornado\\sql2008',
  database: "Rehab2017",
  options: {
    encrypt: false,
  },
}

const poolPromise = new sql.ConnectionPool(config)
  .connect()
  .then(pool => {
    console.log('Connected to MSSQL')
    return pool
  })
  .catch(err => console.log('Database Connection Failed! Bad Config: ', err))

module.exports = {
  sql, poolPromise
}