const { response } = require('express');
var express = require('express');
var router = express.Router();
const {v4: uuidv4} = require("uuid")

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

/**
 * CPF - String
 * name - string
 * id - uuid
 * statement []
 */

//Middleware
function verifyExistsAccountCPF(req, res, next) {
  const {cpf} = req.headers
  const customer = customers.find((customer) => customer.cpf === cpf);
  if (!customer) {
    return res.status(400).json({error: "Costumer not found."})
  }

  req.customer = customer;
  return next()
}

function getBalance(statement) {
  const balance = statement.reduce((acc, operation) => {
    if (operation.type === 'credit') {
      return acc + operation.amount
    }else{
      return acc - operation.amount
    }
  }, 0)

  return balance
}

const customers = [];


router.post('/account', (req, res) => {
  const {cpf, name }= req.body;

  constumerAlreadyExists = customers.some((customer)=> customer.cpf === cpf)

  if (constumerAlreadyExists) {
    return res.status(400).json({error: "Customer already exists!"})
  }

  customers.push({
    cpf,
    name,
    id: uuidv4(),
    statement: []
  })

  return res.status(201).send(customers);
});


// app.use(verifyExistsAccountCPF) -< de forma global, todas as rotas abaixo irao receber esse middleware.

router.get('/statement', verifyExistsAccountCPF, (req, res) => {

  const { customer } = req

  return res.json(customer.statement)

});

router.post('/deposit', verifyExistsAccountCPF, (req, res) => {


  const { description, amount } = req.body

  const {customer} = req

  const statementOperation = {
    description,
    amount,
    created_at: new Date(),
    type: "credit"
  }

  customer.statement.push(statementOperation)

  return res.status(201).send()

});

router.post('/withdraw', verifyExistsAccountCPF, (req, res) => {
  const { amount } = req.body
  const { customer } = req

  const balance = getBalance(customer.statement)

  if (balance < amount) {
     return res.status(400).json({error: "Insufficient founds!"})
  }

  const statementOperation = {
    amount,
    created_at: new Date(),
    type: "debit"
  }

  customer.statement.push(statementOperation)

  return res.status(201).send()

});

router.get('/statement/date', verifyExistsAccountCPF, (req, res)=> {

  const { customer } = req
  const { date } = req.query

  const dateFormat = new Date(date + " 00:00")

  const statement = customer.statement.filter(
    (statement) => 
    statement.created_at.toDateString() === 
    new Date(dateFormat).toDateString()
  )

  return res.json(statement)

});

router.put("/account", verifyExistsAccountCPF, (req, res)=> {
  const { name } = req.body
  const { customer } = req
  customer.name = name;

  return res.status(201).send()
})

router.get("/account", verifyExistsAccountCPF, (req, res)=>{
  const { customer } = req

  return res.json(customer)
})

router.delete("/account", verifyExistsAccountCPF, (req, res)=>{
  const { customer } = req
  //splices
  customers.splice(customer, 1)

  return res.status(200).json(customers)
})

router.get("/balance", verifyExistsAccountCPF, (req, res)=>{
  const { customer } = req

  const balance = getBalance(customer.statement)

  return res.json(balance)
})
module.exports = router;
