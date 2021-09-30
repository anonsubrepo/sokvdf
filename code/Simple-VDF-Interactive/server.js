/******************* Pietrzak's Interactive Protocol*****************/
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

// Function to convert hex values to decimal
function hextodec(hex_value){
    if (hex_value.length % 2) { hex_value = '0' + hex_value; }
    var bn = BigInt('0x' + hex_value);
    var d = bn.toString(10);
    return d;
}

const lamda = 256; //RSA bit-length 
// Generate primes p1 and p2

var DH1 = crypto.createDiffieHellman(lamda/2); // bit length
var p1_hex = DH1.getPrime('hex');
var p1 =bigInt(hextodec(p1_hex));

var DH2 = crypto.createDiffieHellman(lamda/2); // bit length
var p2_hex = DH2.getPrime('hex');
var p2 = bigInt(hextodec(p2_hex));

var N = bigInt(p1).multiply(p2); // RSA modulus of bit size lamda 

var p1_totient = bigInt(p1).prev();
var p2_totient = bigInt(p2).prev();
var totient = bigInt(p1_totient).multiply(p2_totient);// totient of the N

const t = bigInt.randBetween(0, N); //t ∈ N

var m = bigInt.randBetween(0, N);

// Connect to client
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
            //***************** Interactive Protocol *******************
            const y = data;
            find_bit = bigInt(2).pow(lamda); // 2^lamda
            var t_d;
            var t_dash = t;
            var r = [];
            var i = 0;
            var t_dash1;
            // Generate r 
            while (t_dash >= 1){
                t_dash1 = t_dash;
                r[i] = bigInt.randBetween(1, find_bit); // r is a random integer from the set {1,..,2^lamda}
                t_dash = bigInt(t_dash).divide(2);
                if (bigInt(t_dash).isOdd()){
                    t_d = bigInt(t_dash1).add(1);
                    t_dash = bigInt(t_d).divide(2);
                }
                i = i+1;
            }
            io.emit('send_r', r); //Sending all values of r as an array to the client
            // ***************** Verification *******************
            socket.on('send_u', (data) => {
                var u = data;
                var x_one = [];
                var x_two = [];
                var x_dash = [];
                x_dash[0]= x;
                var y_one = [];
                var y_two =[];
                var y_dash = [];
                y_dash[0] = y;
                var j = 0;
                var t_half = t;
                // When t/2 is odd
                if ((t_half >1) && (bigInt(t_half).isOdd())){
                    t_d = bigInt(t).add(1);
                    y_dash[0] = bigInt(y).modPow(2,N);
                    t_half = bigInt(t_d).divide(2);
                  }
                else {
                    t_half = bigInt(t).divide(2);
                  }

                var y_fin, x_fin;
                while (t_half >= 1){
                    x_one[j] = bigInt(x_dash[j]).modPow(r[j], N);
                    x_two[j] = bigInt(x_one[j]).multiply(u[j]);
                    x_dash[j+1] = bigInt(x_two[j]).mod(N); // Calculate x'
            
                    y_one[j] = bigInt(u[j]).modPow(r[j], N);
                    y_two[j] = bigInt(y_one[j]).multiply(y_dash[j]);
                    y_dash[j+1] = bigInt(y_two[j]).mod(N); // Calculate y'

                    // When t/2 is odd
                    if((t_half != 1)&& (bigInt(t_half).isOdd())){
                        t_d = bigInt(t_half).add(1);
                        t_half = bigInt(t_d).divide(2);
                        y_one[j] = bigInt(u[j]).modPow(r[j], N);
                        y_two[j] = bigInt(y_one[j]).multiply(y_dash[j]);
                        y_dash[j+1] = bigInt(y_two[j]).modPow(2,N);
                        
                    }
                    else{
                        t_half = bigInt(t_half).divide(2);
                    }
                    j = j+1; 
                }
                y_fin = y_dash[j];
                x_fin = x_dash[j];
                var x_sqr = bigInt(x_fin).modPow(2, N);
                if (bigInt(y_fin).equals(x_sqr)){
                    socket.emit('verify', "Verified!"); // Send the result of verification to the client
                    console.log("Verified");
                }else{
                    socket.emit('verify', "Could not verify!"); // Send the result of verification to the client
                    console.log("Not verified")
                }
            });
        });
    });  
};
