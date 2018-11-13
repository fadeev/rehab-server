const express = require('express')
const app = express()
const port = 3000
const { sql, poolPromise } = require('./db')
var bodyParser = require('body-parser')

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  res.header('Access-Control-Allow-Methods', 'PUT, POST, GET, DELETE, OPTIONS, PATCH');
  next();
});

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

app.route('/patient')
.get(async (req, res) => {
  try {
    const pool = await poolPromise
    const data = await pool.request()
      .query('select primaryKey, ФИО, ДатаРождения from Пациент')
    res.json({data: data.recordset})
  } catch (err) {
    res.status(500)
    res.send(err.message)
  }
})
.post(async (req, res) => {
  try {
    const pool = await poolPromise
    const data = await pool.request()
      .input('name', req.body['ФИО'])
      .input('birthdate', req.body['ДатаРождения'])
      .query(`
        insert into Пациент (primaryKey, ФИО, ДатаРождения)
        output Inserted.primaryKey
        values (newid(), @name, @birthdate)
      `)
    res.json({data: data.recordset[0]})
  } catch (err) {
    res.status(500)
    res.send(err.message)
  }
})

app.route('/patient/:id')
.get(async (req, res) => {
  try {
    const pool = await poolPromise
    const data = await pool.request()
      .input('id', req.params.id)
      .query('select * from Пациент where primaryKey = @id')
    res.json({data: data.recordset[0]})
  } catch (err) {
    res.status(500)
    res.send(err.message)
  }
})
.patch(async (req, res) => {
  try {
    const pool = await poolPromise
    const data = await pool.request()
      .input('id', req.body.primaryKey)
      .input('name', req.body["ФИО"])
      .input('sex', req.body["Пол"])
      .input('birthdate', req.body["ДатаРождения"])
      .input('phone', req.body["Телефон"])
      .input('address', req.body["АдресПроп"])
      .input('flat', req.body["Квартира"])
      .query(`
        update Пациент
        set
        ФИО = @name,
        Пол = @sex,
        ДатаРождения = @birthdate,
        Телефон = @phone,
        АдресПроп = @address,
        Квартира = @flat
        where primaryKey = @id
      `)
    res.json({data})
  } catch (err) {
    res.status(500)
    res.send(err.message)
  }
})

app.route('/patient/:id/observation')
.get(async (req, res) => {
  try {
    const pool = await poolPromise
    const data = await pool.request()
      .input('id', req.params.id)
      .query('select * from Обследование where Пациент = @id order by Обследование.Дата desc')
    res.json({data: data.recordset})
  } catch (err) {
    res.status(500)
    res.send(err.message)
  }
})

app.route('/observation/:id')
.get(async (req, res) => {
  try {
    const pool = await poolPromise
    const data = await pool.request()
      .input('id', req.params.id)
      .query('select * from Обследование where primaryKey = @id')
    res.json({data: data.recordset[0]})
  } catch (err) {
    res.status(500)
    res.send(err.message)
  }
})

app.route('/observation/:id/indicator')
.get(async (req, res) => {
  try {
    const pool = await poolPromise
    const data = await pool.request()
      .input('id', req.params.id)
      .input('specialist', req.query.specialist)
      .query(`
        select ip.*
        from ИнтегральныйПоказатель as ip
        where ip.Сотрудник = @specialist
      `)
    res.json({data: data.recordset})
  } catch (err) {
    res.status(500)
    res.send(err.message)
  }
})

app.route('/observation')
.post(async (req, res) => {
  try {
    const pool = await poolPromise
    const data = await pool.request()
      .input('id', req.body.id)
      .query('insert into Обследование (primaryKey, Пациент, Дата) output Inserted.primaryKey values (newid(), @id, getdate())')
    res.json({data: data.recordset[0]})
  } catch (err) {
    res.status(500)
    res.send(err.message)
  }
})

app.route('/attribute')
.get(async (req, res) => {
  try {
    const pool = await poolPromise
    const data = await pool.request()
    .query('select * from ХарактеристикаИнтегральногоПоказателя')
    res.json({data: data.recordset})
  } catch (err) {
    res.status(500)
    res.send(err.message)
  }
})

app.route('/indicator')
.get(async (req, res) => {
  try {
    const pool = await poolPromise
    const data = await pool.request()
      .query('select * from ИнтегральныйПоказатель')
    res.json({data: data.recordset})
  } catch (err) {
    res.status(500)
    res.send(err.message)
  }
})
.post(async (req, res) => {
  try {
    const pool = await poolPromise
    const data = await pool.request()
    .input("observation", req.body.observation)
    .input("attribute", req.body.attribute)
    .input("indicator", req.body.indicator)
    .query(`
      insert into ОценкаИнтегральногоПоказателя
      (primaryKey, Обследование, Характеристика, ИнтегральныйПоказатель)
      values
      (newid(), @observation, @attribute, @indicator)
    `)
    res.json({data: data.recordset})
  } catch (err) {
    res.status(500)
    res.send(err.message)
  }
})

