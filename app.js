/* imports */

require('dotenv').config()

const express = require('express')
const mongoose = require('mongoose')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')

const app = express()

//config JSON response
app.use(express.json())

// Models
const User = require('./models/User')

//Open Route - Public Route
app.get('/', (req, res) => {
  res.status(200).json({ msg: 'Bem vindo a nossa API' })
})

// Private Route
app.get('/user/:id', checkToken, async (req, res) => {
  const id = req.params.id

  // check user exists
  const user = await User.findById(id, "-password")

  if (!user) {
    return res.status(404).json({ msg: 'Usuário não encontrado!' })
  }

  res.status(200).json({ user })
})

function checkToken(req, res, next) {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]

  if (!token) {
    return res.status(401).json({ msg: 'Acesso negado!' })
  }

  try {

    const secret = process.env.SECRET

    jwt.verify(token, secret)

    next()

  } catch (error) {
    res.status(400).json({ msg: 'Token inválido!' })
  }
}


// Register User
app.post('/auth/register', async (req, res) => {
  const { username, email, password, confirmapassword } = req.body

  // Validations
  if (!username) {
    return res.status(422).json({ msg: 'O nome é obrigatório' })
  }

  if (!email) {
    return res.status(422).json({ msg: 'O email é obrigatório' })
  }

  if (!password) {
    return res.status(422).json({ msg: 'Adicione a senha' })
  }

  if (password !== confirmapassword) {
    return res.status(422).json({ msg: 'A senha não confere' })
  }

  // check if user exists
  const userExists = await User.findOne({ email: email })

  if (userExists) {
    return res.status(422).json({ msg: "Email já existente!" })
  }

  //create password

  const salt = await bcrypt.genSalt(12)
  const passwordHash = await bcrypt.hash(password, salt)

  //create user

  const user = new User({
    username,
    email,
    password: passwordHash
  })

  try {
    await user.save()

    res.status(201).json({ msg: 'Usuário criado com sucesso!' })
  } catch (error) {
    console.log(error)

    res
      .status(500)
      .json({ msg: 'Erro no servidor, tente novamente mais tarde!' })
  }

})

// login user
app.post('/auth/login', async (req, res) => {
  const { email, password } = req.body

  //validations
  if (!email) {
    return res.status(422).json({ msg: 'O email é obrigatório' })
  }

  if (!password) {
    return res.status(422).json({ msg: 'Senha obrigatória' })
  }
  //check if user exists
  const user = await User.findOne({ email: email })

  if (!user) {
    return res.status(404).json({ msg: "Usuário não encontrado!" })
  }
  // check if password match
  const checkPassword = await bcrypt.compare(password, user.password)

  if (!checkPassword) {
    return res.status(422).json({ msg: "Senha invalida!" })
  }

  try {
    const secret = process.env.SECRET

    const token = jwt.sign(
      {
        id: user._id,
      },
      secret,
    )
    res.status(200).json({ msg: 'Autenticação realizada com sucesso', token })

  } catch (err) {
    console.log(error)

    res.status(500).json({
      msg: 'aconteceu um erro no servidor, tente novamente mais tarde!'
    })
  }
})

// Credentials
const dbUser = process.env.DB_USER
const dbPassword = process.env.DB_PASS

mongoose
  .connect(
    `mongodb+srv://${dbUser}:${dbPassword}@cluster0.xffp7yk.mongodb.net/?retryWrites=true&w=majority`
  )
  .then(() => {
    app.listen(3000)
    console.log('Conectou o banco')
  })

