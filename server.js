const express = require('express')
const readline = require('readline')    
const bodyParser = require('body-parser')
const cookieParser = require('cookie-parser')
const { ECDH } = require('crypto')
const os = require('os')
const cluster = require('cluster')
const {spawn, fork} = require('child_process')
const server = express()

var command, forks = [], commandProcess, filename
var aliceIndex, bobIndex

server.use(cookieParser())
server.use(bodyParser.json())
server.use(bodyParser.urlencoded({ extended: true }))
server.use(express.json())
server.use(express.urlencoded({ extended: true }))
server.listen(3000, ()=>{
    console.log("Started on PORT 3000")
})

server.post('/', (req, res)=>{
    res.send('OK')
})

server.post('/_handshake/:from/:to', (req,res)=>{
    let { from, to } = req.params
    let { key } = req.body

    if(to==='alice')
        commandProcess = forks[aliceIndex]
    else if(to==='bob')
        commandProcess = forks[bobIndex]
    
    commandProcess.send({ command: 'secret', pubkey: key })
    res.sendStatus(200)
})

server.post('/_send/:from/:to', (req,res)=>{
    let { from, to } = req.params
    let { msg } = req.body
    
    if(to==='alice')
        commandProcess = forks[aliceIndex]
    else if(to==='bob')
        commandProcess = forks[bobIndex]
    
    console.log('> Recieved Message', msg)
    commandProcess.send({ command: 'recieve', recieve: msg })
    res.sendStatus(200)
})

const interface = readline.createInterface({ input: process.stdin, output: process.stdout })
interface.on('line', (input) => {
    let tokens = input.split(' ')

    switch(tokens[0]) {
        case 'alice':
            filename = './alice.js'
            command = 'alice'

            if(aliceIndex!==undefined)
                commandProcess = forks[aliceIndex]
            break

        case 'bob':
            filename = './bob.js'
            command = 'bob'
            
            if(bobIndex!==undefined)
                commandProcess = forks[bobIndex]
            break

        case 'kill':
            forks.forEach((fork)=>{
                fork.unref()
            })
            console.log('> Dying')
            process.exit(0)
            break

        case 'debug':
            forks.push(fork('./alice.js'))
            aliceIndex = 0
            forks.push(fork('./bob.js'))
            bobIndex = 1

            forks.forEach((_process)=>{
                commandProcess = _process
                commandProcess.send({ command: 'init' })
                commandProcess.send({ command: 'create' })
                commandProcess.send({ command: 'transmit' })
            })

            break
        
        case 'restart':
            
            break

        default:
            console.log('> Command Not Found')
    }

    switch(tokens[1]) {
        case 'init':
            if(forks.length>=2) {
                console.log("> Rejected : Enough processes running")
                break
            }
            commandProcess = fork(filename)
            forks.push(commandProcess)
            if(command==='alice')
                aliceIndex = forks.length - 1
            else if(command==='bob')
                bobIndex = forks.length - 1
            commandProcess.send({ command: 'init' })
            break

        case 'start':
            if(forks.length>=2) {
                console.log("> Rejected : Enough processes running")
                break
            }
            commandProcess = fork(filename)
            forks.push(commandProcess)
            if(command==='alice')
                aliceIndex = forks.length - 1
            else if(command==='bob')
                bobIndex = forks.length - 1
            commandProcess.send({ command: 'init' })
            commandProcess.send({ command: 'create' })
            break

        case 'create':
            commandProcess.send({ command: 'create' })
            break

        case 'transmit':
            commandProcess.send({ command: 'transmit' })
            break

        case 'show':
            commandProcess.send({ command: 'show', what: tokens[2] })
            break

        case 'send':
            message = ''
            for(let i=2;i<tokens.length;i++)
                message += tokens[i] + '\\'
            commandProcess.send({ command: 'send', send: message })
            break

        default:
            console.log('> No Matching Options')
    }
})