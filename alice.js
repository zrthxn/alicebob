const crypto = require('crypto')
const request = require('request')
    
const os = require('os')
const cluster = require('cluster')
const {spawn, fork} = require('child_process')

var alice, keys = {}

process.on('message', (message)=>{
    switch(message.command) {
        case 'init':
            console.log('(alice) :: Initaized')
            break

        case 'create':
            alice = crypto.createECDH('sect571r1')
            keys['pub'] = alice.generateKeys()
            break

        case 'transmit':
            request.post('http://127.0.0.1:3000/alice/bob', {
                body: {
                    owner: 'alice',
                    key: keys,
                    keyType: 'public'
                }
            }, ()=>{
                console.log('(alice) :: Transmitted Key |', keys.pub)
            })
            break

        case 'secret':
            keys['pvt'] = alice.computeSecret(message.key)
            console.log('(alice) :: Computed Secret Key')
            break
    }
})