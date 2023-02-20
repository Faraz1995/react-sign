import { useState } from 'react'
import axios from 'axios'
import './App.css'

function App() {
  const crypto = window.crypto || window.msCrypto // for IE 11 compatibility
  const subtle = crypto.subtle

  const [tbs, setTbs] = useState('')
  const [keypair, setKeypair] = useState({})
  const [signature, setSignature] = useState('')
  const [publicKey, setPublicKey] = useState('')

  function arrayBufferToPem(arrayBuffer, label) {
    const base64 = arrayBufferToBase64(arrayBuffer)
    return (
      `-----BEGIN ${label}-----\n` +
      chunkString(base64, 64) +
      `\n-----END ${label}-----\n`
    )
  }

  function chunkString(str, length) {
    return str.match(new RegExp(`.{1,${length}}`, 'g')).join('\n')
  }

  function arrayBufferToBase64(arrayBuffer) {
    let binary = ''
    const bytes = new Uint8Array(arrayBuffer)
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i])
    }
    return window.btoa(binary)
  }

  const generateKeyPair = async () => {
    const key = await subtle.generateKey(
      {
        name: 'RSASSA-PKCS1-v1_5',
        // Consider using a 4096-bit key for systems that require long-term security
        modulusLength: 1024,
        publicExponent: new Uint8Array([1, 0, 1]),
        hash: 'SHA-256'
      },
      false,
      ['sign', 'verify'] // can be any combination of "encrypt" and "decrypt"
    )
    setKeypair(key)
  }

  const sign = async () => {
    const privateKey = keypair.privateKey

    const sign = await window.crypto.subtle.sign('RSASSA-PKCS1-v1_5', privateKey, tbs)

    let buffer = new Uint8Array(sign)
    setSignature(buffer)
  }

  const getPublicKey = async () => {
    const publicKey = keypair.publicKey
    const publicKeyArrayBuffer = await subtle.exportKey('spki', publicKey)
    const publicKeyPem = arrayBufferToPem(publicKeyArrayBuffer, 'PUBLIC KEY')
    setPublicKey(publicKeyPem)
  }

  const verify = () => {
    const Buffer = require('buffer/').Buffer
    const hexSignature = Buffer.from(signature, 'base64').toString('hex')
    axios.post('/web-sign',{tbs,signature:hexSignature,publicKey}).then(res=>console.log(res))
  }

  return (
    <div className='App'>
      <input type='text' value={tbs} onChange={(e) => setTbs(e.target.value)} />
      <div>
        <button onClick={generateKeyPair}>generate key pair</button>
        <button onClick={sign}>sign</button>
        <button onClick={getPublicKey}>get public key</button>
        <button onClick={verify}>verify sign</button>
      </div>
      <div>
        <p>signature: </p>
        <p>{signature}</p>
        <p>publicKey: </p>
        <p>{publicKey}</p>
      </div>
    </div>
  )
}

export default App