app.route('/indicator/:id')
.get(async (req, res) => {
  try {
    const pool = await poolPromise
    const data = await pool.request()
      .input("id", req.params.id)
      .query('select * from ИнтегральныйПоказатель where primaryKey = @id')
    res.json({data: data.recordset[0]})
  } catch (err) {
    res.status(500)
    res.send(err.message)
  }
})
.patch(async (req, res) => {
  try {
    const pool = await poolPromise
    const data = await pool.request()
      .input("id", req.body.primaryKey)
      .input("name", req.body['Наименование'])
      .query(`
        update ИнтегральныйПоказатель
        set
        Наименование = @name
        where primaryKey = @id
      `)
    res.json({data: data.recordset})
  } catch (err) {
    res.status(500)
    res.send(err.message)
  }
})

app.route('/specialist')
.get(async (req, res) => {
  try {
    const pool = await poolPromise
    const data = await pool.request()
      .query('select * from Сотрудник')
    res.json({data: data.recordset})
  } catch (err) {
    res.status(500)
    res.send(err.message)
  }
})

app.route('/specialist/:id')
.get(async (req, res) => {
  try {
    const pool = await poolPromise
    const data = await pool.request()
      .input('id', req.params.id)
      .query('select * from Сотрудник where primaryKey = @id')
    res.json({data: data.recordset[0]})
  } catch (err) {
    res.status(500)
    res.send(err.message)
  }
})
.patch(async (req, res) => {
  try {
    const pool = await poolPromise
    const data = await pool.request()
      .input('id', req.body.primaryKey)
      .input('name', req.body["ФИО"])
      .input('code', req.body["Код"])
      .input('login', req.body["Логин"])
      .input('comment', req.body["Примечание"])
      .input('job', req.body["Должность_m0"])
      .input('division', req.body["Подразделение"])
      .input('relevant', req.body["Актуально"])
      .query(`
        update Сотрудник
        set
        ФИО = @name,
        Код = @code,
        Логин = @login,
        Примечание = @comment,
        Должность_m0 = @job,
        Подразделение = @division,
        Актуально = @relevant
        where primaryKey = @id
      `)
    res.json({data})
  } catch (err) {
    res.status(500)
    res.send(err.message)
  }
})

app.route('/job')
.get(async (req, res) => {
  try {
    const pool = await poolPromise
    const data = await pool.request()
      .query('select * from Должность')
    res.json({data: data.recordset})
  } catch (err) {
    res.status(500)
    res.send(err.message)
  }
})

app.route('/job/:id')
.get(async (req, res) => {
  try {
    const pool = await poolPromise
    const data = await pool.request()
      .input('id', req.params.id)
      .query('select * from Должность where primaryKey = @id')
    res.json({data: data.recordset[0]})
  } catch (err) {
    res.status(500)
    res.send(err.message)
  }
})
.patch(async (req, res) => {
  try {
    const pool = await poolPromise
    const data = await pool.request()
      .input('id', req.body.primaryKey)
      .input('name', req.body["Наименование"])
      .query(`
        update Должность
        set
        Наименование = @name
        where primaryKey = @id
      `)
    res.json({data})
  } catch (err) {
    res.status(500)
    res.send(err.message)
  }
})

app.route('/division')
.get(async (req, res) => {
  try {
    const pool = await poolPromise
    const data = await pool.request()
      .query('select * from Подразделение')
    res.json({data: data.recordset})
  } catch (err) {
    res.status(500)
    res.send(err.message)
  }
})

app.route('/evaluation')
.get(async (req, res) => {
  try {
    const pool = await poolPromise
    const data = await pool.request()
      .input('observation_id', req.query.observation_id)
      .query(`
        select *
        from ОценкаИнтегральногоПоказателя
        where Обследование = @observation_id
      `)
    res.json({data: data.recordset})
  } catch (err) {
    res.status(500)
    res.send(err.message)
  }
})
.post(async (req, res) => {
  try {
    const pool = await poolPromise
    const data = await pool.request()
    .input('observation_id', req.body.observation_id)
    .input('indicator_id', req.body.indicator_id)
    .input('attribute_id', req.body.attribute_id)
    .input('evaluation_id', req.body.evaluation_id)
    .query(`
        insert into ОценкаИнтегральногоПоказателя
        (primaryKey, Обследование, ИнтегральныйПоказатель, Характеристика, CreateTime)
        values
        (newid(), @observation_id, @indicator_id, @attribute_id, getdate())
      `)
    res.json({data: data.recordset})
  } catch (err) {
    res.status(500)
    res.send(err.message)
  }
})

app.route('/test')
.get(async (req, res) => {
  try {
    const pool = await poolPromise
    const data = await pool.request()
      .input('id', req.query.id)
      .query(`
        select *
        from ОценкаИнтегральногоПоказателя
        where Обследование = @id
      `)
    res.json({data: data.recordset})
  } catch (err) {
    res.status(500)
    res.send(err.message)
  }
})

app.listen(port, () => console.log(`Example app listening on port ${port}!`))