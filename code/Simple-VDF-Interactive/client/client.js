/******************* Pietrzak's Interactive Protocol*****************/
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
}

socket.on('send_m', (data) => {
  const m = data;
  socket.on('send_t', (data) => {
    var t = data;
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
          socket.emit("send_y", y);
          //************ Proof Construction ****************/
          socket.on('send_r', (data) => {
            var r = data;
            var x_one = [];
            var x_two = [];
            var x_dash = [];
            x_dash[0] = x;
            var y_one = [];
            var y_two = [];
            var y_dash = [];
            y_dash[0] = y;
            var upow=[];
            var u = [];
            var i = 0;
            var t_half1;
            var t_half = t;
            var t_d;
            // When t/2 is odd
            if (bigInt(t_half).isOdd()){
              t_d = bigInt(t).add(1);
              t_half = bigInt(t_d).divide(2);
              y_dash[0] = bigInt(y).modPow(2,N);
            }else{
              t_half = bigInt(t).divide(2);
            }

            while (t_half >=1){
              t_half1 = t_half;
              upow[i] = bigInt(2).modPow(t_half, totient);
              u[i] = bigInt(x_dash[i]).modPow(upow[i], N); // Calculate u
              x_one[i] = bigInt(x_dash[i]).modPow(r[i], N);
              x_two[i] = bigInt(x_one[i]).multiply(u[i]);
              x_dash[i+1] = bigInt(x_two[i]).mod(N); // Calculate x'

              y_one[i] = bigInt(u[i]).modPow(r[i], N);
              y_two[i] = bigInt(y_one[i]).multiply(y_dash[i]);
              y_dash[i+1] = bigInt(y_two[i]).mod(N); // Calculate y'

               // When t/2 is odd
              if((t_half != 1)&& (bigInt(t_half).isOdd())){
                t_d = bigInt(t_half).add(1);
                t_half = bigInt(t_d).divide(2);
                y_dash[i+1] = bigInt(y_two[i]).modPow(2,N);
              } 
              else{
                t_half = bigInt(t_half).divide(2);
              }
              i = i+1;
            };
            socket.emit('send_u', u); // Send proof to Server for verification
            socket.on('verify', (data)=>{ 
              console.log(data); //Server sends whether verified or not
            });
          });
        });
      });
    });
  });
});




