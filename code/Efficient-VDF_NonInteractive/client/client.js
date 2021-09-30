/******************* Wesolowski's Non-Interactive Protocol*****************/
var socket = io.connect('http://localhost:3000/', {
    reconnection: false
});

socket.on('connect', () => {
  console.log('Successfully connected!');
});

// Function used to calculate hex values to decimal
function hextodec(hex_value){
  if (hex_value.length % 2) { hex_value = '0' + hex_value; }
  var bn = BigInt('0x' + hex_value);
  var d = bn.toString(10);
  return d;
}

// Function used to generate next-prime of a number
function nextPrime(num){
  var pp;
  if (bigInt(num).isOdd() === true){
    for (let i= bigInt(num); i< bigInt(num).multiply(2); i = bigInt(i).add(2)){
      if ((bigInt(i).mod(3) != 0) && (bigInt(i).mod(5) != 0) ){
        if (bigInt(i).isPrime()){ //Primality Test (built-in big-integer method)
          pp = i;
          break;
        }
      }
    }
  }
  else{
    num = bigInt(num).add(1);
    for (let i= bigInt(num); i< bigInt(num).multiply(2); i = bigInt(i).add(2)){
      if ((bigInt(i).mod(3) != 0) && (bigInt(i).mod(5) != 0) ){
        if (bigInt(i).isPrime()){
          pp = i;
          break;
        }
      }
    }
  }
  return pp;
};

socket.on('send_m', (data) => {
  const m = data;
  socket.on('send_t', (data) => {
    const t = data;
    socket.on('send_N', (data) => {
      const N = data;
      socket.on('send_totient', (data) => {
        const totient = data;
        socket.on('send_lamda', (data) => {
          //************ Evaluation ****************/
          const lamda = bigInt(data);
          var m_string = bigInt(m).toString();
          const hash = CryptoJS.SHA256(m_string)
          hash.toString(CryptoJS.enc.Hex);
          const x = bigInt(hextodec(hash)); // x <- H(m)
          const xpow = bigInt(2).modPow(t, totient);
          const y = bigInt(x).modPow(xpow, N); //generate y 
          socket.emit('send_x', x);
          //***************** Proof Construction ******************
          var x_y = bigInt(x).add(y);
          var l = nextPrime(x_y);
          if (bigInt(l).isPrime()){
            const lmod = bigInt(l).modInv(totient);
            const r = bigInt(2).modPow(t, l); // r = 2^t mod l
            const r_dash = bigInt(r).mod(totient);
            const q_r = bigInt(xpow).minus(r_dash);
            const q_dash = bigInt(q_r).mod(totient);
            const q_mult = bigInt(q_dash).multiply(lmod);
            const q = bigInt(q_mult).mod(totient);
            proof = bigInt(x).modPow(q, N);
            socket.emit('send_proof', proof); // Send proof to Server for verification
            socket.emit('send_l',l);

            socket.on('verify', (data)=>{ 
              console.log(data); //Server sends whether verified or not
            });
          } else {
            console.log("l is not prime")
          }
        });
      });
    });
  });
});

