var CryptoJS = require("crypto-js");

var express = require('express');
var app = express();
var server = app.listen(3000);

app.use(express.static('client'));
console.log("My server is running");

var socket = require('socket.io');

var io = socket(server);


//**************VDF Setup********************** 
// const bigintCryptoUtils = require('bigint-crypto-utils')
var bigInt = require("big-integer");
// var forge = require('node-forge');

var crypto = require('crypto');

function hextodec(hex_value){
    if (hex_value.length % 2) { hex_value = '0' + hex_value; }
    var bn = BigInt('0x' + hex_value);
    var d = bn.toString(10);
    return d;
}

const lamda = 128; //RSA bit-length 
// const t = bigInt(2).pow(20);
// Generate primes p1 and p2

var DH1 = crypto.createDiffieHellman(lamda/2); // bit length
var p1_hex = DH1.getPrime('hex');
var p1 =bigInt(hextodec(p1_hex));

var DH2 = crypto.createDiffieHellman(lamda/2); // bit length
var p2_hex = DH2.getPrime('hex');
var p2 = bigInt(hextodec(p2_hex));

// confirm if p1 and p2 are prime numbers
console.log(bigInt(p1).isPrime());
console.log(bigInt(p2).isPrime());

var N = bigInt(p1).multiply(p2); // RSA modulus of bit size lamda 

var p1_totient = bigInt(p1).prev();
var p2_totient = bigInt(p2).prev();
var totient = bigInt(p1_totient).multiply(p2_totient);// totient of the N

// security parameter (typically between 128 and 256)
const k = 8;
var d = 2;
// const t = bigInt.randBetween(0, N); //t ∈ N
// const t = bigInt(k).pow(6)
const t = 512;

// const t = 20;

var m = bigInt.randBetween(0, N);
io.on('connection', newConnection);
function newConnection(socket){
    console.log('User connected: '+ socket.id);
    
    io.emit('send_m', m);
    io.emit('send_t', t);
    io.emit('send_N', N);
    io.emit('send_totient', totient);
    io.emit('send_lamda', lamda);
    io.emit('send_d', d);
    io.emit('send_k',k);
}
