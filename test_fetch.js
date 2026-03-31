fetch('http://dev.localhost:9006/api/test-cookie')
  .then(r => {
    let output = '';
    for(let [k,v] of r.headers.entries()) {
      output += k + ': ' + v + '\n';
    }
    console.log(output);
  })
  .catch(console.error)
