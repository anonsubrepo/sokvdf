// const socket = io.connect('http://localhost:3000/');

var socket = io.connect('http://localhost:3000/', {
    reconnection: false
});


socket.on('connect', () => {
  console.log('Successfully connected!');
});

// Function to convert hex values to decimal
function hextodec(hex_value){
  if (hex_value.length % 2) { hex_value = '0' + hex_value; }
  var bn = BigInt('0x' + hex_value);
  var d = bn.toString(10);
  return d;
};


var ciphertext = CryptoJS.AES.encrypt('my message', 'secret key 123').toString();
 
socket.on('send_m', (data) => {
  const m = data;
  socket.on('send_t', (data) => {
    var t = data;
    socket.on('send_N', (data) => {
      const N = data;
      socket.on('send_totient', (data) => {
        const totient = data;
        socket.on('send_lamda', (data) => {
          const lamda = bigInt(data);
          socket.on('send_d', (data) =>{
            const d = data;
            socket.on('send_k', (data) =>{
              const k = data;
              function sketch(x, tt, yy, msg, kk){
                var r = [];
                var x_dash = 1; 
                var y_dash = 1;
                for (let i = 1; i<= kk; i++){
                  var r_one = bigInt(msg[i-1]).add(yy);
                  var r_dash = bigInt(r_one).mod(N);
                  var r_string = bigInt(r_dash).toString();
                  var r_hash = CryptoJS.SHA256(r_string)
                  r_hash.toString(CryptoJS.enc.Hex);
                  r[i] = bigInt(hextodec(r_hash)); 
                  x_dash = bigInt(x_dash).multiply(bigInt(msg[i-1]).modPow(r[i], N));
                }
                var y_dash = bigInt(x_dash).modPow(bigInt(2).modPow(bigInt(tt).divide(kk), totient), N);
                return [x_dash, y_dash];
              };
              
              function prover(xx,tt,yy, kk,dd){
                var k_d = bigInt(kk).pow(dd);
                var yy;
                var msg = [];
                var proof;
                if (bigInt(tt).lesser(k_d)){
                  yy = bigInt(xx).modPow(bigInt(2).modPow(tt, totient), N);
                  proof = null; 
                  return[yy, proof];
                }
                else {
                  yy = bigInt(xx).modPow(bigInt(2).modPow(tt, totient), N);
                  msg[0] = xx;
                  msg[k] = yy;
                  for (let i = 1; i<kk; i++){
                    var pow = (bigInt(i).multiply(bigInt(tt))).divide(kk);
                    msg[i] = bigInt(xx).modPow(bigInt(2).modPow(pow, totient), N); 
                  };
                  var xd_yd = sketch(xx, tt, yy, msg, kk);
                  var x_dash = xd_yd[0];
                  var y_dash = xd_yd[1];
                  var proof_dash = prover(x_dash, bigInt(tt).divide(kk), y_dash, kk, dd);  
                  proof = [msg, proof_dash];
                  return [yy, proof];
                }
              };
              
              function verifier(xx,tt,yy, proof,kk, dd){
                var k_d = bigInt(kk).pow(dd);
                var y_res = bigInt(xx).modPow(bigInt(2).modPow(tt, totient), N);
                if (bigInt(tt).lesser(k_d)){
                  if (bigInt(yy).equals(y_res)){
                    console.log("Accepted");
                  }
                  else {
                    console.log("Rejected");
                  }
                } else {
                  var msg = proof[0];
                  var proof_dash = proof[1];
                  var xd_yd = sketch(xx, tt, yy, msg, kk);
                  var x_dash = xd_yd[0];
                  var y_dash = xd_yd[1];
                  verifier(x_dash, bigInt(tt).divide(kk), y_dash, proof_dash,kk,dd);
                }
              };
              
              function uvdf_eval(xx, tt, PP){
                var kk = PP[2];
                var dd = PP[3];
                var k_d = bigInt(kk).pow(dd);
                var yy;
                var msg = [];
                var proof;
                if (bigInt(tt).lesser(k_d)){
                  yy = bigInt(xx).modPow(bigInt(2).modPow(tt, totient), N);
                  proof = null;
                  return [yy, null];
                }
                else{
                  yy = bigInt(xx).modPow(bigInt(2).modPow(tt, totient), N);
                  msg[0] = xx;
                  msg[k] = yy;
                  for (let i = 1; i<kk; i++){
                    var pow = (bigInt(i).multiply(bigInt(tt))).divide(kk);
                    msg[i] = bigInt(xx).modPow(bigInt(2).modPow(pow, totient), N);
                  }
                  var xd_yd = sketch(xx, tt, yy, msg, kk);
                  var x_dash = xd_yd[0];
                  var y_dash = xd_yd[1];
                  var proof_dash = prover(x_dash, bigInt(tt).divide(k), y_dash, kk, dd);
                  proof = [msg, proof_dash,x_dash, y_dash];
                  return [yy, proof];
                }
              };
              
              function uvdf_verify(xx,tt,yy,proof,PP,kk,dd){
                var k_d = bigInt(kk).pow(dd);
                var y_res = bigInt(xx).modPow(bigInt(2).modPow(tt, totient), N);
                if (bigInt(tt).lesser(k_d)){
                  if (bigInt(yy).equals(y_res)){
                    console.log("Accepted");
                  }
                  else {
                   console.log("Rejected");
                  }
                } else {
                  var msg = proof[0];
                  var proof_dash = proof[1];
                  var x_dash = proof[2];
                  var y_dash = proof[3];
                  // var xd_yd = sketch(xx, tt, yy, msg, kk);
                  // var x_dash = xd_yd[0];
                  // var y_dash = xd_yd[1];
                  return verifier(x_dash, bigInt(tt).divide(kk), y_dash, proof_dash, kk,dd);
                }
              };
              
              var m_string = bigInt(m).toString();
              const hash = CryptoJS.SHA256(m_string)
              hash.toString(CryptoJS.enc.Hex);
              const x = bigInt(hextodec(hash)); // x <- H(m)
              var k_d = bigInt(k).pow(d);
              var PP = [N, t, k, d];
              var eval = uvdf_eval(x, t, PP);
              var y = eval[0];
              var proof = eval[1];
              uvdf_verify(x,t,y,proof,PP,k,d);
            });
          });
        });
      });
    });
  });
});




