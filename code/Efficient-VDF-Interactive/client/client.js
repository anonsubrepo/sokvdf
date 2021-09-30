/******************* Wesolowski's Interactive Protocol*****************/
var socket = io.connect('http://localhost:3000/', {
    reconnection: false
});

socket.on('connect', () => {
  console.log('Successfully connected!');
});

// Function used to convert hex values to decimal
function hextodec(hex_value){
  if (hex_value.length % 2) { hex_value = '0' + hex_value; }
  var bn = BigInt('0x' + hex_value);
  var d = bn.toString(10);
  return d;
}
var ciphertext = CryptoJS.AES.encrypt('my message', 'secret key 123').toString();
 
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
          const hash = CryptoJS.SHA256(m_string);
          hash.toString(CryptoJS.enc.Hex);
          const x = bigInt(hextodec(hash)); // x <- H(m)
          const xpow = bigInt(2).modPow(t, totient);
          const y = bigInt(x).modPow(xpow, N); //generate y 
          console.log("The value of y is", y);
          socket.emit('send_x', x);
          socket.emit('send_y', y);
          socket.on('send_prime', (data) => {
            //***************** Proof Construction ******************
            var l = bigInt(data); //2^t = ql + r
            if (bigInt(l).isPrime()){
              const lmod = bigInt(l).modInv(totient);
              const r = bigInt(2).modPow(t, l); // r = 2^t mod l
              const r_dash = bigInt(r).mod(totient);
              const q_r = bigInt(xpow).minus(r_dash);
              const q_dash = bigInt(q_r).mod(totient);
              const q_mult = bigInt(q_dash).multiply(lmod);
              const q = bigInt(q_mult).mod(totient);
              proof = bigInt(x).modPow(q, N);
              socket.emit('send_proof', proof); //Send proof to server for verification
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
});
