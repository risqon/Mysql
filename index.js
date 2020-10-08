const express = require('express');
const path = require('path')
const bodyParser = require('body-parser');
const { Router } = require('express');
const sqlite3 = require(`sqlite3`).verbose()

const dbFile = path.join(__dirname + "/laporan.db");
let db = new sqlite3.Database(dbFile, sqlite3.OPEN_READWRITE, (err) => {
    if (err) throw err;
    console.log("Koneksi ke database berhasil!");
});

const app = express();

app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())
app.use('/', express.static(path.join(__dirname, 'laporan')))

//Search

app.get('/', (req, res) => {
    let dataSearch = []
    let search = false
 
    if (req.query.checkId && req.query.id) {
        dataSearch.push(`id = ${req.query.id}`)
        search = true
    }

    if (req.query.checkString && req.query.string) {
        dataSearch.push(`string = "${req.query.string}"`)
        search = true
    }

    if (req.query.checkInteger && req.query.integer) {
        dataSearch.push(`integer = "${req.query.integer}"`)
        search = true
    }

    if (req.query.checkFloat && req.query.float) {
        dataSearch.push(`float = "${req.query.float}"`)
        search = true
    }

    if (req.query.checkDate && req.query.startDate && req.query.endDate) {
        dataSearch.push(`date BETWEEN '${req.query.startDate}' AND '${req.query.endDate}'`)
        search = true
    }

    if (req.query.checkBoolean && req.query.boolean) {
        dataSearch.push(`boolean = "${req.query.boolean}"`)
        search = true
    } 
   
   let searchFinal = ""
    if (search) {
        searchFinal += `WHERE ${dataSearch.join(' AND ')}`
        //console.log(dataSearch)
    } 

// Pagination

    const page = req.query.page || 1
    const limit = 5
    const offset = (page - 1) * limit

    db.all(`SELECT COUNT (id) as total FROM laporan`, (err, rows) => {
        if (err) {
            return console.error(err.message)
        } else if (rows == 0) {
            return res.send('data not found')
        } else {
            total = rows[0].total
            const pages = Math.ceil(total / limit)
            
            let sql = `SELECT * FROM laporan ${searchFinal} LIMIT ? OFFSET ?`
            db.all(sql, [limit,offset], (err, dbFile) => {

                if (err) {
                    return console.error(err.message)
                } else if (dbFile == 0) {
                    return res.send('No data');
                } else {
                    let data = [];
                    data.forEach(row => {
                        data.push(row);
                    });
                    res.render('list', { dbFile, page, pages })
                }
            })
        }
    })
})


//add
app.get('/add', (req, res) => { res.render('add') });
app.post("/add", (req, res) => {
    const sql = `INSERT INTO laporan(string,integer,float, date,boolean) VALUES ('${req.body.String}','${req.body.Integer}','${req.body.Float}','${req.body.Date}', '${req.body.Boolean}')`;
    // const data = [ ]
    db.run(sql, err => {
        if (err) {
            console.error(err.message);
        } console.log(sql)
        // console.log(req.body)
        res.redirect("/")
    });
});

//delete
app.get('/delete/:id', (req, res) => {
    let id = req.params.id;
    //console.log(req.params.id)
    const sqlDel = `DELETE FROM laporan WHERE id = ?`;
    db.run(sqlDel, id, (err) => {
        if (err) throw err;
        // console.log('Delete success')
    })
    res.redirect('/')
});

//edit
app.get('/edit/:id', (req, res) => {
    const sql = `SELECT * FROM laporan WHERE id =${req.params.id}`;
    db.get(sql, (err, row) => {
        if (err) {
            return console.error(err.message)
        }
        res.render("edit", { result: row });
    });
});
app.post('/edit/:id', (req, res) => {
    // const id = req.params.id;
    const sqlEdit = `UPDATE laporan SET string = '${req.body.String}', integer = '${req.body.Integer}', float = '${req.body.Float}', date = '${req.body.Date}', boolean = '${req.body.Boolean}' WHERE id = '${req.params.id}'`
    db.run(sqlEdit, (err) => {
        if (err) throw err;

    })
    res.redirect('/');
})

// nyalakan servernya
app.listen(4000, function () {
    console.log('Server berjalan diport 3000');
}); 