import 'winston-mongodb';
import { createLogger, format, transports } from 'winston';

// Import mongodb
import { configDotenv } from 'dotenv';
const connection = configDotenv().parsed.MONGO_URI_PROD ? configDotenv().parsed.MONGO_URI_PROD : configDotenv().parsed.LOCAL;

const logger = createLogger({
    // transports: [
    //     new transports.MongoDB(
    //         {
    //             lavel : 'error',
    //             db:connection,
    //             options:{ useUnifiedTopology: true },
    //             collection:'error',
    //             format: format.combine(format.timestamp(),format.json()),

    //         }
    //     )
    // ]
});


export default logger;