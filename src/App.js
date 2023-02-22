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

  var db
  const dbName = 'customer_DB'

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

  const makeKey = async () => {
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

  const createDatabase = () => {
    if (!window.indexedDB) {
      alert('Your current browser does not support IndexedDB. This page will not work.')
      return
    }

    const request = window.indexedDB.open(dbName, 1)

    // Event handling
    request.onerror = (e) => {
      console.error(`IndexedDB error: ${request.errorCode}`)
    }

    request.onsuccess = (e) => {
      console.info('Successful database connection')
      db = request.result
    }

    request.onupgradeneeded = (e) => {
      console.info('Database created')
      db = request.result
      const keysObjectStore = db.createObjectStore('keys', { keyPath: 'nid' })
      keysObjectStore.createIndex('nid', 'nid', { unique: true })
      keysObjectStore.transaction.oncompleted = (e) => {
        console.log('Object store "student" created')
      }
    }
  }

  function addKeyPairDB(key) {
    const transaction = db.transaction('keys', 'readwrite')

    transaction.oncomplete = function (event) {
      //...
    }

    transaction.onerror = function (event) {
      //...
    }

    const objectStore = transaction.objectStore('keys')

    const request = objectStore.add(key)

    request.onsuccess = () => {
      // request.result contains key of the added object
      console.log(`New key added, email: ${request.result}`)
    }

    request.onerror = (err) => {
      console.error(`Error to add new key: ${err}`)
    }
  }

  function getKey(key) {
    const request = db.transaction('keys').objectStore('keys').get(key)

    request.onsuccess = () => {
      const selectedKey = request.result

      return selectedKey
    }

    request.onerror = (err) => {
      console.error(`Error to get keys information: ${err}`)
    }
  }

  // const getExistingKey = () => {
  //   console.log(db)
  //   const transaction = db.transaction(['customers'])

  //   const objectStore = transaction.objectStore('customers')
  //   const request = objectStore.get('0017790948')

  //   request.onerror = (event) => {
  //     // Handle errors!
  //   }
  //   request.onsuccess = (event) => {
  //     // Do something with the request.result!
  //     console.log(`result is ${request.result}`)
  //   }
  // }

  const generateKeyPair = async () => {
    const isExisting = (await window.indexedDB.databases())
      .map((db) => db.name)
      .includes(dbName)
    console.log(isExisting)
    if (!isExisting) {
      console.log('generating keys**************')
    } else {
      console.log('reading keys*********')

      const transaction = db.transaction('keys', 'readonly')

      transaction.oncomplete = function (event) {
        // This event will be executed when
        // the transaction has finished
      }

      transaction.onerror = function (event) {
        // Handling Errors
      }

      // Access to the "students table"
      const objectStore = transaction.objectStore('keys')
    }
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
    axios
      .post('/web-sign', { tbs, signature: hexSignature, publicKey })
      .then((res) => console.log(res))
  }

  return (
    <div className='App'>
      <input type='text' value={tbs} onChange={(e) => setTbs(e.target.value)} />
      <div>
        <button onClick={generateKeyPair}>get key pair</button>
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
