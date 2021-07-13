const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt-nodejs');
const cors = require('cors');
const knex = require('knex');
const { response } = require('express');

const db = knex({
    client: 'pg',
    connection: {
      host : '127.0.0.1',
      user : 'postgres',
      password : 'nikola',
      database : 'to-do-list'
    }
  });

const app = express();

app.use(bodyParser.json());
app.use(cors());

app.get('/', (req, res) => {
    res.send(database.users);
})

app.post('/signin', (req, res) => {
    db.select('username', 'hash').from('login')
    .where('username', '=', req.body.username)
    .then(data => {
        const isValid = bcrypt.compareSync(req.body.password, data[0].hash);
        if(isValid){
            return db.select('*').from('users')
            .where('username', '=', req.body.username)
            .then(user => {
                res.json(user[0])
            })
            .catch(err => res.status(400).json('unable to get user'))
        }else{
            res.status(400).json('wrong credentials')
        }
        
    })
    .catch(err => res.status(400).json('wrong credentials'))
})

app.post('/add-task', (req, res) => {
    const {userid, datefortask, taskname, taskdescription} = req.body;
    db.insert({
        userid: userid,
        datefortask: datefortask,
        taskname: taskname,
        taskdescription: taskdescription
    })
    .into('task')
    .returning("*")
    .then(task => {
        res.send(task);
    })
})

app.get('/read-tasks/:userid', (req, res) => {
    const { userid } =req.params; 
    db.select('*').from('task').where({userid})
    .then(task => {
        res.send(task)
    }).catch(err => res.status(400).json('error getting task'))
})

app.post('/register', (req, res) => {
    const {username, firstName, lastName, password} = req.body;
    const hash = bcrypt.hashSync(password);
    db.transaction(trx => {
        trx.insert({
            hash: hash,
            username: username
        })
        .into('login')
        .returning('username')
        .then(loginUsername => {
            return trx('users')
            .returning('*')
            .insert({
                username: loginUsername[0],
                firstname: firstName,
                lastname:lastName
            })
            .then(user => {
                res.json(user[0]);
            })
        })
        .then(trx.commit)
        .catch(trx.rollback)
    })
    .catch(err => res.status(400).json('unable to register'))   
})

app.delete('/delete-task/:id', (req,res) => {
    const { id } =req.params; 
    const { userid } =req.params; 
    db.from('task').where({id})
        .del()
        .then(
            db.select('*').from('task')
            .then(task => {
                res.send(task)
            }).catch(err => res.status(400).json('error getting task'))
        );  
})

app.listen(3000, () => {
    console.log('App is running on port 3000')
})