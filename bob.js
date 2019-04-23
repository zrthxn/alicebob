const crypto = require('crypto')
const request = require('request')
    
const os = require('os')
const cluster = require('cluster')
const {spawn, fork} = require('child_process')

var bob, keys = {}

process.on('message', (message)=>{
    switch(message.command) {
        case 'init':
            console.log('(bob) :: Initaized')
            break

        case 'create':
            bob = crypto.createECDH('sect571r1')
            keys['pub'] = bob.generateKeys()
            break

        case 'transmit':
            request.post('http://127.0.0.1:3000/bob/alice', {
                body: {
                    owner: 'bob',
                    key: keys,
                    keyType: 'public'
                }
            }, ()=>{
                console.log('(bob) :: Transmitted Key |', keys.pub)
            })
            break

        case 'secret':
            keys['pvt'] = bob.computeSecret(message.key)
            console.log('(bob) :: Computed Secret Key')
            break
    }
})