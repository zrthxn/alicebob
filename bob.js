const crypto = require('crypto')
const request = require('request')
    
const os = require('os')
const cluster = require('cluster')
const {spawn, fork} = require('child_process')

var bob
var keys = {
    public: null,
    secret: null
}

var algo = 'aes-256-ctr'

process.on('message', (message)=>{
    switch(message.command) {
        case 'init':
            console.log('(bob) :: Initaized')
            break

        case 'create':
            bob = crypto.createECDH('secp256k1')
            keys['public'] = bob.generateKeys('hex')
            console.log('\x1b[32m%s\x1b[0m', '(bob) :: Created Key')
            break

        case 'transmit':
            request.post({
                url: 'http://127.0.0.1:3000/_handshake/bob/alice',
                json: true,
                body: {
                    key: keys.public
                }
            }, (error, response, body)=>{
                console.log('(bob) :: Transmitted Key', body)
            })
            break

        case 'secret':
            keys['secret'] = bob.computeSecret(Buffer.from(message.pubkey, 'hex'))
            console.log('\x1b[32m%s\x1b[0m', '(bob) :: Computed Secret Key')
            break
        
        case 'show':
            if(message.what==='key')
                console.log('(bob) :: Key', keys.public)
            else if(message.what==='secret')
                console.log('(bob) :: Secret', keys.secret)
            break

        case 'send':
            var cipher = crypto.createCipher(algo, keys.secret)
            let encrypted = cipher.update(message.send, 'utf8', 'hex')
            encrypted += cipher.final('hex')
            request.post({
                url: 'http://127.0.0.1:3000/_send/bob/alice',
                json: true,
                body: {
                    msg: encrypted
                }
            }, (error, response, body)=>{
                console.log('(bob) Sent', body)
            })

            // ==== Ratcheting ====
            keys['public'] = bob.generateKeys('hex')
            request.post({
                url: 'http://127.0.0.1:3000/_handshake/bob/alice',
                json: true,
                body: {
                    key: keys.public
                }
            }, (error, response, body)=>{})
            break
    
        case 'recieve':
            var decipher = crypto.createDecipher(algo, keys.secret)
            let decrypted = decipher.update(message.recieve, 'hex', 'utf8')
            decrypted += decipher.final('utf8')

            decrypted = decrypted.split('\\')
            let _msg = ''
            for(let i=0;i<decrypted.length;i++)
                _msg += decrypted[i] + ' '

            console.log('(bob) Alice says: ', _msg)

            // ==== Ratcheting ====
            keys['public'] = bob.generateKeys('hex')
            request.post({
                url: 'http://127.0.0.1:3000/_handshake/bob/alice',
                json: true,
                body: {
                    key: keys.public
                }
            }, (error, response, body)=>{})
            break
    }
})