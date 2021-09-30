/******************* Wesolowski's Interactive Protocol*****************/
var express = require('express');
var app = express();
var server = app.listen(3000);

app.use(express.static('client'));
console.log("My server is running");

var socket = require('socket.io');

var io = socket(server);

//**************VDF Setup********************** 
var bigInt = require("big-integer");

var crypto = require('crypto');

function hextodec(hex_value){
    if (hex_value.length % 2) { hex_value = '0' + hex_value; }
    var bn = BigInt('0x' + hex_value);
    var d = bn.toString(10);
    return d;
};
function getPrime(min, max){
    var no = bigInt.randBetween(min, max)
    if(bigInt(no).isPrime()===true) {
        return no;
    } else {
        return getPrime(min, max);
    }
};

const lamda = 128 //RSA bit-length 
// Generate primes p1 and p2
var DH1 = crypto.createDiffieHellman(lamda/2); // bit length
var p1_hex = DH1.getPrime('hex');
var p1 =bigInt(hextodec(p1_hex));

var DH2 = crypto.createDiffieHellman(lamda/2); // bit length
var p2_hex = DH2.getPrime('hex');
var p2 =bigInt(hextodec(p2_hex));

var N = bigInt(p1).multiply(p2); // RSA modulus of bit size lamda 
var p1_totient = bigInt(p1).prev();
var p2_totient = bigInt(p2).prev();
var totient = bigInt(p1_totient).multiply(p2_totient);// totient of the N

const t = bigInt.randBetween(0, N); //t ∈ N
var m = bigInt.randBetween(0, N);

// Connect to Client
io.on('connection', newConnection);
function newConnection(socket){
    console.log('User connected: '+ socket.id);
    // Send m, t, N and lamda to client who computes the function
    io.emit('send_m', m);
    io.emit('send_t', t);
    io.emit('send_N', N);
    io.emit('send_totient', totient);
    io.emit('send_lamda', lamda);
    socket.on('send_x', (data) => {
        const x = data;
        socket.on('send_y', (data) => {
            const y = data;
            //***************** Interactive Protocol *******************
            find_bit = bigInt(2).pow(lamda); 
            var l = getPrime(1, find_bit); // l is a prime from the set {1,..,2^lamda}
            io.emit('send_prime', l);
            // ***************** Verification *******************
            socket.on('send_proof', (data) => {
                // Receives proof from the client
                var proof = data;
                const r = bigInt(2).modPow(t, l);
                first = bigInt(proof).modPow(l, N)
                second = bigInt(x).modPow(r, N)
                mult = bigInt(first).multiply(second)
                result = bigInt(mult).mod(N)
                if (bigInt(result).equals(y)){
                  socket.emit('verify', "Verified!");
                  console.log("Verified!");
                } else{
                  socket.emit('verify', "Could not verify!");
                  console.log("Could not verify!");
                }
              }); 
        });
    }); 
}
