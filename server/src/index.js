import express from 'express';
import { fileURLToPath } from 'url';
import path, { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const app = express();
const isProduction = process.env.NODE_ENV === 'production';

// DB Config
const dbConnection = isProduction ? process.env.MONGO_URI_PROD : process.env.MONGO_URI_DEV;

app.use(express.static(path.join(__dirname, 'build')));

app.get('/', function (req, res) {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});


import routes from './routes/index.js';


// Bodyparser Middleware
app.use(expresson());
app.use(express.urlencoded({ extended: true }));

app.use(passport.initialize());
require('./services/jwtStrategy.js');
require('./services/localStrategy.js');



// Connect to Mongo
mongoose
  .connect(dbConnection, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
  })
  .then(() => {
    console.log('MongoDB Connected...');
    //seedDb();
    require('./services/schedule.js');
  })
  .catch((err) => console.log(err));

    
// Use Routes
app.use('/', routes);


if (isProduction) {
  // Set static folder
  app.use(express.static(path.join(__dirname, '../../client/build')));

  app.get('*', (req, res) => {
    res.sendFile(resolve(_dirname, '../..', 'client', 'build', 'index.html')); // index is in /server/src so 2 folders up
  });
}

const port = process.env.PORT || 5000;
  app.listen(port, () => console.log(`Server started on port ${port}`));