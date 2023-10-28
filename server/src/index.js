const express = require('express');
const {path,join} = require('path');
const app = express();
app.use(express.static(join(__dirname, 'build')));
// app.use('/public', express.static(join(_dirname, '../public')));

app.get('/', function (req, res) {
<<<<<<< HEAD
console.log(1)
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});


app.listen(9000);
=======
  res.sendFile(join(__dirname, 'build', 'index.html'));
});





// app.use('/', routes);

// Serve static assets if in production
// if (isProduction) {
  // Set static folder
  app.use(express.static(join(__dirname, '../../client/build')));

  app.get('*', (req, res) => {
    res.sendFile(resolve(_dirname, '../..', 'client', 'build', 'index.html')); // index is in /server/src so 2 folders up
  });
// }

const port = process.env.PORT || 5000;
  app.listen(port, () => console.log(`Server started on port ${port}`));
>>>>>>> 76f3344bc774e35c69028f42c60e5d8e9cea86b0
