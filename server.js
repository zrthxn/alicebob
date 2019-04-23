const express = require('express')
const readline = require('readline')    
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
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

server.post('/:from/:to', (req,res)=>{
    if(req.params.to==='alice')
        commandProcess = forks[aliceIndex]
    else if(req.params.to==='bob')
        commandProcess = forks[bobIndex]
    
    commandProcess.send({ command: 'secret', key: req.body.key })
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
            // Killer
            break

        case 'restart':
            // Restart
            break

        default:
            console.log('Command Not Found')
    }

    switch(tokens[1]) {
        case 'init':
            if(forks.length>=2)
                break
            commandProcess = fork(filename)
            forks.push(commandProcess)
            if(command==='alice')
                aliceIndex = forks.length - 1
            else if(command==='bob')
                bobIndex = forks.length - 1
            commandProcess.send({ command: 'init' })
            break

        case 'start':
            break

        case 'create':
            commandProcess.send({ command: 'create' })
            break

        case 'transmit':
            commandProcess.send({ command: 'transmit' })
            break

        default:
            console.log('No Matching Options')
    }
})