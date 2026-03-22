fetch('http://dev.localhost:9006/api/health')
  .then(r => console.log('health ok'))
  .catch(e => console.log('err'));
